"use client";

import { XIcon } from "lucide-react";
import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StickToBottom } from "use-stick-to-bottom";
import { ScrollToBottom } from "@/components/chat/scroll-to-bottom";
import { useChapterTools, type ChapterToolMode } from "@/lib/stores/chapter-tools";
import { TranslateMode, type TranslateResult } from "./translate-mode";
import { ReviewMode } from "./review-mode";
import { EditMode } from "./edit-mode";

const MODE_TITLES: Record<ChapterToolMode, string> = {
  translate: "Dịch chương",
  review: "Đánh giá chương",
  edit: "Chỉnh sửa chương",
};

function PanelResizeHandle() {
  const isDragging = useRef(false);
  const rafId = useRef(0);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    cancelAnimationFrame(rafId.current);
    const x = e.clientX;
    rafId.current = requestAnimationFrame(() => {
      useChapterTools.getState().setPanelWidth(window.innerWidth - x);
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    cancelAnimationFrame(rafId.current);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={cn(
        "absolute inset-y-0 left-0 z-20 w-1 cursor-col-resize",
        "after:absolute after:inset-y-0 after:-left-1 after:w-3",
        "hover:bg-ring/50 active:bg-ring",
      )}
    />
  );
}

export function ChapterToolsPanel({
  content,
  novelId,
  chapterId,
  chapterOrder,
  chapterTitle,
  onTranslated,
}: {
  content: string;
  novelId: string;
  chapterId: string;
  chapterOrder: number;
  chapterTitle: string;
  onTranslated: (result: TranslateResult) => void;
}) {
  const activeMode = useChapterTools((s) => s.activeMode);
  const setActiveMode = useChapterTools((s) => s.setActiveMode);
  const panelWidth = useChapterTools((s) => s.panelWidth);

  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden border-l bg-background transition-[width] duration-200",
        !activeMode && "w-0",
      )}
      style={activeMode ? { width: panelWidth } : undefined}
    >
      {activeMode && (
        <>
          <PanelResizeHandle />
          <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
            <h3 className="text-sm font-medium">
              {MODE_TITLES[activeMode]}
            </h3>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setActiveMode(null)}
            >
              <XIcon className="size-4" />
            </Button>
          </header>
          <StickToBottom
            className="relative min-h-0 flex-1"
            resize="smooth"
            initial="instant"
          >
            <StickToBottom.Content className="p-4">
              {activeMode === "translate" && (
                <TranslateMode
                  content={content}
                  novelId={novelId}
                  chapterOrder={chapterOrder}
                  chapterTitle={chapterTitle}
                  onTranslated={onTranslated}
                />
              )}
              {activeMode === "review" && (
                <ReviewMode content={content} novelId={novelId} chapterId={chapterId} />
              )}
              {activeMode === "edit" && (
                <EditMode content={content} novelId={novelId} chapterId={chapterId} />
              )}
            </StickToBottom.Content>
            <ScrollToBottom />
          </StickToBottom>
        </>
      )}
    </div>
  );
}
