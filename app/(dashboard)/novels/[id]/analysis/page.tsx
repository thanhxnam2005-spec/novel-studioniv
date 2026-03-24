"use client";

import { useParams } from "next/navigation";
import { useState, useCallback } from "react";
import {
  SearchIcon,
  PlayIcon,
  RotateCcwIcon,
  ZapIcon,
  GaugeIcon,
  TelescopeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useNovel,
  useNovelAnalysis,
  useCharacters,
  useChapters,
  useChatSettings,
  useAIProvider,
  useAnalysisSettings,
} from "@/lib/hooks";
import { getModel } from "@/lib/ai/provider";
import { analyzeNovel, type AnalysisDepth } from "@/lib/analysis";
import { useAnalysisStore } from "@/lib/stores/analysis";
import { AnalysisProgress } from "@/components/analysis-progress";
import { AnalysisDashboard } from "@/components/analysis-dashboard";
import { AnalysisPromptEditor } from "@/components/analysis-prompt-editor";
import { AnalysisModelPicker } from "@/components/analysis-model-picker";
import { db } from "@/lib/db";

const DEPTH_OPTIONS: {
  value: AnalysisDepth;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "quick",
    label: "Quick",
    description: "Samples chapters, minimal tokens",
    icon: ZapIcon,
  },
  {
    value: "standard",
    label: "Standard",
    description: "All chapters, balanced quality",
    icon: GaugeIcon,
  },
  {
    value: "deep",
    label: "Deep",
    description: "Full text, maximum detail",
    icon: TelescopeIcon,
  },
];

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const novel = useNovel(id);
  const analysis = useNovelAnalysis(id);
  const characters = useCharacters(id);
  const chapters = useChapters(id);
  const chatSettings = useChatSettings();

  const provider = useAIProvider(chatSettings?.providerId);
  const analysisSettings = useAnalysisSettings();
  const { isAnalyzing, start, updateProgress, setPhase, setError, reset } =
    useAnalysisStore();

  const [depth, setDepth] = useState<AnalysisDepth>("standard");

  const handleAnalyze = useCallback(async () => {
    if (!provider || !chatSettings?.modelId) {
      toast.error(
        "Please configure an AI provider and model in Settings first.",
      );
      return;
    }

    const totalChapters = chapters?.length ?? 0;
    if (totalChapters === 0) {
      toast.error("No chapters found. Import content first.");
      return;
    }

    start(id, totalChapters);
    const abortController = useAnalysisStore.getState().abortController;

    // Resolve per-step model overrides (returns LanguageModel or undefined)
    const resolveStep = async (
      cfg: { providerId: string; modelId: string } | undefined,
    ) => {
      if (!cfg?.providerId || !cfg?.modelId) return undefined;
      const p = await db.aiProviders.get(cfg.providerId);
      if (!p) return undefined;
      return getModel(p, cfg.modelId);
    };

    try {
      await analyzeNovel({
        novelId: id,
        defaultModel: getModel(provider, chatSettings.modelId),
        signal: abortController?.signal,
        depth,
        customPrompts: {
          chapterAnalysis: analysisSettings.chapterAnalysisPrompt,
          novelAggregation: analysisSettings.novelAggregationPrompt,
          characterProfiling: analysisSettings.characterProfilingPrompt,
        },
        stepModels: {
          chapters: await resolveStep(analysisSettings.chapterModel),
          aggregation: await resolveStep(analysisSettings.aggregationModel),
          characters: await resolveStep(analysisSettings.characterModel),
        },
        globalSystemInstruction: chatSettings.globalSystemInstruction,
        onProgress: (progress) => {
          updateProgress(progress.chaptersCompleted);
          setPhase(progress.phase);
        },
      });
      toast.success("Analysis complete!");
      reset();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        toast.info("Analysis cancelled.");
        reset();
      } else {
        const msg =
          error instanceof Error ? error.message : "Unknown error";
        setError(msg);
        toast.error(`Analysis failed: ${msg}`);
      }
    }
  }, [
    provider,
    chatSettings,
    chapters,
    id,
    depth,
    analysisSettings,
    start,
    updateProgress,
    setPhase,
    setError,
    reset,
  ]);

  // Loading state — only gate on novel (primary entity).
  // analysis is null when no record exists, undefined only while loading.
  if (novel === undefined) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="mb-6 h-4 w-72" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (!novel) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <p className="text-muted-foreground">Novel not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {novel.title}
          </h1>
          <p className="mt-1 text-muted-foreground">Novel Analysis</p>
        </div>
        {!isAnalyzing && (
          <Button onClick={handleAnalyze} disabled={!provider}>
            {analysis?.analysisStatus === "completed" ? (
              <>
                <RotateCcwIcon className="mr-1.5 size-4" />
                Re-analyze
              </>
            ) : (
              <>
                <PlayIcon className="mr-1.5 size-4" />
                Analyze
              </>
            )}
          </Button>
        )}
      </div>

      {/* Depth selector — shown when not analyzing and no completed analysis */}
      {!isAnalyzing && (
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium">Analysis Depth</p>
          <div className="flex gap-2">
            {DEPTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDepth(opt.value)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  depth === opt.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                <opt.icon className="size-4" />
                <div className="text-left">
                  <span className="font-medium">{opt.label}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {chapters && chapters.length > 10 && depth === "quick" && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Quick mode will sample ~{Math.ceil(chapters.length / 3)} of{" "}
              {chapters.length} chapters
            </p>
          )}
        </div>
      )}

      {/* Per-step model picker */}
      {!isAnalyzing && (
        <div className="mb-6">
          <AnalysisModelPicker />
        </div>
      )}

      {/* Custom prompt editor */}
      {!isAnalyzing && (
        <div className="mb-6">
          <AnalysisPromptEditor />
        </div>
      )}

      {/* Progress indicator when analyzing */}
      {isAnalyzing && (
        <div className="mb-6">
          <AnalysisProgress />
        </div>
      )}

      {/* Results */}
      {analysis?.analysisStatus === "completed" && chapters && characters ? (
        <AnalysisDashboard
          analysis={analysis}
          characters={characters}
          chapters={chapters}
        />
      ) : analysis?.analysisStatus === "failed" ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-destructive">
              Analysis failed: {analysis.error ?? "Unknown error"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleAnalyze}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : !isAnalyzing ? (
        <Card>
          <CardContent className="py-8">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchIcon />
                </EmptyMedia>
                <EmptyTitle>No analysis yet</EmptyTitle>
                <EmptyDescription>
                  Click &ldquo;Analyze&rdquo; to let AI extract genres,
                  characters, world-building, and chapter summaries from your
                  novel.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : null}

      {/* Provider warning */}
      {!provider && !isAnalyzing && (
        <Card className="mt-4 border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">AI Provider Required</CardTitle>
            <CardDescription>
              Configure an AI provider in{" "}
              <a href="/settings/providers" className="underline">
                Settings
              </a>{" "}
              to enable analysis.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </main>
  );
}
