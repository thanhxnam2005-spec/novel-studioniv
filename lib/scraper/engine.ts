import { sanitizeText } from "../utils";
import { extensionFetch, extensionDownloadSTVChapter, extensionStopScrape } from "./extension-bridge";
import type { ChapterContent, ChapterLink, SiteAdapter } from "./types";

export function sanitizeChapterContent(c: ChapterContent): ChapterContent {
  return {
    ...c,
    title: sanitizeText(c.title),
    content: sanitizeText(c.content, true),
  };
}

export interface ScrapeDebugEntry {
  chapterTitle: string;
  url: string;
  htmlLength: number;
  parsed: ChapterContent;
  extensionLogs?: string[];
  timedOut: boolean;
  contentTextLength: number;
  waitSelector?: string;
  clickSelector?: string;
}

/**
 * Scrape selected chapters sequentially through the extension.
 */
export async function scrapeChapters(
  chapters: ChapterLink[],
  adapter: SiteAdapter,
  onProgress?: (completed: number, total: number, currentTitle: string) => void,
  signal?: AbortSignal,
  onDebug?: (entry: ScrapeDebugEntry) => void,
  delayMs: number = 300,
  onPauseCheck?: () => boolean,
): Promise<ChapterContent[]> {
  const results: ChapterContent[] = [];

  const safeDelayMs = Math.max(delayMs, 100);

  for (let i = 0; i < chapters.length; i++) {
    signal?.throwIfAborted();

    // Wait BEFORE starting the next chapter to ensure tab switching is synced with delay
    if (i > 0) {
      await delay(safeDelayMs);
    }

    const chapter = chapters[i];
    onProgress?.(i, chapters.length, chapter.title);

    // Pause loop
    while (onPauseCheck?.()) {
      await delay(1000);
      signal?.throwIfAborted();
    }


    let html = "";
    let contentText: string | undefined = undefined;
    let timedOut = false;
    let logs: string[] = [];

    let extTitle: string | undefined = undefined;
    if (adapter.name === "STV" && chapter.id) {
      try {
        const res = await extensionDownloadSTVChapter(
          chapter.id,
          chapter.url,
          i < chapters.length - 1 && !signal?.aborted,
        );
        html = res.data ?? "";
        contentText = (res as any).contentText ?? res.content ?? undefined;
        timedOut = (res as any).timedOut ?? false;
        extTitle = res.title;
        if (res.stopped) break;
      } catch (err: any) {
        timedOut = true; // Mark as issue if it fails
        logs.push(err.message);
      }
    } else {
      const fetchRes = await extensionFetch(chapter.url, {
        waitSelector: adapter.chapterWaitSelector,
        clickSelector: adapter.chapterClickSelector,
      });
      html = fetchRes.html;
      contentText = fetchRes.contentText;
      timedOut = fetchRes.timedOut ?? false;
      logs = fetchRes.logs ?? [];
    }
    const content = sanitizeChapterContent(
      await adapter.getChapterContent(html, chapter.url, contentText),
    );
    content.order = chapter.order;

    // Fallback to title from index page or extension result if extracted title is empty
    if (!content.title || content.title.trim() === "") {
      content.title = extTitle || chapter.title;
    }

    // Check if content is identical to previous chapter (STV common issue)
    if (adapter.name === "STV" && i > 0 && results.length > 0) {
      const prevContent = results[results.length - 1].content;
      if (content.content.trim() === prevContent.trim() && content.content.length > 100) {
         await extensionStopScrape();
         throw new Error(
           `Phát hiện nội dung chương "${chapter.title}" giống hệt chương trước. Có thể STV chưa load kịp chương mới. Vui lòng mở tab SangTacViet, bấm load lại chương này, sau đó quay lại đây bấm "Tiếp tục".`
         );
      }
    }

    if (timedOut) {
      content.warning = `Timeout — nội dung chưa load được (${content.content.length} ký tự)`;
    } else if (content.content.length < 30) {
      content.warning = `Nội dung quá ngắn (${content.content.length} ký tự)`;
    }
    results.push(content);

    onDebug?.({
      chapterTitle: chapter.title,
      url: chapter.url,
      htmlLength: html.length,
      parsed: content,
      extensionLogs: logs,
      timedOut: timedOut ?? false,
      contentTextLength: contentText?.length ?? 0,
      waitSelector: adapter.chapterWaitSelector,
      clickSelector: adapter.chapterClickSelector,
    });

    // For STV, stop IMMEDIATELY if content is missing or too short
    // This allows the user to reload the tab manually as requested.
    if (adapter.name === "STV" && (timedOut || content.content.length < 30)) {
      await extensionStopScrape();
      throw new Error(
        `Chương "${chapter.title}" không load được nội dung. Vui lòng mở tab SangTacViet, đảm bảo chương này đã hiện nội dung, sau đó quay lại đây bấm "Tiếp tục".`,
      );
    }

    if (results.length >= 3) {
      const lastThree = results.slice(-3);
      if (lastThree.every((ch) => ch.warning)) {
        await extensionStopScrape();
        throw new Error(
          "Đã dừng: 3 chương liên tiếp không load được nội dung. Vui lòng kiểm tra lại trang nguồn.",
        );
      }
    }
  }

  await extensionStopScrape();
  onProgress?.(chapters.length, chapters.length, "");
  return results;
}

export async function crawlNovel(
  startUrl: string,
  adapter: SiteAdapter,
  onChapterScraped: (content: ChapterContent, url: string) => Promise<void>,
  onProgress?: (completed: number, currentTitle: string) => void,
  signal?: AbortSignal,
  delayMs: number = 2000,
  onPauseCheck?: () => boolean,
): Promise<void> {
  let currentUrl = startUrl;
  let completed = 0;

  while (currentUrl) {
    signal?.throwIfAborted();

    // Pause loop
    while (onPauseCheck?.()) {
      await delay(1000);
      signal?.throwIfAborted();
    }

    const fetchRes = await extensionFetch(currentUrl, {
      waitSelector: adapter.chapterWaitSelector,
      clickSelector: adapter.chapterClickSelector,
    });

    const content = sanitizeChapterContent(
      await adapter.getChapterContent(fetchRes.html, currentUrl, fetchRes.contentText),
    );

    onProgress?.(++completed, content.title || "Chương không rõ");
    
    await onChapterScraped(content, currentUrl);

    currentUrl = content.nextChapterUrl || "";
    
    if (currentUrl) {
      await delay(delayMs);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
