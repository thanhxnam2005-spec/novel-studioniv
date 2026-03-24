// ─── Custom Prompts Interface ───────────────────────────────

export interface CustomPrompts {
  chapterAnalysis?: string;
  novelAggregation?: string;
  characterProfiling?: string;
}

// ─── Default System Prompts ─────────────────────────────────

export const DEFAULT_CHAPTER_ANALYSIS_SYSTEM = `You are a literary analyst. Analyze the given chapter of a novel.
Extract:
1. A concise summary (2-4 sentences)
2. Key scenes or events that happen
3. All characters that appear or are mentioned, noting their role and what they did

Be thorough but concise. Focus on plot-relevant details.`;

export const DEFAULT_NOVEL_AGGREGATION_SYSTEM = `You are a literary analyst. Given chapter-by-chapter summaries of a novel, provide a comprehensive analysis.
Extract:
1. Genres and tags that best describe this novel
2. A compelling synopsis (3-6 sentences) that captures the essence of the story
3. World-building elements: world overview, power/magic systems, setting, time period, factions, key locations, world rules, technology level

For genres, use standard literary genre names (Fantasy, Romance, Sci-Fi, Mystery, etc.)
For tags, use descriptive community tags (slow-burn, isekai, cultivation, overpowered-MC, etc.)
Set fields to null if they don't apply to this novel (e.g. powerSystem for a realistic fiction novel).`;

export const DEFAULT_CHARACTER_PROFILING_SYSTEM = `You are a literary analyst specializing in character analysis. Given information about characters collected from each chapter of a novel, create detailed character profiles.

For each character, provide:
- Basic info: name, age, sex, story role
- Appearance and personality
- Hobbies and interests
- Relationships: with the MC and with other characters
- Character arc and development
- Strengths, weaknesses, motivations, and goals

Merge duplicate references (e.g., the same character referred to by different names or titles).
Only include characters with meaningful presence — skip one-off unnamed characters.
For the MC's "relationshipWithMC" field, write "N/A - this is the MC".`;

// ─── Resolved Prompts (with custom overrides) ───────────────

export function resolvePrompts(custom?: CustomPrompts) {
  return {
    chapterAnalysis:
      custom?.chapterAnalysis?.trim() || DEFAULT_CHAPTER_ANALYSIS_SYSTEM,
    batchChapterAnalysis: buildBatchSystemPrompt(
      custom?.chapterAnalysis?.trim() || DEFAULT_CHAPTER_ANALYSIS_SYSTEM,
    ),
    intermediateAggregation: `You are a literary analyst. Summarize the following group of chapter summaries into a single cohesive summary that preserves all key plot points, character introductions, and world-building details. This intermediate summary will be used in a later aggregation step, so retain important specifics.`,
    novelAggregation:
      custom?.novelAggregation?.trim() || DEFAULT_NOVEL_AGGREGATION_SYSTEM,
    characterProfiling:
      custom?.characterProfiling?.trim() ||
      DEFAULT_CHARACTER_PROFILING_SYSTEM,
  };
}

/**
 * Derive the batch system prompt from the single-chapter system prompt.
 * Wraps it with batch instructions.
 */
function buildBatchSystemPrompt(chapterPrompt: string): string {
  return `You will receive multiple chapters from a novel. Analyze each one and return an array of results in the same order.

For each chapter, follow these instructions:
${chapterPrompt}`;
}

// ─── User Prompt Builders ───────────────────────────────────

export function buildChapterPrompt(
  chapterTitle: string,
  chapterContent: string,
): string {
  return `## ${chapterTitle}\n\n${chapterContent}`;
}

export function buildBatchChapterPrompt(
  chapters: { title: string; content: string }[],
): string {
  return chapters
    .map((ch, i) => `## Chapter ${i + 1}: ${ch.title}\n\n${ch.content}`)
    .join("\n\n---\n\n");
}

export function buildIntermediateAggregationPrompt(
  summaries: { title: string; summary: string }[],
): string {
  const text = summaries
    .map((s) => `### ${s.title}\n${s.summary}`)
    .join("\n\n");
  return `Summarize these chapter summaries into a single cohesive intermediate summary:\n\n${text}`;
}

export function buildAggregationPrompt(
  chapterSummaries: { title: string; summary: string }[],
): string {
  const summariesText = chapterSummaries
    .map((ch, i) => `### Chapter ${i + 1}: ${ch.title}\n${ch.summary}`)
    .join("\n\n");

  return `# Novel Analysis — Chapter Summaries\n\nThe following are summaries of each chapter:\n\n${summariesText}\n\nBased on these summaries, provide a comprehensive analysis of the entire novel.`;
}

export function buildCharacterPrompt(
  characterNotes: { name: string; mentions: string[] }[],
): string {
  const notesText = characterNotes
    .map(
      (ch) =>
        `### ${ch.name}\n${ch.mentions.map((m) => `- ${m}`).join("\n")}`,
    )
    .join("\n\n");

  return `# Character Analysis\n\nThe following are notes about characters collected across all chapters:\n\n${notesText}\n\nCreate detailed profiles for each significant character. Merge any duplicate entries that refer to the same character.`;
}
