/**
 * Novel Studio Extension - Background Script
 * Robust version with "Step-by-Step" reveal logic.
 */

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function handleFetch(url, options = {}) {
  const { smartScrape, timeout = 30000 } = options;
  const logs = [];
  const log = (msg) => logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);

  // Tab fetch is mandatory for XTruyen step-by-step reveal
  let tabId, windowId;
  try {
    const window = await chrome.windows.create({ url, state: "minimized" });
    windowId = window.id;
    tabId = window.tabs[0].id;
    log(`Tab created (id=${tabId})`);

    // Wait for initial page stability
    await delay(3000); 

    if (smartScrape === "XTRUYEN") {
      log("Starting XTruyen Step-by-Step Reveal...");
      
      await chrome.scripting.executeScript({
        target: { tabId },
        func: async () => {
          // STEP 1: Find all volume items
          const items = document.querySelectorAll('li.has-child[data-value]');
          console.log(`Found ${items.length} volumes to reveal`);

          for (const item of items) {
            // STEP 2: Force Reveal (Change none to block)
            const sub = item.querySelector('.sub-chap');
            if (sub) {
              sub.style.display = 'block';
              sub.style.visibility = 'visible';
              sub.style.opacity = '1';
            }
            
            // STEP 3: Trigger Load (Click the header)
            const header = item.querySelector('.single-chapter-list');
            if (header) {
              header.click();
            }
            
            // Small delay to prevent overwhelming the site
            await new Promise(r => setTimeout(r, 100));
          }

          // STEP 4: Final Wait for all AJAX to complete
          // We wait up to 5 seconds for spinners to disappear
          let stableCount = 0;
          for (let i = 0; i < 10; i++) {
            const spinners = document.querySelectorAll('.loading-spinner:not([style*="display: none"])');
            if (spinners.length === 0) {
              stableCount++;
              if (stableCount >= 2) break;
            } else {
              stableCount = 0;
            }
            await new Promise(r => setTimeout(r, 500));
          }
          
          // Scroll to trigger any last lazy loaders
          window.scrollTo(0, document.body.scrollHeight / 2);
          await new Promise(r => setTimeout(r, 500));
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise(r => setTimeout(r, 1000));
        }
      });
      log("XTruyen Reveal completed");
    }

    // Extract the fully populated HTML
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