"use client";

import { XIcon, LoaderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAnalysisStore } from "@/lib/stores/analysis";

const PHASE_LABELS: Record<string, string> = {
  chapters: "Analyzing chapters",
  aggregation: "Analyzing novel overview",
  characters: "Profiling characters",
  complete: "Analysis complete",
  error: "Analysis failed",
  idle: "Ready",
};

export function AnalysisProgress() {
  const {
    phase,
    chaptersCompleted,
    totalChapters,
    error,
    cancel,
  } = useAnalysisStore();

  const progressPercent =
    totalChapters > 0
      ? phase === "chapters"
        ? (chaptersCompleted / totalChapters) * 70
        : phase === "aggregation"
          ? 80
          : phase === "characters"
            ? 90
            : phase === "complete"
              ? 100
              : 0
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Analysis Progress</CardTitle>
          {phase !== "complete" && phase !== "error" && phase !== "idle" && (
            <Button variant="ghost" size="icon-sm" onClick={cancel}>
              <XIcon className="size-4" />
            </Button>
          )}
        </div>
        <CardDescription>{PHASE_LABELS[phase] ?? phase}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progressPercent} className="h-2" />

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {phase === "chapters" && (
            <>
              <LoaderIcon className="size-3 animate-spin" />
              <span>
                Chapter {chaptersCompleted} / {totalChapters}
              </span>
            </>
          )}
          {phase === "aggregation" && (
            <>
              <LoaderIcon className="size-3 animate-spin" />
              <span>Building novel overview from chapter summaries...</span>
            </>
          )}
          {phase === "characters" && (
            <>
              <LoaderIcon className="size-3 animate-spin" />
              <span>Creating character profiles...</span>
            </>
          )}
          {phase === "complete" && <span>All done!</span>}
          {phase === "error" && (
            <span className="text-destructive">{error}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
