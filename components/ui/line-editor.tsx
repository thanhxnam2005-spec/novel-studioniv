"use client";

import { cn } from "@/lib/utils";
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LineEditorProps {
  /** Current text value */
  value: string;
  /** Called when text changes */
  onChange: (value: string) => void;
  /** Make the editor read-only */
  readOnly?: boolean;
  /** Placeholder shown when value is empty */
  placeholder?: string;
  /** Additional class names merged onto the root container */
  className?: string;
  /** Font-size Tailwind classes for content (default: "text-sm leading-5") */
  contentFont?: string;
  /** Font-size Tailwind classes for gutter (default: "text-xs leading-5") */
  gutterFont?: string;
}

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const LINE_CLS = "flex";
const GUTTER_BASE =
  "w-12 shrink-0 self-stretch border-r bg-muted/30 pr-2 text-right font-mono text-muted-foreground/60 select-none";
const CONTENT_BASE =
  "min-w-0 flex-1 whitespace-pre-wrap break-words px-3 font-mono";

/* ------------------------------------------------------------------ */
/*  Rendered lines                                                     */
/* ------------------------------------------------------------------ */

const RenderedLines = memo(function RenderedLines({
  value,
  gutterCls,
  contentCls,
}: {
  value: string;
  gutterCls: string;
  contentCls: string;
}) {
  const lines = useMemo(() => value.split("\n"), [value]);

  return (
    <>
      {lines.map((line, i) => (
        <div key={i} className={LINE_CLS}>
          <span className={gutterCls}>{i + 1}</span>
          <span className={contentCls}>{line || "\u00A0"}</span>
        </div>
      ))}
    </>
  );
});

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function LineEditor({
  value,
  onChange,
  readOnly = false,
  placeholder,
  className,
  contentFont = "text-sm leading-5",
  gutterFont = "text-xs leading-5",
}: LineEditorProps) {
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const deferredValue = useDeferredValue(value);

  const gutterCls = cn(GUTTER_BASE, gutterFont);
  const contentCls = cn(CONTENT_BASE, contentFont);

  /* sync mirror padding with textarea scrollbar width */
  useEffect(() => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror || readOnly) return;

    const sync = () => {
      const sw = textarea.offsetWidth - textarea.clientWidth;
      mirror.style.paddingRight = `${sw}px`;
    };
    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(textarea);
    return () => ro.disconnect();
  }, [readOnly]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    if (mirrorRef.current)
      mirrorRef.current.style.transform = `translateY(${-e.currentTarget.scrollTop}px)`;
  }, []);

  // Keep mirror in sync after every render — browser may adjust scrollTop
  // without firing scroll events (content change, paste, programmatic set).
  useLayoutEffect(() => {
    if (mirrorRef.current && textareaRef.current && !readOnly)
      mirrorRef.current.style.transform = `translateY(${-textareaRef.current.scrollTop}px)`;
  });

  if (readOnly) {
    return (
      <div className={cn("overflow-y-auto rounded-md border", className)}>
        <RenderedLines
          value={value}
          gutterCls={gutterCls}
          contentCls={contentCls}
        />
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden rounded-md border", className)}
    >
      {/* Mirror — visible rendered lines with inline gutter */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div ref={mirrorRef}>
          <RenderedLines
            value={deferredValue}
            gutterCls={gutterCls}
            contentCls={contentCls}
          />
        </div>
      </div>

      {/* Textarea — transparent text, captures input & scrolling */}
      <textarea
        ref={textareaRef}
        className={cn(
          "relative z-10 h-full w-full resize-none border-0 bg-transparent pl-[3.75rem] pr-3 font-mono text-transparent caret-foreground outline-none selection:bg-primary/20",
          contentFont,
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
        readOnly={readOnly}
      />
    </div>
  );
}
