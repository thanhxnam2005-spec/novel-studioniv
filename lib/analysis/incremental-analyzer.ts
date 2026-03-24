/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LanguageModel } from "ai";
import { generateText, stepCountIs } from "ai";
import { db } from "@/lib/db";
import { analyzeChapter, analyzeBatchChapters } from "./chapter-analyzer";
import { aggregationTools, characterTools } from "./incremental-tools";
import { getChaptersNeedingAnalysis } from "./incremental";
import {
  type CustomPrompts,
  resolvePrompts,
  buildCharacterPrompt,
} from "./prompts";
import type { AnalysisProgress, ChapterAnalysisResult } from "./types";
import {
  type AnalysisDepth,
  getBudget,
  estimateTokens,
  batchChapters,
  capCharacterMentions,
  type BatchItem,
} from "./token-budget";

const CONCURRENCY_LIMIT = 3;

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;
  async function runNext(): Promise<void> {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      results[index] = await tasks[index]();
    }
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () =>
    runNext(),
  );
  await Promise.all(workers);
  return results;
}

export interface IncrementalAnalyzeOptions {
  novelId: string;
  defaultModel: LanguageModel;
  signal?: AbortSignal;
  onProgress?: (progress: AnalysisProgress) => void;
  depth?: AnalysisDepth;
  customPrompts?: CustomPrompts;
  stepModels?: {
    chapters?: LanguageModel;
    aggregation?: LanguageModel;
    characters?: LanguageModel;
  };
  globalSystemInstruction?: string;
}

/**
 * Incremental novel analysis:
 * 1. Only analyze chapters that changed or are new
 * 2. Use tool calls to surgically update existing analysis (not regenerate)
 * 3. Use tool calls to update/add character profiles
 */
