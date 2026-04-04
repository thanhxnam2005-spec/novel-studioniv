import { generateStructured } from "@/lib/ai/structured";
import { withGlobalInstruction } from "@/lib/ai/system-prompt";
import { appendUserInstructionToPrompt } from "@/lib/writing/append-user-instruction";
import { buildWritingContext } from "../context-builder";
import { contextOutputSchema } from "../schemas";
import type {
  AgentConfig,
  ContextAgentInput,
  ContextAgentOutput,
  WritingContext,
} from "../types";

export async function runContextAgent(
  input: ContextAgentInput,
  config: AgentConfig,
): Promise<{ output: ContextAgentOutput; writingContext: WritingContext }> {
  const writingContext = await buildWritingContext(
    input.novelId,
    input.chapterOrder,
  );

  const basePrompt = `Dựa trên bối cảnh sau, hãy tổng hợp thông tin cho chương ${input.chapterOrder}:\n\n${writingContext.context}`;

  const { object } = await generateStructured<ContextAgentOutput>({
    model: config.model,
    schema: contextOutputSchema,
    system: withGlobalInstruction(config.systemPrompt, config.globalInstruction),
    prompt: appendUserInstructionToPrompt(basePrompt, config.userInstruction),
    abortSignal: config.abortSignal,
  });

  return { output: object, writingContext };
}
