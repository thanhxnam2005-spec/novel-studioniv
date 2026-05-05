import { cleanGarbageLines } from "../../text-utils";
import type { SiteAdapter, ChapterLink } from "../types";
import { extensionFetch } from "../extension-bridge";

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

  async getNovelInfo(html, url) {
    const doc = new DOMParser().parseFromString(html, "text/html");

    const title = doc.querySelector(".post-title h1")?.textContent?.trim() || "";
    const author = doc.querySelector(".author-content a")?.textContent?.trim() || "Đang cập nhật";
    const coverImage = doc.querySelector(".summary_image img")?.getAttribute("src") || "";
    const description = doc.querySelector(".description-summary .summary__content")?.textContent?.trim() || "";

    // 1. Find Manga ID - Robust extraction
    let mangaId = "";
    
    // Method A: Body class (post-1234)
    const bodyClass = doc.body.className;
    const postMatch = bodyClass.match(/post-(\d+)/);
    if (postMatch) mangaId = postMatch[1];

    // Method B: Article ID (post-1234)
    if (!mangaId) {
      const article = doc.querySelector('article[id^="post-"]');
      if (article) mangaId = article.id.replace("post-", "");
    }

    // Method C: Script tags (var manga_id = '1234';)
    if (!mangaId) {
      const scripts = Array.from(doc.querySelectorAll('script'));
      for (const s of scripts) {
        const content = s.textContent || "";
        const m = content.match(/manga_id\s*=\s*['"](\d+)['"]/);
        if (m) {
          mangaId = m[1];
          break;
        }
      }
    }

    // Method D: Hidden inputs or data attributes
    if (!mangaId) {
      const idElem = doc.querySelector('[data-id], #manga-chapters-holder, .rating-post-id');
      mangaId = idElem?.getAttribute("data-id") || idElem?.getAttribute("value") || "";
    }

    if (!mangaId) {
       // Method E: Find any "post-XXX" ID in the document
       const postElem = doc.querySelector('[id*="post-"]');
       const m = postElem?.id.match(/post-(\d+)/);
       if (m) mangaId = m[1];
    }

    // 2. Fetch all chapters by scanning the DOM for all sub-chap-list elements
    // The user pointed out that chapters are already there, just hidden.
    const allChapterLinks: ChapterLink[] = [];
    
    // Use the initial HTML we already have
    const chapterItems = Array.from(doc.querySelectorAll('ul.sub-chap-list li.wp-manga-chapter a'));
    
    chapterItems.forEach(a => {
      allChapterLinks.push({
        title: a.textContent?.trim() || "Chương không rõ",
        url: (a as HTMLAnchorElement).href,
        order: 0
      });
    });

    // If no chapters found in initial HTML, try one more time via extension (just in case)
    if (allChapterLinks.length === 0) {
      try {
        const response = await extensionFetch(url);
        if (response.html) {
          const fullDoc = new DOMParser().parseFromString(response.html, "text/html");
          const items = Array.from(fullDoc.querySelectorAll('ul.sub-chap-list li.wp-manga-chapter a'));
          items.forEach(a => {
            allChapterLinks.push({
              title: a.textContent?.trim() || "Chương không rõ",
              url: (a as HTMLAnchorElement).href,
              order: 0
            });
          });
        }
      } catch (e) {
        console.error("XTruyen fallback fetch failed", e);
      }
    }

    // 4. Fallback/Safety: If still no chapters, try the previous global scan on initial HTML
    if (allChapterLinks.length === 0) {
      const links = Array.from(doc.querySelectorAll('a')).filter(a => {
        const href = a.getAttribute('href') || '';
        return /\/chuong-[\d]+/.test(href) || /\/chapter-[\d]+/.test(href);
      });
      allChapterLinks.push(...links.map(a => ({
        title: a.textContent?.trim() || "Chương không rõ",
        url: (a as HTMLAnchorElement).href,
        order: 0
      })));
    }

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const uniqueChapters: ChapterLink[] = [];
    
    allChapterLinks.forEach(ch => {
      if (!seenUrls.has(ch.url)) {
        seenUrls.add(ch.url);
        uniqueChapters.push(ch);
      }
    });

    // Sort chapters by number extracted from URL to ensure correct order
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
