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

    // XTruyen (Madara theme) specific: chapters can be in .wp-manga-chapter or just .list-chap
    // We use a broad selector to catch all potential links in the list area
    const chapterContainers = doc.querySelectorAll('.list-chap, .main.version-chap, #chapter-reading-content');
    let links: HTMLAnchorElement[] = [];
    
    chapterContainers.forEach(container => {
      const found = container.querySelectorAll('a[href*="/chuong-"], a[href*="/chapter-"]');
      links.push(...(Array.from(found) as HTMLAnchorElement[]));
    });

    // Fallback: search everywhere if still empty
    if (links.length === 0) {
      links = Array.from(doc.querySelectorAll('a[href*="/chuong-"]')) as HTMLAnchorElement[];
    }

    // Remove duplicates by URL
    const uniqueLinks = Array.from(new Map(links.map(l => [l.href, l])).values());

    const chapters = uniqueLinks.map((el, i) => ({
      title: el.textContent?.trim() || `Chương ${i + 1}`,
      url: el.href,
      order: i,
    }));

    // If chapters are listed newest-first (common in Madara), we should check
    // If the first chapter URL has a higher number than the last, reverse it.
    // For now, XTruyen sample was ascending, so we keep it.
    
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
