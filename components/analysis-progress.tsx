"use client";

import { XIcon, LoaderIcon, AlertTriangleIcon, CheckCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAnalysisStore } from "@/lib/stores/analysis";
import type { IncrementalResultSummary } from "@/lib/analysis/incremental-analyzer";

const PHASE_LABELS: Record<string, string> = {
  chapters: "Đang phân tích chương",
  aggregation: "Đang phân tích tổng quan tiểu thuyết",
  characters: "Đang lập hồ sơ nhân vật",
  complete: "Phân tích hoàn tất",
  completed_with_errors: "Hoàn tất với lỗi",
  error: "Phân tích thất bại",
  idle: "Sẵn sàng",
};

export function AnalysisProgress() {
  const {
    phase,
    chaptersCompleted,
    totalChapters,
    errors,
    resultSummary,
    cancel,
  } = useAnalysisStore();

  const hasErrors = errors.length > 0;
  const isDone =
    phase === "complete" || phase === "completed_with_errors" || phase === "error";
  const isRunning =
    phase === "chapters" || phase === "aggregation" || phase === "characters";

  const progressPercent =
    totalChapters > 0
      ? phase === "chapters"
        ? (chaptersCompleted / totalChapters) * 70
        : phase === "aggregation"
          ? 80
          : phase === "characters"
            ? 90
            : phase === "complete" || phase === "completed_with_errors"
              ? 100
              : 0
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Tiến trình phân tích</CardTitle>
          {isRunning && (
            <Button variant="ghost" size="icon-sm" onClick={cancel}>
              <XIcon className="size-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          {PHASE_LABELS[phase] ?? phase}
        </CardDescription>
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
          {phase === "complete" && !hasErrors && <span>Hoàn tất!</span>}
          {(phase === "complete" || phase === "completed_with_errors") &&
            hasErrors && (
              <span className="text-amber-500">
                Hoàn tất với {errors.length} lỗi
              </span>
            )}
          {phase === "error" && errors.length > 0 && (
            <span className="text-destructive">{errors[0].message}</span>
          )}
        </div>

        {/* Error list */}
        {hasErrors && (
          <ScrollArea className="max-h-32">
            <div className="space-y-1.5">
              {errors.map((err, i) => (
                <div
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-destructive"
                >
                  <AlertTriangleIcon className="mt-0.5 size-3 shrink-0" />
                  <span>
                    {err.chapterTitle && (
                      <span className="font-medium">{err.chapterTitle}: </span>
                    )}
                    {!err.chapterTitle && (
                      <span className="font-medium capitalize">
                        {err.phase}:{" "}
                      </span>
                    )}
                    {err.message}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Result summary */}
        {resultSummary && isDone && (
          <ResultSummaryView summary={resultSummary} />
        )}
      </CardContent>
    </Card>
  );
}

function ResultSummaryView({ summary }: { summary: IncrementalResultSummary }) {
  const items: string[] = [];

  if (summary.chaptersAnalyzed > 0)
    items.push(`${summary.chaptersAnalyzed} chương đã phân tích`);
  if (summary.charactersAdded > 0)
    items.push(`${summary.charactersAdded} nhân vật mới`);
  if (summary.charactersUpdated > 0)
    items.push(`${summary.charactersUpdated} nhân vật cập nhật`);
  if (summary.relationshipsAdded > 0)
    items.push(`${summary.relationshipsAdded} mối quan hệ mới`);
  if (summary.factionsAdded > 0)
    items.push(`${summary.factionsAdded} phe phái mới`);
  if (summary.factionsUpdated > 0)
    items.push(`${summary.factionsUpdated} phe phái cập nhật`);
  if (summary.locationsAdded > 0)
    items.push(`${summary.locationsAdded} địa điểm mới`);
  if (summary.locationsUpdated > 0)
    items.push(`${summary.locationsUpdated} địa điểm cập nhật`);
  if (summary.updatedFields.length > 0)
    items.push(`Cập nhật: ${summary.updatedFields.join(", ")}`);

  if (items.length === 0) return null;

  return (
    <div className="rounded-md border bg-muted/30 p-2.5">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
        <CheckCircleIcon className="size-3.5 text-green-500" />
        Kết quả phân tích
      </p>
      <ul className="space-y-0.5 text-xs text-muted-foreground">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
