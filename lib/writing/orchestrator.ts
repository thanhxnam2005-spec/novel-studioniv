import { db } from "@/lib/db";
import type { WritingAgentRole } from "@/lib/db";
import { resolveStep } from "@/lib/ai/resolve-step";
import { getDefaultPrompt } from "./prompts";
import { buildWritingContext } from "./context-builder";
import { runContextAgent } from "./agents/context-agent";
import { runDirectionAgent } from "./agents/direction-agent";
import { runOutlineAgent } from "./agents/outline-agent";
import { runSmartWriterAgent } from "./agents/smart-writer-agent";
import { runWriterAgent } from "./agents/writer-agent";
import { runReviewAgent } from "./agents/review-agent";
import { buildSyntheticContextOutput } from "./synthetic-context";
import { runRewriteAgent } from "./agents/rewrite-agent";
import type {
  AgentConfig,
  ContextAgentOutput,
  OutlineAgentOutput,
  ReviewAgentOutput,
  WritingContext,
} from "./types";
import type { LanguageModel } from "ai";

// ─── Types ──────────────────────────────────────────────────

export type PipelineResult =
  | "awaiting-input"
  | "completed"
  | "error"
  | "stale-context";

export interface WritingPipelineOptions {
  novelId: string;
  sessionId: string;
  abortSignal?: AbortSignal;
  onStepStart?: (role: WritingAgentRole) => void;
  onStepComplete?: (role: WritingAgentRole) => void;
  onWriterChunk?: (text: string) => void;
  /** Ephemeral user instructions per pipeline step (not persisted). */
  stepUserInstructions?: Partial<Record<WritingAgentRole, string>>;
}

const STEP_ORDER: WritingAgentRole[] = [
  "context",
  "direction",
  "outline",
  "writer",
  "review",
];

// ─── Helpers ────────────────────────────────────────────────

async function getDefaultModel(): Promise<LanguageModel | undefined> {
  const chatSettings = await db.chatSettings.get("default");
  if (!chatSettings?.providerId || !chatSettings?.modelId) return undefined;
  return resolveStep({
    providerId: chatSettings.providerId,
    modelId: chatSettings.modelId,
  });
}

async function getAgentConfig(
  novelId: string,
  role: WritingAgentRole,
  abortSignal?: AbortSignal,
): Promise<AgentConfig> {
  const [settings, chatSettings] = await Promise.all([
    db.writingSettings.get(novelId),
    db.chatSettings.get("default"),
  ]);

  // Resolve model: per-step config → default chat model
  const stepModelKey = `${role}Model` as const;
  const stepModelConfig = settings?.[stepModelKey];
  let model = stepModelConfig
    ? await resolveStep(stepModelConfig)
    : undefined;
  if (!model) {
    model = await getDefaultModel();
  }
  if (!model) {
    throw new Error(
      "Không tìm thấy mô hình AI. Vui lòng cấu hình nhà cung cấp AI trong Cài đặt.",
    );
  }

  // Resolve prompt: per-step custom → default
  const stepPromptKey = `${role}Prompt` as const;
  const systemPrompt = settings?.[stepPromptKey] || getDefaultPrompt(role);
  const globalInstruction = chatSettings?.globalSystemInstruction;

  return {
    model,
    systemPrompt,
    globalInstruction,
    abortSignal,
  };
}

function nextStep(current: WritingAgentRole): WritingAgentRole | null {
  const idx = STEP_ORDER.indexOf(current);
  return idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : null;
}

async function getStepOutput(
  sessionId: string,
  role: WritingAgentRole,
): Promise<string | undefined> {
  const result = await db.writingStepResults
    .where("[sessionId+role]")
    .equals([sessionId, role])
    .first();
  return result?.output ?? undefined;
}

async function writeStepResult(
  sessionId: string,
  role: WritingAgentRole,
  status: "running" | "completed" | "error",
  output?: string,
  error?: string,
) {
  const existing = await db.writingStepResults
    .where("[sessionId+role]")
    .equals([sessionId, role])
    .first();

  const now = new Date();
  if (existing) {
    await db.writingStepResults.update(existing.id, {
      status,
      output: output ?? existing.output,
      error,
      completedAt: status === "completed" || status === "error" ? now : undefined,
    });
  } else {
    await db.writingStepResults.add({
      id: crypto.randomUUID(),
      sessionId,
      role,
      status,
      output,
      error,
      startedAt: now,
      completedAt: status === "completed" ? now : undefined,
    });
  }
}

async function persistCompletedContextStep(
  sessionId: string,
  output: ContextAgentOutput,
  writingContext: WritingContext,
) {
  await writeStepResult(
    sessionId,
    "context",
    "completed",
    JSON.stringify(output),
  );
  await db.writingSessions.update(sessionId, {
    contextHash: writingContext.hash,
    updatedAt: new Date(),
  });
}

// ─── Main Pipeline Function ─────────────────────────────────

/**
 * Run (or resume) the writing pipeline for a session.
 * Reads current step from WritingSession, runs agents sequentially.
 * Returns "awaiting-input" at Direction and Outline steps for user interaction.
 */
