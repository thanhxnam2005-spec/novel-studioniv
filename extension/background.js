/**
 * Novel Studio Extension - Background Script
 * Enhanced with Smart Scrape capabilities.
 */

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function handleFetch(url, options = {}) {
  const { waitSelector, clickSelector, smartScrape, timeout = 15000 } = options;
  const logs = [];
  const log = (msg) => logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);

  // 1. Try background fetch for simple cases
  if (!waitSelector && !clickSelector && !smartScrape) {
    log(`Background fetch: ${url}`);
    try {
      const resp = await fetch(url, {
        method: options.method || "GET",
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          ...(options.headers || {})
        },
        body: options.body,
      });
      const html = await resp.text();
      return { ok: true, html, logs };
    } catch (e) {
      log(`Background fetch failed, trying tab...`);
    }
  }

  // 2. Tab fetch for complex interaction
  let tabId, windowId;
  try {
    const window = await chrome.windows.create({ url, state: "minimized" });
    windowId = window.id;
    tabId = window.tabs[0].id;

    // Wait for initial load
    await delay(3000); 

    if (smartScrape === "XTRUYEN") {
      log("Executing XTruyen Smart Scrape script...");
      await chrome.scripting.executeScript({
        target: { tabId },
        func: async () => {
          const items = document.querySelectorAll('li.has-child[data-value]');
          for (const item of items) {
            item.click();
            // Force display
            const sub = item.querySelector('.sub-chap');
            if (sub) sub.style.display = 'block';
            await new Promise(r => setTimeout(r, 200));
          }
          // Scroll to bottom to trigger any lazy loading
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise(r => setTimeout(r, 1000));
        }
      });
      log("Smart Scrape finished");
    } else if (clickSelector) {
      log(`Clicking ${clickSelector}`);
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (sel) => document.querySelector(sel)?.click(),
        args: [clickSelector],
      });
      await delay(1000);
    }

    if (waitSelector) {
      log(`Waiting for ${waitSelector}`);
      let found = false;
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: (sel) => !!document.querySelector(sel),
          args: [waitSelector],
        });
        if (results[0].result) {
          found = true;
          break;
        }
        await delay(500);
      }
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({
        html: document.documentElement.outerHTML,
        innerText: document.body.innerText
      }),
    });

    const data = results[0].result;
    return { ok: true, html: data.html, contentText: data.innerText, logs };

  } catch (err) {
    return { ok: false, error: err.message, logs };
  } finally {
    if (windowId) chrome.windows.remove(windowId).catch(() => {});
  }
}

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.type === "PING") {
    sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
    return false;
  }
  if (request.type === "FETCH") {
    handleFetch(request.url, request).then(sendResponse);
    return true;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "PING") {
    sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
    return false;
  }
  if (request.type === "FETCH") {
    handleFetch(request.url, request).then(sendResponse);
    return true;
  }
});