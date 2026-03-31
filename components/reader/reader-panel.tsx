"use client";

import { Button } from "@/components/ui/button";
import { useReaderPanel } from "@/lib/stores/reader-panel";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useTTSSettings } from "@/lib/hooks/use-tts-settings";
import { ReaderControls } from "./reader-controls";
import { ReaderSentenceList } from "./reader-sentence-list";
import { ReaderSettings } from "./reader-settings";

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
      useReaderPanel.getState().setPanelWidth(window.innerWidth - x);
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

export function ReaderPanel({ content: _content }: { content?: string }) {
  const isOpen = useReaderPanel((s) => s.isOpen);
  const panelWidth = useReaderPanel((s) => s.panelWidth);
  const setOpen = useReaderPanel((s) => s.setOpen);
  const syncSettings = useReaderPanel((s) => s.syncSettings);
  const dexieSettings = useTTSSettings();

  // Keep the store in sync with Dexie-backed settings
  useEffect(() => {
    syncSettings(dexieSettings);
  }, [dexieSettings, syncSettings]);

  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden border-l bg-background transition-[width] duration-200",
        !isOpen && "w-0 border-l-0",
      )}
      style={isOpen ? { width: panelWidth } : undefined}
    >
      <div className="flex size-full flex-col" style={{ minWidth: isOpen ? panelWidth : 280 }}>
        {isOpen && <PanelResizeHandle />}

          {/* Title bar */}
          <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
            <h3 className="text-sm font-medium">Đọc truyện</h3>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
            >
              <XIcon className="size-4" />
            </Button>
          </header>

          {/* Settings (top, collapsible) */}
          <div className="shrink-0 border-b">
            <ReaderSettings />
          </div>

          {/* Sentence list (middle, scrollable) */}
          <ReaderSentenceList />

          {/* Controls (bottom, pinned) */}
          <div className="shrink-0 border-t bg-background px-4 py-3">
            <ReaderControls />
          </div>
      </div>
    </div>
  );
}
