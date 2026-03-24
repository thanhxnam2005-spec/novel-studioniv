import { generateText, tool, type LanguageModel, type Schema } from "ai";

/**
 * Extract JSON from text that may contain markdown fences or extra text.
 */
function extractJson(text: string): string {
  const trimmed = text.trim();

  // Already clean JSON
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  // Extract from markdown code fence
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // Find first { or [ and last matching } or ]
  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");
  const start = Math.min(
    firstBrace >= 0 ? firstBrace : Infinity,
    firstBracket >= 0 ? firstBracket : Infinity,
  );

  if (start === Infinity) {
    throw new Error("No JSON found in response");
  }

  const isArray = trimmed[start] === "[";
  const lastClose = trimmed.lastIndexOf(isArray ? "]" : "}");
  if (lastClose <= start) {
    throw new Error("Incomplete JSON in response");
  }

  return trimmed.slice(start, lastClose + 1);
}

/**
 * Generate structured output using a two-tier strategy:
 *
 * 1. **Tool calling** (primary): defines a tool whose input schema matches
 *    the desired output, forcing the model to respond with structured data.
 *
 * 2. **Content parsing** (fallback): if the model returns JSON in content
 *    instead of a tool call (some providers ignore tool_choice), extract
 *    and parse the JSON from the text response.
 */
export async function generateStructured<T>({
  model,
  schema,
  system,
  prompt,
  abortSignal,
}: {
  model: LanguageModel;
  schema: Schema<T>;
  system?: string;
  prompt: string;
  abortSignal?: AbortSignal;
}): Promise<{ object: T }> {
  const TOOL_NAME = "structured_output";

  const result = await generateText({
    model,
    system,
    prompt,
    tools: {
      [TOOL_NAME]: tool({
        description: "Return the structured analysis result",
        inputSchema: schema,
      }),
    },
    toolChoice: { type: "tool", toolName: TOOL_NAME },
    abortSignal,
  });

  // Primary: extract from tool call
  const toolCall = result.toolCalls?.[0];
  if (toolCall) {
    return { object: toolCall.input as T };
  }

  // Fallback: parse JSON from content (provider ignored tool_choice)
  if (result.text) {
    const json = extractJson(result.text);
    return { object: JSON.parse(json) as T };
  }

  throw new Error(
    "Model produced neither a tool call nor parseable JSON content",
  );
}
