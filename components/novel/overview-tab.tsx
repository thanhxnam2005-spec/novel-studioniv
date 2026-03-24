"use client";

import { Badge } from "@/components/ui/badge";
import { EditableText } from "./editable-text";
import type { NovelAnalysis } from "@/lib/db";
import { updateNovelAnalysis } from "@/lib/hooks";

export function OverviewTab({
  analysis,
  chapterCount,
  wordCount,
  characterCount,
}: {
  analysis: NovelAnalysis | null | undefined;
  chapterCount: number;
  wordCount: number;
  characterCount: number;
}) {
  const save = (field: string, value: unknown) => {
    if (!analysis) return;
    updateNovelAnalysis(analysis.id, { [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex gap-3">
        <Badge variant="secondary">{chapterCount} chương</Badge>
        <Badge variant="secondary">{wordCount.toLocaleString()} từ</Badge>
        <Badge variant="secondary">{characterCount} nhân vật</Badge>
      </div>

      {/* Synopsis */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Tóm tắt
        </p>
        <EditableText
          value={analysis?.synopsis ?? ""}
          onSave={(v) => save("synopsis", v)}
          placeholder="Chưa có tóm tắt. Chạy phân tích hoặc nhấn để viết..."
          multiline
          displayClassName="text-sm leading-relaxed"
        />
      </div>
    </div>
  );
}
