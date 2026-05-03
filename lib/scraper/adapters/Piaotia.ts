import type { SiteAdapter } from "../types";
import { extensionFetch } from "../extension-bridge";

export const PiaotiaAdapter: SiteAdapter = {
  name: "飘天文学",
  urlPattern: /piaotia\.com/i,
  chapterWaitSelector: "#content",

  async getNovelInfo(html, url) {
    let doc = new DOMParser().parseFromString(html, "text/html");
    const base = new URL(url);

    // Check if we are on the book info page instead of the chapter list (index.html)
    // The chapter list URL usually contains /html/ and ends with /index.html
    const isIndexPage = url.includes("/html/") && url.endsWith("/index.html");
    
    if (!isIndexPage) {
      // Try to find the link to the chapter list
      const indexLink = doc.querySelector("a[href*='/html/'][href$='/index.html']");
      if (indexLink) {
        const indexUrl = new URL(indexLink.getAttribute("href") || "", base).href;
        const res = await extensionFetch(indexUrl);
        doc = new DOMParser().parseFromString(res.html, "text/html");
      }
    }

    const title = doc.querySelector("h1")?.textContent?.trim() || "";
    
    // Author and Description are in <td> elements with specific labels
    let author = "";
    let description = "";
    const tds = doc.querySelectorAll("td");
    tds.forEach((td) => {
      const text = td.textContent || "";
      if (text.includes("作    者：")) {
        author = text.split("：")[1]?.trim() || "";
      }
      if (text.includes("内容简介：")) {
        description = text.split("：")[1]?.trim() || "";
      }
    });

    const coverImg = doc.querySelector("img[src*='/bookimage/'], img[src*='/files/article/image/']");
    let coverImage = coverImg ? new URL(coverImg.getAttribute("src") || "", base).href : undefined;

    // If no cover found, try to derive from URL
    if (!coverImage) {
      const match = url.match(/\/(?:html|bookinfo)\/(\d+)\/(\d+)(?:\/index)?\.html/i);
      if (match) {
        const [, a, b] = match;
        coverImage = `https://www.piaotia.com/files/article/image/${a}/${b}/${b}s.jpg`;
      }
    }

    // Chapters are usually in <div class="centent"> -> <ul><li><a> or <table><td><a>
    const chapterLinks = doc.querySelectorAll(".centent a[href$='.html']");
    const chapters = Array.from(chapterLinks).map((a, i) => ({
      title: a.textContent?.trim() || `Chương ${i + 1}`,
      url: new URL(a.getAttribute("href") || "", base).href,
      order: i,
    }));

    return { title, author, description, coverImage, chapters };
  },

  getChapterContent(html, _url, contentText) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const chapterTitle = doc.querySelector("h1")?.textContent?.trim() || "";

    // Prefer contentText from extension
    let text = contentText || "";
    if (!text) {
      const contentEl = doc.querySelector("#content");
      if (contentEl) {
        // Remove navigation links and common noise
        contentEl.querySelectorAll(".toplink, script, style, a").forEach((el) => el.remove());
        text = contentEl.textContent || "";
      }
    }

    // Clean up
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/飘天文学/g, "")
      .replace(/www\.piaotia\.com/g, "")
      .replace(/【[^\]]+】/g, "") // Remove common bracketed ads
      .trim();

    return { title: chapterTitle, content: text };
  },
};
