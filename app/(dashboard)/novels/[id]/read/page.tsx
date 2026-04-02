"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNovel, useChapters, useScenes } from "@/lib/hooks";
import { SentenceRenderer } from "@/components/reader/sentence-renderer";
import { useReaderPanel } from "@/lib/stores/reader-panel";
import { useMediaSession } from "@/lib/hooks/use-media-session";

function ChapterContent({
  chapterId,
  readerOpen,
  chapterHeader,
}: {
  chapterId: string;
  readerOpen: boolean;
  chapterHeader?: string;
}) {
  const scenes = useScenes(chapterId);
  if (!scenes) return <Skeleton className="h-64 w-full" />;
  const text = scenes.map((s) => s.content).join("\n\n");

  if (!text) {
    return (
      <div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">
        <p className="italic text-muted-foreground">
          Chương này chưa có nội dung.
        </p>
      </div>
    );
  }

  if (readerOpen) {
    const ttsContent = chapterHeader ? `${chapterHeader}\n\n${text}` : text;
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <SentenceRenderer content={ttsContent} />
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">
      {text}
    </div>
  );
}

export default function ReadingView() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const novel = useNovel(id);
  const chapters = useChapters(id);

  // The store owns chapterIndex; this page is a subscriber + context provider.
  const chapterIndex = useReaderPanel((s) => s.chapterIndex);
  const isReaderOpen = useReaderPanel((s) => s.isOpen);

  // Clamp to valid range in case chapters haven't loaded yet
  const clampedIndex = chapters
    ? Math.min(chapterIndex, Math.max(0, chapters.length - 1))
    : chapterIndex;

  const chapter = chapters?.[clampedIndex];
  const hasPrev = clampedIndex > 0;
  const hasNext = chapters ? clampedIndex < chapters.length - 1 : false;

  // Initialise novel context in the store when the novel/chapters data loads.
  // If this is a different novel than what the store last saw, reset chapterIndex
  // to whatever the URL specifies (for deep-linking). Otherwise keep store's value.
  useEffect(() => {
    if (!novel || !chapters || chapters.length === 0) return;

    const storeNovelId = useReaderPanel.getState().novelId;
    const urlChapter = parseInt(searchParams.get("chapter") ?? "0", 10);
    const clampedUrl = Math.min(Math.max(0, urlChapter), chapters.length - 1);

    useReaderPanel.getState().setNovelContext({
      novelId: id,
      novelTitle: novel.title,
      totalChapters: chapters.length,
      // Pass chapterIndex only when switching novels so we reset to the URL's chapter
      ...(storeNovelId !== id ? { chapterIndex: clampedUrl } : {}),
    });
  // searchParams intentionally excluded: URL chapter param is only used on novel change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, novel?.title, chapters?.length]);

  // Keep chapter title in sync whenever the displayed chapter changes
  useEffect(() => {
    if (chapter?.title) {
      useReaderPanel.getState().setChapterTitle(chapter.title);
    }
  }, [chapter?.title]);

  // Sync with OS media controls (lock screen, Bluetooth, notification bar)
  useMediaSession({
    novelTitle: novel?.title ?? "",
    chapterTitle: chapter?.title ?? "",
    chapterNumber: clampedIndex + 1,
    hasPrev,
    hasNext,
    onPrev: () => useReaderPanel.getState().prevChapter(),
    onNext: () => useReaderPanel.getState().nextChapter(),
  });

  if (novel === undefined || !chapters) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  if (!novel) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <p className="text-muted-foreground">Không tìm thấy tiểu thuyết.</p>
      </main>
    );
  }

  return (
    <main className="flex h-[calc(100svh-3rem)] flex-col overflow-hidden px-6 py-4">
      {/* Header */}
      <div className="mb-4 flex shrink-0 items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={`/novels/${id}`}>
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          {novel.title}
        </span>
        {chapter && (
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            title="Chỉnh sửa chương"
          >
            <Link href={`/novels/${id}/chapters/${chapter.id}`}>
              <PencilIcon className="size-4" />
            </Link>
          </Button>
        )}
        <NativeSelect
          className="ml-auto w-48"
          value={clampedIndex}
          onChange={(e) =>
            useReaderPanel.getState().navigateTo(Number(e.target.value))
          }
        >
          {chapters.map((ch, i) => (
            <NativeSelectOption key={ch.id} value={i}>
              {i + 1}. {ch.title}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {/* Chapter content */}
      {chapter && (
        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto max-w-3xl pb-12">
            <h2 className="mb-6 text-center font-heading text-2xl font-bold">
              {chapter.title}
            </h2>
            <ChapterContent
              chapterId={chapter.id}
              readerOpen={isReaderOpen}
              chapterHeader={`Chương ${clampedIndex + 1}: ${chapter.title}`}
            />
          </div>
        </ScrollArea>
      )}

      {/* Navigation */}
      <div className="flex shrink-0 items-center justify-between border-t pt-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          onClick={() => useReaderPanel.getState().prevChapter()}
        >
          <ChevronLeftIcon className="mr-1 size-4" />
          Trước
        </Button>
        <span className="text-xs text-muted-foreground">
          {clampedIndex + 1} / {chapters.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() => useReaderPanel.getState().nextChapter()}
        >
          Tiếp
          <ChevronRightIcon className="ml-1 size-4" />
        </Button>
      </div>
    </main>
  );
}
