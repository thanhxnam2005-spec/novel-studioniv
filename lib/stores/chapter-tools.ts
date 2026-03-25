import { create } from "zustand";

export type ChapterToolMode = "translate" | "review" | "edit";

export const PANEL_MIN_WIDTH = 280;
export const PANEL_MAX_WIDTH = 700;

interface ChapterToolsState {
  // Panel state
  activeMode: ChapterToolMode | null;
  panelWidth: number;

  // Streaming state
  isStreaming: boolean;
  streamingContent: string;
  abortController: AbortController | null;

  // Review result (session-only, scoped to a specific chapter)
  reviewResult: string | null;
  reviewChapterId: string | null;

  // Completed result for diff view
  completedResult: string | null;

  // Actions
  setActiveMode: (mode: ChapterToolMode | null) => void;
  toggleMode: (mode: ChapterToolMode) => void;
  setPanelWidth: (width: number) => void;
  startStreaming: () => void;
  setStreamingContent: (text: string) => void;
  finishStreaming: (result: string) => void;
  setReviewResult: (result: string | null, chapterId?: string) => void;
  cancelStreaming: () => void;
  clearResult: () => void;
  reset: () => void;
}

export const useChapterTools = create<ChapterToolsState>((set, get) => ({
  activeMode: null,
  panelWidth: 400,
  isStreaming: false,
  streamingContent: "",
  abortController: null,
  reviewResult: null,
  reviewChapterId: null,
  completedResult: null,

  setPanelWidth: (width) => {
    const clamped = Math.max(PANEL_MIN_WIDTH, Math.min(width, PANEL_MAX_WIDTH));
    if (clamped !== get().panelWidth) set({ panelWidth: clamped });
  },

  setActiveMode: (mode) => {
    const { isStreaming } = get();
    if (isStreaming) {
      get().cancelStreaming();
    }
    set({ activeMode: mode, completedResult: null, streamingContent: "" });
  },

  toggleMode: (mode) => {
    const { activeMode } = get();
    if (activeMode === mode) {
      get().setActiveMode(null);
    } else {
      get().setActiveMode(mode);
    }
  },

  startStreaming: () => {
    const controller = new AbortController();
    set({
      isStreaming: true,
      streamingContent: "",
      completedResult: null,
      abortController: controller,
    });
  },

  setStreamingContent: (text) => set({ streamingContent: text }),

  finishStreaming: (result) =>
    set({
      isStreaming: false,
      streamingContent: "",
      completedResult: result,
      abortController: null,
    }),

  setReviewResult: (result, chapterId) =>
    set({ reviewResult: result, reviewChapterId: chapterId ?? null }),

  cancelStreaming: () => {
    const { abortController } = get();
    abortController?.abort();
    set({
      isStreaming: false,
      streamingContent: "",
      abortController: null,
    });
  },

  clearResult: () => set({ completedResult: null, streamingContent: "" }),

  reset: () =>
    set({
      activeMode: null,
      isStreaming: false,
      streamingContent: "",
      abortController: null,
      reviewResult: null,
      reviewChapterId: null,
      completedResult: null,
    }),
}));
