"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNovel, useChapters, useScenes } from "@/lib/hooks";

function ChapterContent({ chapterId }: { chapterId: string }) {
  const scenes = useScenes(chapterId);
  if (!scenes) return <Skeleton className="h-64 w-full" />;
  const text = scenes.map((s) => s.content).join("\n\n");
  return (
    <div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">
      {text || (
        <p className="italic text-muted-foreground">Chương này chưa có nội dung.</p>
      )}
    </div>
  );
}

export default function ReadingView() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const novel = useNovel(id);
  const chapters = useChapters(id);

  const initialChapter = parseInt(searchParams.get("chapter") ?? "0", 10);
  const [currentIndex, setCurrentIndex] = useState(initialChapter);

  // Clamp index to valid range
  const clampedIndex = chapters
    ? Math.min(currentIndex, Math.max(0, chapters.length - 1))
    : currentIndex;

  const chapter = chapters?.[clampedIndex];
  const hasPrev = clampedIndex > 0;
  const hasNext = chapters ? clampedIndex < chapters.length - 1 : false;

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
    <main className="mx-auto flex h-full w-full max-w-3xl flex-col px-6 py-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={`/novels/${id}`}>
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          {novel.title}
        </span>
        <NativeSelect
          className="ml-auto w-48"
          value={clampedIndex}
          onChange={(e) => setCurrentIndex(Number(e.target.value))}
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
        <ScrollArea className="flex-1">
          <div className="pb-12">
            <h2 className="mb-6 text-center font-heading text-2xl font-bold">
              {chapter.title}
            </h2>
            <ChapterContent chapterId={chapter.id} />
          </div>
        </ScrollArea>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          onClick={() => setCurrentIndex((i) => i - 1)}
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
          onClick={() => setCurrentIndex((i) => i + 1)}
        >
          Tiếp
          <ChevronRightIcon className="ml-1 size-4" />
        </Button>
      </div>
    </main>
  );
}
