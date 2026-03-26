"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { computeDiff, formatStats, type DiffResult } from "@/lib/chapter-tools/diff-utils";
import { DiffHighlight } from "@/components/chapter-tools/diff-highlight";
import { ColumnsIcon, RowsIcon } from "lucide-react";

interface VersionDiffViewProps {
  versionContent: string;
  currentContent: string;
}

/**
 * Async diff computation hook.
 * Yields to the browser via requestIdleCallback before running the expensive diff.
 */
function useAsyncDiff(a: string, b: string): DiffResult | null {
  const [result, setResult] = useState<DiffResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    const id = requestIdleCallback(
      () => {
        const diff = computeDiff(a, b);
        if (!cancelled) setResult(diff);
      },
      { timeout: 100 },
    );

    return () => {
      cancelled = true;
      cancelIdleCallback(id);
      setResult(null);
    };
  }, [a, b]);

  return result;
}

export function VersionDiffView({
  versionContent,
  currentContent,
}: VersionDiffViewProps) {
  const [mode, setMode] = useState<"inline" | "side-by-side">("inline");
  const diff = useAsyncDiff(versionContent, currentContent);

  if (!diff) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Stats bar + mode toggle */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {formatStats(diff.stats)}
        </span>
        <div className="ml-auto flex items-center gap-1 rounded-md border p-0.5">
          <Button
            variant={mode === "inline" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setMode("inline")}
          >
            <RowsIcon className="mr-1 size-3" />
            Nội tuyến
          </Button>
          <Button
            variant={mode === "side-by-side" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setMode("side-by-side")}
          >
            <ColumnsIcon className="mr-1 size-3" />
            Cạnh nhau
          </Button>
        </div>
      </div>

      {mode === "inline" ? (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border p-3">
          <DiffHighlight changes={diff.changes} />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
          <div className="flex min-h-0 flex-col">
            <span className="mb-1 shrink-0 text-xs font-medium text-muted-foreground">
              Phiên bản cũ
            </span>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-md border p-3">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {diff.changes.map((change, i) => {
                  if (change.added) return null;
                  if (change.removed) {
                    return (
                      <span
                        key={i}
                        className="rounded-sm bg-red-100 text-red-800 line-through dark:bg-red-900/40 dark:text-red-300"
                      >
                        {change.value}
                      </span>
                    );
                  }
                  return <span key={i}>{change.value}</span>;
                })}
              </div>
            </div>
          </div>
          <div className="flex min-h-0 flex-col">
            <span className="mb-1 shrink-0 text-xs font-medium text-muted-foreground">
              Hiện tại
            </span>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-md border p-3">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {diff.changes.map((change, i) => {
                  if (change.removed) return null;
                  if (change.added) {
                    return (
                      <span
                        key={i}
                        className="rounded-sm bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      >
                        {change.value}
                      </span>
                    );
                  }
                  return <span key={i}>{change.value}</span>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