export async function analyzeNovelIncremental({
  novelId,
  defaultModel,
  signal,
  onProgress,
  depth = "standard",
  customPrompts,
  stepModels,
  globalSystemInstruction,
}: IncrementalAnalyzeOptions): Promise<void> {
  const budget = getBudget(depth);
  const rawPrompts = resolvePrompts(customPrompts);
  const g = globalSystemInstruction?.trim();
  const prepend = (s: string) => (g ? `${g}\n\n${s}` : s);

  const chapterModel = stepModels?.chapters ?? defaultModel;
  const aggregationModel = stepModels?.aggregation ?? defaultModel;
  const characterModel = stepModels?.characters ?? defaultModel;

  // Determine which chapters need work
  const { needsAnalysis, upToDate } =
    await getChaptersNeedingAnalysis(novelId);

  if (needsAnalysis.length === 0) {
    throw new Error("All chapters are up to date — nothing to analyze");
  }

  const allChapters = [...upToDate, ...needsAnalysis].sort(
    (a, b) => a.order - b.order,
  );

  // Get or create analysis record
  const existingAnalysis = await db.novelAnalyses
    .where("novelId")
    .equals(novelId)
    .first();

  const analysisId = existingAnalysis?.id ?? crypto.randomUUID();
  const now = new Date();
  const totalToAnalyze = needsAnalysis.length;

  if (existingAnalysis) {
    await db.novelAnalyses.update(analysisId, {
      analysisStatus: "analyzing",
      chaptersAnalyzed: 0,
      totalChapters: totalToAnalyze,
      error: undefined,
      updatedAt: now,
    });
  } else {
    await db.novelAnalyses.add({
      id: analysisId,
      novelId,
      genres: [],
      tags: [],
      synopsis: "",
      analysisStatus: "analyzing",
      chaptersAnalyzed: 0,
      totalChapters: totalToAnalyze,
      createdAt: now,
      updatedAt: now,
    });
  }

  try {
    // ── Phase 1: Analyze only changed/new chapters ──────────

    const chapterContents: BatchItem[] = [];
    for (const chapter of needsAnalysis) {
      const scenes = await db.scenes
        .where("chapterId")
        .equals(chapter.id)
        .sortBy("order");
      const content = scenes.map((s) => s.content).join("\n\n");
      chapterContents.push({
        chapterIndex: allChapters.findIndex((c) => c.id === chapter.id),
        title: chapter.title,
        content,
        tokens: estimateTokens(content),
      });
    }

    const batches = batchChapters(chapterContents, budget.batchTargetTokens);
    let chaptersCompleted = 0;
    const newChapterResults: {
      chapterId: string;
      title: string;
      result: ChapterAnalysisResult;
    }[] = [];

    const batchTasks = batches.map((batch) => async () => {
      signal?.throwIfAborted();
      let results: ChapterAnalysisResult[];

      if (batch.length === 1) {
        const item = batch[0];
        if (!item.content.trim()) {
          results = [
            { summary: "Empty chapter", keyScenes: [], characters: [] },
          ];
        } else {
          results = [
            await analyzeChapter(
              chapterModel,
              item.title,
              item.content,
              signal,
              budget.maxChapterTokens,
              prepend(rawPrompts.chapterAnalysis),
            ),
          ];
        }
      } else {
        const nonEmpty = batch.filter((b) => b.content.trim());
        if (nonEmpty.length === 0) {
          results = batch.map(() => ({
            summary: "Empty chapter",
            keyScenes: [],
            characters: [],
          }));
        } else {
          const batchResults = await analyzeBatchChapters(
            chapterModel,
            nonEmpty.map((b) => ({ title: b.title, content: b.content })),
            signal,
            budget.maxChapterTokens,
            prepend(rawPrompts.batchChapterAnalysis),
          );
          let resultIdx = 0;
          results = batch.map((b) => {
            if (!b.content.trim()) {
              return {
                summary: "Empty chapter",
                keyScenes: [],
                characters: [],
              };
            }
            return batchResults[resultIdx++];
          });
        }
      }

      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];
        const chapter = allChapters[item.chapterIndex];
        const result = results[i];
        const ts = new Date();

        await db.chapters.update(chapter.id, {
          summary: result.summary,
          analyzedAt: ts,
          updatedAt: ts,
        });

        newChapterResults.push({
          chapterId: chapter.id,
          title: item.title,
          result,
        });

        chaptersCompleted++;
        await db.novelAnalyses.update(analysisId, {
          chaptersAnalyzed: chaptersCompleted,
          updatedAt: new Date(),
        });
        onProgress?.({
          phase: "chapters",
          chaptersCompleted,
          totalChapters: totalToAnalyze,
        });
      }
    });

    await runWithConcurrency(batchTasks, CONCURRENCY_LIMIT);

    // ── Phase 2: Incremental aggregation via tool calls ─────
    signal?.throwIfAborted();
    onProgress?.({
      phase: "aggregation",
      chaptersCompleted: totalToAnalyze,
      totalChapters: totalToAnalyze,
    });

    const currentAnalysis = await db.novelAnalyses.get(analysisId);

    const newSummariesText = newChapterResults
      .map((cr) => `### ${cr.title}\n${cr.result.summary}`)
      .join("\n\n");

    const aggregationResult = await generateText({
      model: aggregationModel,
      system: prepend(
        `You are a literary analyst updating an existing novel analysis with new chapter content.
You have tools to update specific parts of the analysis.
Only call tools for fields that need changes based on the new chapters.
If a field is unaffected, do NOT call that tool.
You may call multiple tools.`,
      ),
      prompt: `## Current Analysis
${JSON.stringify(
  {
    genres: currentAnalysis?.genres ?? [],
    tags: currentAnalysis?.tags ?? [],
    synopsis: currentAnalysis?.synopsis ?? "",
    worldOverview: currentAnalysis?.worldOverview ?? "",
    powerSystem: currentAnalysis?.powerSystem,
    storySetting: currentAnalysis?.storySetting ?? "",
    factions: currentAnalysis?.factions ?? [],
    keyLocations: currentAnalysis?.keyLocations ?? [],
  },
  null,
  2,
)}

## New Chapter Summaries
${newSummariesText}

Based on these new chapters, call the appropriate tools to update the analysis.`,
      tools: aggregationTools,
      stopWhen: stepCountIs(5),
      abortSignal: signal,
    });

    // Apply aggregation tool calls
    for (const step of aggregationResult.steps) {
      for (const tc of step.toolCalls as any[]) {
        switch (tc.toolName) {
          case "update_synopsis":
            await db.novelAnalyses.update(analysisId, {
              synopsis: (tc as any).input.synopsis,
              updatedAt: new Date(),
            });
            break;
          case "update_genres_tags":
            await db.novelAnalyses.update(analysisId, {
              genres: (tc as any).input.genres,
              tags: (tc as any).input.tags,
              updatedAt: new Date(),
            });
            break;
          case "update_world_building": {
            const updates: any = {
              updatedAt: new Date(),
            };
            if ((tc as any).input.worldOverview !== undefined)
              updates.worldOverview = (tc as any).input.worldOverview;
            if ((tc as any).input.powerSystem !== undefined)
              updates.powerSystem = (tc as any).input.powerSystem ?? undefined;
            if ((tc as any).input.storySetting !== undefined)
              updates.storySetting = (tc as any).input.storySetting;
            if ((tc as any).input.timePeriod !== undefined)
              updates.timePeriod = (tc as any).input.timePeriod ?? undefined;
            if ((tc as any).input.worldRules !== undefined)
              updates.worldRules = (tc as any).input.worldRules ?? undefined;
            if ((tc as any).input.technologyLevel !== undefined)
              updates.technologyLevel = (tc as any).input.technologyLevel ?? undefined;
            await db.novelAnalyses.update(analysisId, updates);
            break;
          }
          case "add_faction": {
            const analysis = await db.novelAnalyses.get(analysisId);
            const factions = [...(analysis?.factions ?? []), (tc as any).input];
            await db.novelAnalyses.update(analysisId, {
              factions,
              updatedAt: new Date(),
            });
            break;
          }
          case "update_faction": {
            const analysis = await db.novelAnalyses.get(analysisId);
            const factions = (analysis?.factions ?? []).map((f) =>
              f.name.toLowerCase() === (tc as any).input.name.toLowerCase()
                ? { name: f.name, description: (tc as any).input.description }
                : f,
            );
            await db.novelAnalyses.update(analysisId, {
              factions,
              updatedAt: new Date(),
            });
            break;
          }
          case "add_location": {
            const analysis = await db.novelAnalyses.get(analysisId);
            const locs = [...(analysis?.keyLocations ?? []), (tc as any).input];
            await db.novelAnalyses.update(analysisId, {
              keyLocations: locs,
              updatedAt: new Date(),
            });
            break;
          }
          case "update_location": {
            const analysis = await db.novelAnalyses.get(analysisId);
            const locs = (analysis?.keyLocations ?? []).map((l) =>
              l.name.toLowerCase() === (tc as any).input.name.toLowerCase()
                ? { name: l.name, description: (tc as any).input.description }
                : l,
            );
            await db.novelAnalyses.update(analysisId, {
              keyLocations: locs,
              updatedAt: new Date(),
            });
            break;
          }
        }
      }
    }

    // ── Phase 3: Incremental character update via tool calls ──
    signal?.throwIfAborted();
    onProgress?.({
      phase: "characters",
      chaptersCompleted: totalToAnalyze,
      totalChapters: totalToAnalyze,
    });

    // Gather new character mentions
    const rawCharacterMap = new Map<string, string[]>();
    for (const cr of newChapterResults) {
      for (const char of cr.result.characters) {
        const key = char.name.toLowerCase().trim();
        const existing = rawCharacterMap.get(key) ?? [];
        existing.push(
          `[${cr.title}] (${char.role}) ${char.noteInChapter}`,
        );
        rawCharacterMap.set(key, existing);
      }
    }

    const characterMap = capCharacterMentions(
      rawCharacterMap,
      budget.maxMentionsPerCharacter,
      budget.maxCharactersToProfile,
    );

    if (characterMap.size > 0) {
      // Get existing characters
      const existingCharacters = await db.characters
        .where("novelId")
        .equals(novelId)
        .toArray();

      const existingProfilesText = existingCharacters
        .map(
          (c) =>
            `- **${c.name}** (${c.role}): ${c.description ?? "No description"}`,
        )
        .join("\n");

      const nameKeyMap = new Map<string, string>();
      for (const cr of newChapterResults) {
        for (const char of cr.result.characters) {
          const key = char.name.toLowerCase().trim();
          if (!nameKeyMap.has(key) && characterMap.has(key)) {
            nameKeyMap.set(key, char.name);
          }
        }
      }

      const characterNotes: { name: string; mentions: string[] }[] = [];
      for (const [key, mentions] of characterMap.entries()) {
        characterNotes.push({
          name: nameKeyMap.get(key) ?? key,
          mentions,
        });
      }

      const mentionsText = buildCharacterPrompt(characterNotes);

      const charResult = await generateText({
        model: characterModel,
        system: prepend(
          `You are a literary analyst updating character profiles with information from new chapters.
You have tools to add new characters or update existing ones.
Only call tools for characters affected by the new chapters.
Do not recreate existing characters that are unchanged.`,
        ),
        prompt: `## Existing Characters
${existingProfilesText || "None yet."}

## New Character Mentions (from newly analyzed chapters)
${mentionsText}

Based on these new mentions, call the appropriate tools to add or update characters.`,
        tools: characterTools,
        stopWhen: stepCountIs(10),
        abortSignal: signal,
      });

      // Apply character tool calls
      const ts = new Date();
      for (const step of charResult.steps) {
        for (const tc of step.toolCalls as any[]) {
          switch (tc.toolName) {
            case "add_character": {
              const existing = await db.characters
                .where("novelId")
                .equals(novelId)
                .filter(
                  (c) =>
                    c.name.toLowerCase().trim() ===
                    (tc as any).input.name.toLowerCase().trim(),
                )
                .first();
              if (!existing) {
                await db.characters.add({
                  id: crypto.randomUUID(),
                  novelId,
                  name: (tc as any).input.name,
                  role: (tc as any).input.role,
                  description: (tc as any).input.description,
                  age: (tc as any).input.age,
                  sex: (tc as any).input.sex,
                  appearance: (tc as any).input.appearance,
                  personality: (tc as any).input.personality,
                  hobbies: (tc as any).input.hobbies,
                  relationshipWithMC: (tc as any).input.relationshipWithMC,
                  relationships: (tc as any).input.relationships,
                  characterArc: (tc as any).input.characterArc,
                  strengths: (tc as any).input.strengths,
                  weaknesses: (tc as any).input.weaknesses,
                  motivations: (tc as any).input.motivations,
                  goals: (tc as any).input.goals,
                  createdAt: ts,
                  updatedAt: ts,
                });
              }
              break;
            }
            case "update_character": {
              const char = await db.characters
                .where("novelId")
                .equals(novelId)
                .filter(
                  (c) =>
                    c.name.toLowerCase().trim() ===
                    (tc as any).input.name.toLowerCase().trim(),
                )
                .first();
              if (char) {
                const { name: _, ...updates } = (tc as any).input;
                const filtered = Object.fromEntries(
                  Object.entries(updates).filter(([, v]) => v !== undefined),
                );
                if (Object.keys(filtered).length > 0) {
                  await db.characters.update(char.id, {
                    ...filtered,
                    updatedAt: ts,
                  });
                }
              }
              break;
            }
            case "add_relationship": {
              const char = await db.characters
                .where("novelId")
                .equals(novelId)
                .filter(
                  (c) =>
                    c.name.toLowerCase().trim() ===
                    (tc as any).input.characterName.toLowerCase().trim(),
                )
                .first();
              if (char) {
                const rels = [...(char.relationships ?? [])];
                rels.push({
                  characterName: (tc as any).input.relatedTo,
                  description: (tc as any).input.description,
                });
                await db.characters.update(char.id, {
                  relationships: rels,
                  updatedAt: ts,
                });
              }
              break;
            }
          }
        }
      }

      // Update chapter characterIds for newly analyzed chapters
      for (const cr of newChapterResults) {
        const charNames = cr.result.characters.map((c) =>
          c.name.toLowerCase().trim(),
        );
        const charRecords = await db.characters
          .where("novelId")
          .equals(novelId)
          .filter((c) => charNames.includes(c.name.toLowerCase().trim()))
          .toArray();
        await db.chapters.update(cr.chapterId, {
          characterIds: charRecords.map((c) => c.id),
          updatedAt: new Date(),
        });
      }
    }

    // ── Mark Complete ───────────────────────────────────────
    await db.novelAnalyses.update(analysisId, {
      analysisStatus: "completed",
      updatedAt: new Date(),
    });
    onProgress?.({
      phase: "complete",
      chaptersCompleted: totalToAnalyze,
      totalChapters: totalToAnalyze,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await db.novelAnalyses.update(analysisId, {
      analysisStatus: "failed",
      error: errorMessage,
      updatedAt: new Date(),
    });
    throw error;
  }
}
