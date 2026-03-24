import { create } from "zustand";
import type { AnalysisPhase } from "@/lib/analysis";

interface AnalysisState {
  isAnalyzing: boolean;
  currentNovelId: string | null;
  phase: AnalysisPhase | "idle" | "error";
  chaptersCompleted: number;
  totalChapters: number;
  error: string | null;
  abortController: AbortController | null;
  start: (novelId: string, totalChapters: number) => void;
  updateProgress: (chaptersCompleted: number) => void;
  setPhase: (phase: AnalysisPhase | "error") => void;
  setError: (error: string) => void;
  cancel: () => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  isAnalyzing: false,
  currentNovelId: null,
  phase: "idle",
  chaptersCompleted: 0,
  totalChapters: 0,
  error: null,
  abortController: null,

  start: (novelId, totalChapters) =>
    set({
      isAnalyzing: true,
      currentNovelId: novelId,
      phase: "chapters",
      chaptersCompleted: 0,
      totalChapters,
      error: null,
      abortController: new AbortController(),
    }),

  updateProgress: (chaptersCompleted) => set({ chaptersCompleted }),

  setPhase: (phase) => set({ phase }),

  setError: (error) =>
    set({ error, phase: "error", isAnalyzing: false }),

  cancel: () => {
    const { abortController } = get();
    abortController?.abort();
    set({ isAnalyzing: false, phase: "idle", abortController: null });
  },

  reset: () =>
    set({
      isAnalyzing: false,
      currentNovelId: null,
      phase: "idle",
      chaptersCompleted: 0,
      totalChapters: 0,
      error: null,
      abortController: null,
    }),
}));