export async function runWritingPipeline(
  options: WritingPipelineOptions,
): Promise<PipelineResult> {
  const {
    novelId,
    sessionId,
    abortSignal,
    onStepStart,
    onStepComplete,
    onWriterChunk,
    stepUserInstructions,
  } = options;

  const session = await db.writingSessions.get(sessionId);
  if (!session) throw new Error("Writing session not found");

  const chapterPlan = await db.chapterPlans.get(session.chapterPlanId);
  if (!chapterPlan) throw new Error("Chapter plan not found");

  const settings = await db.writingSettings.get(novelId);
  const chapterLength = settings?.chapterLength ?? 3000;
  const smartMode = session.pipelineMode === "smart";

  // ── Stale context check on resume ─────────────────────────
  if (session.contextHash && session.currentStep !== "context") {
    const { hash: currentHash } = await buildWritingContext(
      novelId,
      chapterPlan.chapterOrder,
    );
    if (currentHash !== session.contextHash) {
      return "stale-context";
    }
  }

  // ── Update session + plan status ───────────────────────────
  await db.writingSessions.update(sessionId, {
    status: "active",
    updatedAt: new Date(),
  });
  await db.chapterPlans.update(session.chapterPlanId, {
    status: "writing",
    updatedAt: new Date(),
  });

  let currentStep = session.currentStep;

  // ── Step loop ─────────────────────────────────────────────
  while (currentStep) {
    // Check if step already completed (resume scenario)
    const existingResult = await db.writingStepResults
      .where("[sessionId+role]")
      .equals([sessionId, currentStep])
      .first();

    if (existingResult?.status === "completed") {
      // If Direction or Outline just completed, check if user has interacted
      if (currentStep === "direction" && chapterPlan.directions.length === 0) {
        return "awaiting-input";
      }
      if (currentStep === "outline" && !chapterPlan.outline) {
        return "awaiting-input";
      }
      const next = nextStep(currentStep);
      if (!next) break;
      currentStep = next;
      await db.writingSessions.update(sessionId, {
        currentStep,
        updatedAt: new Date(),
      });
      continue;
    }

    // Clear previous error so the step can be re-run
    if (existingResult?.status === "error") {
      await db.writingStepResults.delete(existingResult.id);
    }

    try {
      onStepStart?.(currentStep);

      if (currentStep === "context" && smartMode) {
        await writeStepResult(sessionId, "context", "running");
        const { output, writingContext } = await buildSyntheticContextOutput(
          novelId,
          chapterPlan.chapterOrder,
        );
        await persistCompletedContextStep(sessionId, output, writingContext);
        onStepComplete?.("context");
        const nextAfterCtx = nextStep("context");
        if (!nextAfterCtx) break;
        currentStep = nextAfterCtx;
        await db.writingSessions.update(sessionId, {
          currentStep,
          updatedAt: new Date(),
        });
        continue;
      }

      const config = await getAgentConfig(novelId, currentStep, abortSignal);
      const userInstruction = stepUserInstructions?.[currentStep];
      const configWithUser: AgentConfig = {
        ...config,
        ...(userInstruction?.trim()
          ? { userInstruction: userInstruction.trim() }
          : {}),
      };
      await writeStepResult(sessionId, currentStep, "running");

      switch (currentStep) {
        case "context": {
          const { output, writingContext } = await runContextAgent(
            { novelId, chapterOrder: chapterPlan.chapterOrder },
            configWithUser,
          );
          await persistCompletedContextStep(sessionId, output, writingContext);
          break;
        }

        case "direction": {
          const contextJson = await getStepOutput(sessionId, "context");
          if (!contextJson) throw new Error("Context output not found");
          const contextOutput: ContextAgentOutput = JSON.parse(contextJson);
          const plotArcs = await db.plotArcs
            .where("novelId")
            .equals(novelId)
            .toArray();

          const directionOutput = await runDirectionAgent(
            contextOutput,
            plotArcs,
            configWithUser,
          );
          await writeStepResult(
            sessionId,
            "direction",
            "completed",
            JSON.stringify(directionOutput),
          );
          onStepComplete?.(currentStep);
          // Pause for user to select directions
          return "awaiting-input";
        }

        case "outline": {
          const contextJson = await getStepOutput(sessionId, "context");
          if (!contextJson) throw new Error("Context output not found");
          const contextOutput: ContextAgentOutput = JSON.parse(contextJson);

          const outlineOutput = await runOutlineAgent(
            contextOutput,
            chapterPlan.directions,
            chapterLength,
            configWithUser,
          );
          await writeStepResult(
            sessionId,
            "outline",
            "completed",
            JSON.stringify(outlineOutput),
          );
          // Update chapter plan with outline data
          await db.chapterPlans.update(chapterPlan.id, {
            outline: outlineOutput.synopsis,
            scenes: outlineOutput.scenes.map((s) => ({
              title: s.title,
              summary: s.summary,
              characters: s.characters,
              location: s.location,
              mood: s.mood,
            })),
            title: outlineOutput.chapterTitle,
            updatedAt: new Date(),
          });
          onStepComplete?.(currentStep);
          // Pause for user to review/edit outline
          return "awaiting-input";
        }

        case "writer": {
          const contextJson = await getStepOutput(sessionId, "context");
          const outlineJson = await getStepOutput(sessionId, "outline");
          if (!contextJson || !outlineJson)
            throw new Error("Previous step outputs not found");

          const contextOutput: ContextAgentOutput = JSON.parse(contextJson);
          const outlineOutput: OutlineAgentOutput = JSON.parse(outlineJson);

          configWithUser.systemPrompt = configWithUser.systemPrompt.replace(
            "{chapterLength}",
            String(chapterLength),
          );

          const chatSettings = await db.chatSettings.get("default");
          const smartWriterMaxSteps =
            settings?.smartWriterMaxToolSteps ??
            chatSettings?.maxToolSteps ??
            15;

          const content = smartMode
            ? await runSmartWriterAgent(
                {
                  novelId,
                  chapterOrder: chapterPlan.chapterOrder,
                  contextOutput,
                  outline: outlineOutput,
                },
                configWithUser,
                chapterLength,
                smartWriterMaxSteps,
                onWriterChunk,
              )
            : await runWriterAgent(
                {
                  novelId,
                  chapterOrder: chapterPlan.chapterOrder,
                  contextOutput,
                  outline: outlineOutput,
                },
                configWithUser,
                onWriterChunk,
              );

          await writeStepResult(sessionId, "writer", "completed", content);
          await db.chapterPlans.update(chapterPlan.id, {
            status: "written",
            updatedAt: new Date(),
          });
          break;
        }

        case "review": {
          const contextJson = await getStepOutput(sessionId, "context");
          const writerOutput = await getStepOutput(sessionId, "writer");
          if (!contextJson || !writerOutput)
            throw new Error("Previous step outputs not found");

          const contextOutput: ContextAgentOutput = JSON.parse(contextJson);
          const reviewOutput = await runReviewAgent(
            contextOutput,
            writerOutput,
            configWithUser,
          );
          await writeStepResult(
            sessionId,
            "review",
            "completed",
            JSON.stringify(reviewOutput),
          );
          await db.chapterPlans.update(chapterPlan.id, {
            status: "reviewed",
            updatedAt: new Date(),
          });
          break;
        }
      }

      onStepComplete?.(currentStep);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        await db.writingSessions.update(sessionId, {
          status: "paused",
          updatedAt: new Date(),
        });
        return "awaiting-input";
      }

      const errorMsg =
        err instanceof Error ? err.message : "Unknown error";
      await writeStepResult(sessionId, currentStep, "error", undefined, errorMsg);
      await db.writingSessions.update(sessionId, {
        status: "error",
        updatedAt: new Date(),
      });
      return "error";
    }

    // Advance to next step
    const next = nextStep(currentStep);
    if (!next) break;
    currentStep = next;
    await db.writingSessions.update(sessionId, {
      currentStep,
      updatedAt: new Date(),
    });
  }

  // Pipeline completed
  await db.writingSessions.update(sessionId, {
    status: "completed",
    updatedAt: new Date(),
  });
  return "completed";
}

