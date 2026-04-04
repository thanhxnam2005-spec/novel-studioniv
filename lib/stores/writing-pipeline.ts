import type { WritingAgentRole } from "@/lib/db";
import { create } from "zustand";

interface WritingPipelineState {
  activeSessionId: string | null;
  isRunning: boolean;
  abortController: AbortController | null;
  activePanel: "pipeline" | "outline" | "content" | "review";
  streamingContent: string;
  /** Ephemeral per-step user instructions (not persisted). Keys: wizard steps, agent roles, or "generate-more-plans". */
  stepUserInstructions: Record<string, string>;
  /** When set, show pipeline step config UI before running this role (after re-run). */
  pipelinePreRunRole: WritingAgentRole | null;

  // Actions
  startPipeline: (sessionId: string) => AbortController;
  pausePipeline: () => void;
  cancelPipeline: () => void;
  setActivePanel: (
    panel: "pipeline" | "outline" | "content" | "review",
  ) => void;
  appendStreamingContent: (chunk: string) => void;
  clearStreamingContent: () => void;
  setStepUserInstruction: (key: string, value: string) => void;
  setPipelinePreRunRole: (role: WritingAgentRole | null) => void;
  reset: () => void;
}

export const useWritingPipelineStore = create<WritingPipelineState>(
  (set, get) => ({
    activeSessionId: null,
    isRunning: false,
    abortController: null,
    activePanel: "pipeline",
    streamingContent: "",
    stepUserInstructions: {},
    pipelinePreRunRole: null,

    startPipeline: (sessionId) => {
      const controller = new AbortController();
      set({
        activeSessionId: sessionId,
        isRunning: true,
        abortController: controller,
        streamingContent: "",
      });
      return controller;
    },

    pausePipeline: () => {
      const { abortController } = get();
      abortController?.abort();
      set({ isRunning: false, abortController: null });
    },

    cancelPipeline: () => {
      const { abortController } = get();
      abortController?.abort();
      set({
        isRunning: false,
        abortController: null,
        activeSessionId: null,
        streamingContent: "",
      });
    },

    setActivePanel: (panel) => set({ activePanel: panel }),

    appendStreamingContent: (chunk) =>
      set((state) => ({
        streamingContent: state.streamingContent + chunk,
      })),

    clearStreamingContent: () => set({ streamingContent: "" }),

    setStepUserInstruction: (key, value) =>
      set((state) => ({
        stepUserInstructions: { ...state.stepUserInstructions, [key]: value },
      })),

    setPipelinePreRunRole: (role) => set({ pipelinePreRunRole: role }),

    reset: () =>
      set({
        activeSessionId: null,
        isRunning: false,
        abortController: null,
        activePanel: "pipeline",
        streamingContent: "",
        stepUserInstructions: {},
        pipelinePreRunRole: null,
      }),
  }),
);
