import { create } from "zustand";
import type { AnalysisError, AnalysisPhase } from "@/lib/analysis";
import type { IncrementalResultSummary } from "@/lib/analysis/incremental-analyzer";

interface AnalysisState {
  isAnalyzing: boolean;
  currentNovelId: string | null;
  phase: AnalysisPhase | "idle" | "error" | "completed_with_errors";
  chaptersCompleted: number;
  totalChapters: number;
  errors: AnalysisError[];
  abortController: AbortController | null;
  resultSummary: IncrementalResultSummary | null;
  start: (novelId: string, totalChapters: number) => void;
  updateProgress: (chaptersCompleted: number, totalChapters?: number) => void;
  setPhase: (phase: AnalysisPhase | "error" | "completed_with_errors") => void;
  addError: (error: AnalysisError) => void;
  setError: (error: string) => void;
  setResultSummary: (summary: IncrementalResultSummary) => void;
  cancel: () => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  isAnalyzing: false,
  currentNovelId: null,
  phase: "idle",
  chaptersCompleted: 0,
  totalChapters: 0,
  errors: [],
  abortController: null,
  resultSummary: null,

  start: (novelId, totalChapters) =>
    set({
      isAnalyzing: true,
      currentNovelId: novelId,
      phase: "chapters",
      chaptersCompleted: 0,
      totalChapters,
      errors: [],
      resultSummary: null,
      abortController: new AbortController(),
    }),

  updateProgress: (chaptersCompleted, totalChapters) => {
    const state = get();
    // Only increase — concurrent batch workers can report out of order
    if (chaptersCompleted < state.chaptersCompleted) return;
    const update: Partial<AnalysisState> = { chaptersCompleted };
    if (totalChapters !== undefined) update.totalChapters = totalChapters;
    set(update);
  },

  setPhase: (phase) => set({ phase }),

  addError: (error) =>
    set((state) => ({ errors: [...state.errors, error] })),

  setError: (error) =>
    set({
      errors: [{ phase: "unknown", message: error }],
      phase: "error",
      isAnalyzing: false,
    }),

  setResultSummary: (summary) => set({ resultSummary: summary }),

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
      errors: [],
      resultSummary: null,
      abortController: null,
    }),
}));
