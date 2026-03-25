"use client";

import { AnalysisDialog } from "@/components/analysis-dialog";
import { ChaptersTab } from "@/components/novel/chapters-tab";
import { CharactersTab } from "@/components/novel/characters-tab";
import { EditableBadges } from "@/components/novel/editable-badges";
import { EditableText } from "@/components/novel/editable-text";
import { OverviewTab } from "@/components/novel/overview-tab";
import { WorldBuildingTab } from "@/components/novel/world-building-tab";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  updateNovel,
  updateNovelAnalysis,
  useChapterAnalysisStatus,
  useChapters,
  useCharacters,
  useNovel,
  useNovelAnalysis,
  useNovelScenes,
} from "@/lib/hooks";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type AnalysisMode = "full" | "incremental" | "selected";

export default function NovelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";
  const novel = useNovel(id);
  const chapters = useChapters(id);
  const scenes = useNovelScenes(id);
  const analysisStatuses = useChapterAnalysisStatus(id);
  const analysis = useNovelAnalysis(id);
  const characters = useCharacters(id);

  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("full");
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);

  // Word counts
  const chapterWordCounts = useMemo(() => {
    const map = new Map<string, number>();
    if (!scenes) return map;
    for (const s of scenes) {
      map.set(s.chapterId, (map.get(s.chapterId) ?? 0) + s.wordCount);
    }
    return map;
  }, [scenes]);

  const totalWords = useMemo(
    () => scenes?.reduce((sum, s) => sum + s.wordCount, 0) ?? 0,
    [scenes],
  );

  const handleAnalyze = (mode: AnalysisMode, chapterIds?: string[]) => {
    setAnalysisMode(mode);
    setSelectedChapterIds(chapterIds ?? []);
    setAnalysisOpen(true);
  };

  // Loading
  if (novel === undefined) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="mb-4 h-4 w-96" />
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  if (!novel) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <p className="text-muted-foreground">Không tìm thấy tiểu thuyết.</p>
      </main>
    );
  }

  const needsAnalysisCount =
    analysisStatuses?.filter((s) => s.status !== "analyzed").length ?? 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-2">
        <EditableText
          value={novel.title}
          onSave={(v) => {
            updateNovel(id, { title: v });
            toast.success("Đã cập nhật tiêu đề");
          }}
          displayClassName="font-heading text-3xl font-bold tracking-tight"
        />
      </div>

      <div className="mb-4">
        <EditableText
          value={novel.description}
          onSave={(v) => {
            updateNovel(id, { description: v });
            toast.success("Đã cập nhật mô tả");
          }}
          placeholder="Nhấn để thêm mô tả..."
          multiline
          displayClassName="text-sm text-muted-foreground"
        />
      </div>

      {/* Genres + Tags */}
      <div className="mb-6 flex flex-wrap items-start gap-6">
        <EditableBadges
          label="Thể loại"
          values={analysis?.genres ?? []}
          variant="default"
          onSave={(v) => {
            if (analysis) updateNovelAnalysis(analysis.id, { genres: v });
          }}
        />
        <EditableBadges
          label="Nhãn"
          values={analysis?.tags ?? []}
          variant="secondary"
          onSave={(v) => {
            if (analysis) updateNovelAnalysis(analysis.id, { tags: v });
          }}
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const params = new URLSearchParams(searchParams.toString());
          if (value === "overview") {
            params.delete("tab");
          } else {
            params.set("tab", value);
          }
          const query = params.toString();
          router.replace(`${pathname}${query ? `?${query}` : ""}`, {
            scroll: false,
          });
        }}
      >
        <TabsList className="w-full justify-center">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="world-building">Thế giới quan</TabsTrigger>
          <TabsTrigger value="characters">
            Nhân vật
            {characters && characters.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({characters.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="chapters">
            Chương
            {chapters && chapters.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({chapters.length})
              </span>
            )}
            {needsAnalysisCount > 0 && (
              <span className="inline-flex size-2 rounded-full bg-amber-500" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab
            analysis={analysis}
            chapterCount={chapters?.length ?? 0}
            wordCount={totalWords}
            characterCount={characters?.length ?? 0}
          />
        </TabsContent>

        <TabsContent value="world-building" className="mt-4">
          <WorldBuildingTab analysis={analysis} />
        </TabsContent>

        <TabsContent value="characters" className="mt-4">
          <CharactersTab characters={characters ?? []} novelId={id} />
        </TabsContent>

        <TabsContent value="chapters" className="mt-4">
          <ChaptersTab
            novelId={id}
            chapters={chapters ?? []}
            analysisStatuses={analysisStatuses}
            wordCounts={chapterWordCounts}
            onAnalyze={handleAnalyze}
          />
        </TabsContent>
      </Tabs>

      {/* Analysis dialog */}
      <AnalysisDialog
        open={analysisOpen}
        onOpenChange={setAnalysisOpen}
        novelId={id}
        mode={analysisMode}
        selectedChapterIds={
          analysisMode === "selected" ? selectedChapterIds : undefined
        }
        totalChapters={chapters?.length ?? 0}
      />
    </main>
  );
}