// ─── Rewrite (separate from pipeline) ───────────────────────

export interface RewriteOptions {
  novelId: string;
  sessionId: string;
  abortSignal?: AbortSignal;
  onChunk?: (text: string) => void;
  userInstruction?: string;
}

/**
 * Run the rewrite step separately. Takes the writer output + review output,
 * rewrites the chapter, and saves as a "rewrite" step result.
 * Triggered by user after reviewing the chapter.
 */
export async function runRewriteStep(
  options: RewriteOptions,
): Promise<"completed" | "error"> {
  const { novelId, sessionId, abortSignal, onChunk, userInstruction } = options;

  const writerOutput = await getStepOutput(sessionId, "writer");
  const reviewJson = await getStepOutput(sessionId, "review");

  if (!writerOutput || !reviewJson) {
    throw new Error("Writer and review outputs required for rewrite");
  }

  const review: ReviewAgentOutput = JSON.parse(reviewJson);

  // Delete previous rewrite result if exists
  const existing = await db.writingStepResults
    .where("[sessionId+role]")
    .equals([sessionId, "rewrite"])
    .first();
  if (existing) await db.writingStepResults.delete(existing.id);

  await writeStepResult(sessionId, "rewrite", "running");

  try {
    const config = await getAgentConfig(novelId, "rewrite", abortSignal);
    const configWithUser: AgentConfig = {
      ...config,
      ...(userInstruction?.trim()
        ? { userInstruction: userInstruction.trim() }
        : {}),
    };

    const rewrittenContent = await runRewriteAgent(
      writerOutput,
      review,
      configWithUser,
      onChunk,
    );

    await writeStepResult(sessionId, "rewrite", "completed", rewrittenContent);
    return "completed";
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return "error";
    }
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    await writeStepResult(sessionId, "rewrite", "error", undefined, errorMsg);
    return "error";
  }
}
