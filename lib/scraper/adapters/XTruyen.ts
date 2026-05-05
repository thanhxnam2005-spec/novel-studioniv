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

    // 1. Find Manga ID
    // Often in body class like "post-1234" or in an article ID
    let mangaId = "";
    const bodyClass = doc.body.className;
    const postMatch = bodyClass.match(/post-(\d+)/);
    if (postMatch) {
      mangaId = postMatch[1];
    } else {
      // Fallback: check article tag
      const article = doc.querySelector('article[id^="post-"]');
      if (article) {
        mangaId = article.id.replace("post-", "");
      }
    }

    if (!mangaId) {
      // Last resort: check if there's any element with data-id or similar
      const idElem = doc.querySelector('[data-id], #manga-chapters-holder');
      mangaId = idElem?.getAttribute("data-id") || "";
    }

    // 2. Find all Volume ranges (1-to-200, 201-to-400, etc.)
    const volumeItems = Array.from(doc.querySelectorAll('li.has-child[data-value]'));
    const ranges = volumeItems.map(li => li.getAttribute('data-value') || "");

    const allChapterLinks: ChapterLink[] = [];

    if (mangaId && ranges.length > 0) {
      // 3. Fetch each range via the discovered API
      const apiEndpoint = "https://xtruyen.vn/api/api-chapters.php";
      
      const fetchPromises = ranges.map(async (range) => {
        const [from, to] = range.split("-to-");
        if (!from || !to) return [];

        try {
          // Use extensionFetch with URLSearchParams for POST body
          const params = new URLSearchParams();
          params.append("manga_id", mangaId);
          params.append("from", from);
          params.append("to", to.replace("m", "")); // Handle cases like 5189m
          params.append("vol", "");

          const response = await extensionFetch(apiEndpoint, {
            method: "POST",
            body: params.toString(),
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            }
          });

          if (response.html) {
            const rangeDoc = new DOMParser().parseFromString(response.html, "text/html");
            const links = Array.from(rangeDoc.querySelectorAll('a'));
            return links.map(a => ({
              title: a.textContent?.trim() || "Chương không rõ",
              url: (a as HTMLAnchorElement).href,
              order: 0
            }));
          }
        } catch (e) {
          console.error(`Failed to fetch range ${range} for manga ${mangaId}`, e);
        }
        return [];
      });

      const results = await Promise.all(fetchPromises);
      results.forEach(list => allChapterLinks.push(...list));
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
