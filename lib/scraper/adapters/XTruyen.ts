import { cleanGarbageLines } from "../../text-utils";
import type { SiteAdapter } from "../types";

/**
 * Adapter for XTruyen.vn
 */
export const XTruyenAdapter: SiteAdapter = {
  name: "XTruyen",
  group: "vn",
  urlPattern: /xtruyen\.vn/,
  // The site might hide chapters in collapsible blocks, 
  // but usually they are present in the DOM or loaded via JS.
  chapterWaitSelector: "#chapter-reading-content",

  getNovelInfo(html, url) {
    const doc = new DOMParser().parseFromString(html, "text/html");

    const title = doc.querySelector(".post-title h1")?.textContent?.trim() || "";
    const author = doc.querySelector(".author-content a")?.textContent?.trim() || "Đang cập nhật";
    const coverImage = doc.querySelector(".summary_image img")?.getAttribute("src") || "";
    
    // Description
    const description = doc.querySelector(".description-summary .summary__content")?.textContent?.trim() || "";

    // Global aggressive scan: Find EVERY link that looks like a chapter URL anywhere in the document
    const allLinks = Array.from(doc.querySelectorAll('a'));
    const chapterLinks = allLinks.filter(a => {
      const href = a.getAttribute('href') || '';
      // XTruyen patterns: /chuong-1/, /chapter-1/, etc.
      return /\/chuong-[\d]+/.test(href) || /\/chapter-[\d]+/.test(href);
    });

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const uniqueChapters: ChapterLink[] = [];
    
    chapterLinks.forEach(el => {
      const url = (el as HTMLAnchorElement).href;
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        uniqueChapters.push({
          title: el.textContent?.trim() || "Chương không rõ",
          url: url,
          order: 0, // Will set below
        });
      }
    });

    // Sort chapters by number extracted from URL to ensure correct order
    // Example: .../chuong-10/ should come after .../chuong-2/
    const chapters = uniqueChapters.map(ch => {
      const match = ch.url.match(/chuong-([\d]+)/) || ch.url.match(/chapter-([\d]+)/);
      const num = match ? parseInt(match[1], 10) : 0;
      return { ...ch, num };
    }).sort((a, b) => a.num - b.num)
      .map((ch, i) => ({
        title: ch.title,
        url: ch.url,
        order: i
      }));

    return { title, author, description, coverImage, chapters };
  },

  getChapterContent(html, _url, contentText) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const container = doc.querySelector("#chapter-reading-content");
    
    if (!container && !contentText) return { title: "", content: "" };

    // If we have contentText (from extension bridge innerText), it's cleaner
    let rawText = contentText || "";

    if (!rawText && container) {
      // Remove ads and unwanted elements
      container.querySelectorAll(".aam-ad-container, .carousel, script, style").forEach(el => el.remove());
      rawText = container.innerText;
    }

    const title = doc.querySelector(".breadcrumb li.active")?.textContent?.trim() || "";

    // Clean up
    let text = rawText
      .split("\n")
      .map(line => line.trim())
      .filter(line => {
        if (!line) return false;
        // Filter out common ad lines or UI text
        if (line.includes("MonkeyD.net.vn")) return false;
        if (line.includes("________________________________________")) return false;
        return true;
      })
      .join("\n\n");

    text = cleanGarbageLines(text);

    return { title, content: text };
  },
};
