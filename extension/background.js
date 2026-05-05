/**
 * Novel Studio Extension - Background Script
 * Cleaned and enhanced version.
 */

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function handleFetch(url, options = {}) {
  const { waitSelector, clickSelector, timeout = 15000 } = options;
  const logs = [];
  const log = (msg) => logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);

  // Background fetch logic (No tabs)
  // Triggered if:
  // 1. No selectors are provided (Simple API or HTML fetch)
  // 2. OR explicitly requested via a flag (if we added one)
  if (!waitSelector && !clickSelector) {
    log(`Using background fetch for ${url} (${options.method || 'GET'})`);
    try {
      const resp = await fetch(url, {
        method: options.method || "GET",
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          ...(options.headers || {})
        },
        body: options.body,
      });
      const html = await resp.text();
      log(`Background fetch successful (${html.length} chars)`);
      return { ok: true, html, logs };
    } catch (e) {
      log(`Background fetch error: ${e.message}. Falling back to tab...`);
      // Fallback to tab fetch if background fetch fails (might be blocked by Cloudflare)
    }
  }

  // Visual fetch using a tab
  let tabId, windowId;
  try {
    const window = await chrome.windows.create({ url, state: "minimized" });
    windowId = window.id;
    tabId = window.tabs[0].id;
    log(`Tab created (id=${tabId})`);

    // Wait for page to load
    await delay(2000); 

    if (clickSelector) {
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
      log(found ? "Selector found" : "Selector timeout");
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
    log(`Error: ${err.message}`);
    return { ok: false, error: err.message, logs };
  } finally {
    if (windowId) chrome.windows.remove(windowId).catch(() => {});
  }
}

// Listen for messages from the App
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.type === "PING") {
    sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
    return false;
  }

  if (request.type === "FETCH") {
    handleFetch(request.url, request)
      .then(sendResponse);
    return true;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "PING") {
    sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
    return false;
  }

  if (request.type === "FETCH") {
    handleFetch(request.url, request)
      .then(sendResponse);
    return true;
  }
});