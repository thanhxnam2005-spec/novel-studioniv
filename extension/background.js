// Novel Studio Connector — Background Service Worker
// v0.2.0: Anti-bot improvements + Kiwi Browser (mobile) support

// ─── Kiwi Browser Compatibility ──────────────────────────────
// Kiwi Browser on Android doesn't support chrome.windows API.
// We detect this and use tab-based approach instead.

let isKiwi = false;
try {
  // Kiwi doesn't have chrome.windows.create
  if (!chrome.windows || typeof chrome.windows.create !== "function") {
    isKiwi = true;
  }
} catch { isKiwi = true; }

// ─── Anti-Bot: Random User Behavior ─────────────────────────

function randomDelay(min, max) {
  return new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
}

// ─── Message Listener ────────────────────────────────────────

chrome.runtime.onMessageExternal.addListener(
  (request, _sender, sendResponse) => {
    if (request.type === "PING") {
      sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
      return false;
    }

    if (request.type === "FETCH") {
      handleFetch(
        request.url,
        request.waitSelector,
        request.clickSelector,
        request.timeout || 15000,
      )
        .then((result) => sendResponse({ ok: true, ...result }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true; // keep channel open for async response
    }

    sendResponse({ ok: false, error: "Unknown message type" });
    return false;
  },
);

// ─── Also support internal messages (for Kiwi popup/content scripts) ──
chrome.runtime.onMessage.addListener(
  (request, _sender, sendResponse) => {
    if (request.type === "PING") {
      sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
      return false;
    }

    if (request.type === "FETCH") {
      handleFetch(
        request.url,
        request.waitSelector,
        request.clickSelector,
        request.timeout || 15000,
      )
        .then((result) => sendResponse({ ok: true, ...result }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true;
    }

    sendResponse({ ok: false, error: "Unknown message type" });
    return false;
  },
);

// ─── Main Fetch Handler ──────────────────────────────────────

async function handleFetch(url, waitSelector, clickSelector, timeout) {
  const logs = [];
  const log = (msg) => { logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`); };

  let tabId, windowId, createdTab;

  if (isKiwi) {
    // Kiwi Browser: create a tab (no window API)
    createdTab = await chrome.tabs.create({ url, active: false });
    tabId = createdTab.id;
    windowId = null;
    log(`tab created (Kiwi mode, background tab)`);
  } else {
    // Desktop Chrome: create minimized window
    const win = await chrome.windows.create({ url, state: "minimized" });
    tabId = win.tabs[0].id;
    windowId = win.id;
    log(`tab created (minimized window)`);
  }

  try {
    await waitForTabLoad(tabId, 45000); // Increased timeout for mobile
    log(`page loaded`);

    // Anti-bot: simulate human-like delay before interaction
    const initialDelay = 1000 + Math.random() * 1500;
    await delay(initialDelay);
    log(`waited ${Math.round(initialDelay)}ms (anti-bot)`);

    // Anti-bot: scroll the page slightly to seem human
    await injectHumanBehavior(tabId);
    log(`injected human behavior`);

    let timedOut = false;
    if (clickSelector && waitSelector) {
      timedOut = await clickAndWait(tabId, clickSelector, waitSelector, timeout, log);
    } else if (clickSelector) {
      await robustClick(tabId, clickSelector);
      log(`clicked: ${clickSelector}`);
    } else if (waitSelector) {
      timedOut = await waitForSelector(tabId, waitSelector, timeout, 200);
      log(timedOut ? `wait timeout: ${waitSelector}` : `content ready: ${waitSelector}`);
    } else {
      await waitForStableContent(tabId, timeout);
      log(`content stabilized`);
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId },
      args: [waitSelector || null],
      func: (sel) => {
        const html =
          "<!DOCTYPE html><html>" +
          document.head.outerHTML +
          "<body>" +
          document.body.innerHTML +
          "</body></html>";

        let contentText = null;
        if (sel) {
          const el = document.querySelector(sel);
          if (el) contentText = el.innerText;
        }

        return { html, contentText };
      },
    });

    const data = results?.[0]?.result;
    if (!data) throw new Error("Failed to extract page content");

    log(`extracted: html=${data.html.length} contentText=${data.contentText?.length ?? 0}${timedOut ? " (TIMEOUT)" : ""}`);
    return { html: data.html, contentText: data.contentText, timedOut, logs };
  } catch (err) {
    log(`error: ${err.message}`);
    throw Object.assign(err, { logs });
  } finally {
    try {
      if (windowId) {
        await chrome.windows.remove(windowId);
      } else if (tabId) {
        await chrome.tabs.remove(tabId);
      }
    } catch {}
  }
}

// ─── Anti-Bot: Human Behavior Simulation ─────────────────────

async function injectHumanBehavior(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Simulate slight scroll
        window.scrollBy(0, Math.floor(Math.random() * 300) + 100);

        // Simulate mouse movement
        const event = new MouseEvent("mousemove", {
          clientX: Math.floor(Math.random() * window.innerWidth),
          clientY: Math.floor(Math.random() * window.innerHeight),
          bubbles: true,
        });
        document.dispatchEvent(event);
      },
    });
  } catch {
    // Ignore errors — some pages restrict script injection
  }
  await delay(300 + Math.random() * 500);
}

// ─── Click + Wait with Retry ────────────────────────────────

async function clickAndWait(tabId, clickSel, waitSel, timeout, log) {
  const maxRetries = 3;
  const perAttemptTimeout = Math.floor(timeout / maxRetries);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await robustClick(tabId, clickSel);
    log(`click attempt ${attempt + 1}/${maxRetries}`);

    const timedOut = await waitForSelector(
      tabId,
      waitSel,
      perAttemptTimeout,
      200,
    );

    if (!timedOut) {
      log(`content loaded after attempt ${attempt + 1}`);
      return false;
    }

    log(`attempt ${attempt + 1} timeout — retrying`);
    // Anti-bot: random delay between retries
    await randomDelay(500, 1500);
  }

  log("all click attempts exhausted");
  return true;
}

// ─── Robust Click ────────────────────────────────────────────

async function robustClick(tabId, selector) {
  await chrome.scripting.executeScript({
    target: { tabId },
    args: [selector],
    func: (sel) => {
      const el = document.querySelector(sel);
      if (!el) return;

      // Method 1: native click
      el.click();

      // Method 2: dispatch full mouse event sequence
      const opts = { bubbles: true, cancelable: true, view: window };
      el.dispatchEvent(new MouseEvent("mousedown", opts));
      el.dispatchEvent(new MouseEvent("mouseup", opts));
      el.dispatchEvent(new MouseEvent("click", opts));

      // Method 3: focus + Enter (for elements that respond to keyboard)
      if (typeof el.focus === "function") el.focus();
    },
  });
  await delay(500);
}

// ─── Wait for Selector ───────────────────────────────────────

async function waitForSelector(tabId, selector, maxWait, minLength) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        args: [selector],
        func: (sel) => {
          const el = document.querySelector(sel);
          if (!el) return 0;
          const clone = el.cloneNode(true);
          clone
            .querySelectorAll("script, style, noscript")
            .forEach((s) => s.remove());
          return clone.textContent.trim().length;
        },
      });
      const len = results?.[0]?.result ?? 0;
      if (len > minLength) return false;
    } catch {
      // Tab might not be ready yet, retry
    }
    await delay(500);
  }
  return true;
}

// ─── Wait for Stable Content ─────────────────────────────────

async function waitForStableContent(tabId, maxWait) {
  const start = Date.now();
  let lastLength = 0;
  let stableCount = 0;
  await delay(2000);
  while (Date.now() - start < maxWait) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const clone = document.body.cloneNode(true);
          clone
            .querySelectorAll("script,style,noscript")
            .forEach((el) => el.remove());
          return clone.textContent.trim().length;
        },
      });
      const len = results?.[0]?.result ?? 0;
      if (len === lastLength && len > 0) {
        stableCount++;
        if (stableCount >= 2) return;
      } else stableCount = 0;
      lastLength = len;
    } catch {
      // Retry
    }
    await delay(500);
  }
}

// ─── Wait for Tab Load ───────────────────────────────────────

function waitForTabLoad(tabId, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      // Don't reject on timeout — resolve anyway (page might be partially loaded)
      resolve();
    }, timeoutMs);
    function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        clearTimeout(timeout);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// ─── Utility ─────────────────────────────────────────────────

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
