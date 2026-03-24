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
  chapters: "Đang phân tích chương",
  aggregation: "Đang phân tích tổng quan tiểu thuyết",
  characters: "Đang lập hồ sơ nhân vật",
  complete: "Phân tích hoàn tất",
  error: "Phân tích thất bại",
  idle: "Sẵn sàng",
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
          <CardTitle className="text-base">Tiến trình phân tích</CardTitle>
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
                Chương {chaptersCompleted} / {totalChapters}
              </span>
            </>
          )}
          {phase === "aggregation" && (
            <>
              <LoaderIcon className="size-3 animate-spin" />
              <span>Đang xây dựng tổng quan từ các tóm tắt chương...</span>
            </>
          )}
          {phase === "characters" && (
            <>
              <LoaderIcon className="size-3 animate-spin" />
              <span>Đang tạo hồ sơ nhân vật...</span>
            </>
          )}
          {phase === "complete" && <span>Hoàn tất!</span>}
          {phase === "error" && (
            <span className="text-destructive">{error}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
