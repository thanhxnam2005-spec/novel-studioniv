"use client";

import { useReaderPanel } from "@/lib/stores/reader-panel";
import { tokenizeSentences } from "@/lib/tts";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef } from "react";

export function SentenceRenderer({ content }: { content: string }) {
  const sentences = useMemo(() => tokenizeSentences(content), [content]);
  const setSentences = useReaderPanel((s) => s.setSentences);
  const currentSentenceIndex = useReaderPanel((s) => s.currentSentenceIndex);
  const isPlaying = useReaderPanel((s) => s.isPlaying);
  const isPaused = useReaderPanel((s) => s.isPaused);
  const highlightColor = useReaderPanel((s) => s.ttsSettings.highlightColor);

  const activeRef = useRef<HTMLSpanElement>(null);

  // Sync sentences to store whenever content changes
  useEffect(() => {
    setSentences(sentences);
  }, [sentences, setSentences]);

  // Scroll active sentence into view
  useEffect(() => {
    if ((isPlaying || isPaused) && activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentSentenceIndex, isPlaying, isPaused]);

  const isActive = useCallback(
    (index: number) =>
      (isPlaying || isPaused) && index === currentSentenceIndex,
    [isPlaying, isPaused, currentSentenceIndex],
  );

  if (!content) {
    return (
      <p className="italic text-muted-foreground">
        Chương này chưa có nội dung.
      </p>
    );
  }

  return (
    <div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">
      {sentences.map((sentence, i) => (
        <span
          key={i}
          ref={isActive(i) ? activeRef : undefined}
          data-sentence-index={i}
          className={cn(
            "transition-colors duration-200 mr-0.75",
            isActive(i) && "rounded-sm ring-1 ring-primary/20",
          )}
          style={isActive(i) ? { backgroundColor: highlightColor } : undefined}
        >
          {sentence.originalText}
        </span>
      ))}
    </div>
  );
}
