import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TrainingSuggestion } from "@/lib/ai/training-tools";
import type { ConvertSegment } from "@/lib/workers/qt-engine.types";

interface TrainingState {
  input: string;
  output: string;
  segments: ConvertSegment[];
  isTraining: boolean;
  lastProcessedIndex: number;
  trainingSuggestions: TrainingSuggestion[];
  newlyAddedToDict: Array<{ chinese: string; vietnamese: string; category: string }>;
  batchProgress: { current: number; total: number } | null;
  isAutoNext: boolean;
  
  // Actions
  setInput: (input: string) => void;
  setOutput: (output: string) => void;
  setSegments: (segments: ConvertSegment[]) => void;
  setIsTraining: (isTraining: boolean) => void;
  setLastProcessedIndex: (index: number) => void;
  setTrainingSuggestions: (suggestions: TrainingSuggestion[]) => void;
  setNewlyAddedToDict: (dict: Array<{ chinese: string; vietnamese: string; category: string }>) => void;
  setBatchProgress: (progress: { current: number; total: number } | null) => void;
  setIsAutoNext: (isAutoNext: boolean) => void;
  resetTraining: () => void;
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set) => ({
      input: "",
      output: "",
      segments: [],
      isTraining: false,
      lastProcessedIndex: 0,
      trainingSuggestions: [],
      newlyAddedToDict: [],
      batchProgress: null,
      isAutoNext: false,

      setInput: (input) => set({ input }),
      setOutput: (output) => set({ output }),
      setSegments: (segments) => set({ segments }),
      setIsTraining: (isTraining) => set({ isTraining }),
      setLastProcessedIndex: (lastProcessedIndex) => set({ lastProcessedIndex }),
      setTrainingSuggestions: (trainingSuggestions) => set({ trainingSuggestions }),
      setNewlyAddedToDict: (newlyAddedToDict) => set({ newlyAddedToDict }),
      setBatchProgress: (batchProgress) => set({ batchProgress }),
      setIsAutoNext: (isAutoNext) => set({ isAutoNext }),
      resetTraining: () => set({
        isTraining: false,
        lastProcessedIndex: 0,
        trainingSuggestions: [],
        newlyAddedToDict: [],
        batchProgress: null,
      }),
    }),
    {
      name: "training-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        input: state.input,
        output: state.output,
        lastProcessedIndex: state.lastProcessedIndex,
        newlyAddedToDict: state.newlyAddedToDict,
        isAutoNext: state.isAutoNext,
      }),
    }
  )
);
