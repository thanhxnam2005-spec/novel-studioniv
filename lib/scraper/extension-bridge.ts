/**
 * Communication bridge between Novel Studio and the Chrome extension.
 *
 * The extension acts as a CORS proxy by loading URLs in real browser tabs,
 * extracting HTML via content script injection, then returning it here.
 */

const STORAGE_KEY = "novel-studio:extension-id";
const TIMEOUT_KEY = "novel-studio:scrape-timeout";

export function getExtensionId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function setExtensionId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id.trim());
}

export function getScrapeTimeout(): number {
  if (typeof window === "undefined") return 15000;
  const val = localStorage.getItem(TIMEOUT_KEY);
  return val ? parseInt(val, 10) : 15000;
}

export function setScrapeTimeout(ms: number): void {
  localStorage.setItem(TIMEOUT_KEY, String(ms));
}

// ─── Chrome API typing ─────────────────────────────────────

interface ExtensionResponse {
  ok: boolean;
  html?: string;
  contentText?: string;
  timedOut?: boolean;
  logs?: string[];
  error?: string;
  version?: string;
}

function getChromeRuntime(): {
  sendMessage: (
    extensionId: string,
    message: unknown,
    callback: (response: unknown) => void,
  ) => void;
} | null {
  // Access the real browser chrome.runtime (not our custom type)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (globalThis as any).chrome;
  if (c?.runtime?.sendMessage) return c.runtime;
  return null;
}

// ─── Tampermonkey Bridge ───────────────────────────────────

const tmCallbackMap = new Map<string, (res: any) => void>();

if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (data && data.source === "novel-studio-bridge" && data.id) {
      const cb = tmCallbackMap.get(data.id);
      if (cb) {
        cb(data.response);
        tmCallbackMap.delete(data.id);
      }
    }
  });
}

function sendTampermonkeyMessage(message: any): Promise<ExtensionResponse> {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).substring(7);
    const timeout = setTimeout(() => {
      tmCallbackMap.delete(id);
      reject(new Error("Tampermonkey Bridge timeout"));
    }, message.timeout || 30000);

    tmCallbackMap.set(id, (response) => {
      clearTimeout(timeout);
      resolve(response as ExtensionResponse);
    });

    window.postMessage(
      {
        source: "novel-studio-app",
        id: id,
        action: message.type || message.action,
        url: message.url,
        payload: message.payload,
      },
      "*"
    );
  });
}

// ─── Core Logic ────────────────────────────────────────────

export function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function sendMessage(message: unknown): Promise<ExtensionResponse> {
  const extensionId = getExtensionId();
  
  // If explicitly set to "tampermonkey" or on Android with no extension ID configured, use userscript bridge
  if (extensionId === "tampermonkey" || (isAndroid() && !extensionId)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return sendTampermonkeyMessage(message as any);
  }

  return new Promise((resolve, reject) => {
    const runtime = getChromeRuntime();
    if (!runtime) {
      // Fallback to tampermonkey if chrome runtime is missing but it might be available
      if (typeof window !== "undefined") {
        return sendTampermonkeyMessage(message as any).then(resolve).catch(reject);
      }
      reject(new Error("Chrome extension API not available"));
      return;
    }

    if (!extensionId) {
      reject(new Error("Extension ID chưa được cấu hình. Nếu dùng Android, hãy nhập 'tampermonkey' vào ID."));
      return;
    }

    runtime.sendMessage(extensionId, message, (response: unknown) => {
      if (!response) {
        // Last resort: try tampermonkey bridge if extension didn't respond
        sendTampermonkeyMessage(message as any).then(resolve).catch(() => {
          reject(new Error("Không có phản hồi từ Extension. Hãy kiểm tra ID hoặc dùng Tampermonkey."));
        });
        return;
      }
      resolve(response as ExtensionResponse);
    });
  });
}

/**
 * Fetch a URL through the extension (bypasses CORS + Cloudflare).
 * @param waitSelector - Optional CSS selector to wait for before extracting HTML.
 */
export interface FetchResult {
  html: string;
  contentText?: string;
  timedOut?: boolean;
  logs?: string[];
}

export async function extensionFetch(
  url: string,
  options: {
    waitSelector?: string;
    clickSelector?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
    smartScrape?: "XTRUYEN" | string;
  } = {}
): Promise<FetchResult> {
  const timeout = options.timeout || getScrapeTimeout();
  const response = await sendMessage({ 
    type: "FETCH", 
    url, 
    ...options,
    timeout 
  });
  if (!response.ok) {
    throw new Error(response.error ?? "Extension fetch failed");
  }
  return {
    html: response.html!,
    contentText: response.contentText ?? undefined,
    timedOut: response.timedOut ?? false,
    logs: response.logs,
  };
}

export async function extensionDownloadSTVChapter(
  chapterId: string | number,
  chapterUrl: string,
  allowNext: boolean = true,
): Promise<{ success: boolean; rawHtml?: string; content?: string; data?: string; title?: string; json?: any; error?: string; stopped?: boolean }> {
  const response: any = await sendMessage({
    action: "downloadChapter",
    payload: { chapterId, chapterUrl, allowNext },
  });
  if (!response.success) {
    throw new Error(response.error ?? "SangTacViet download failed");
  }
  return response;
}

/**
 * Tell the extension to stop any pending automated navigation (next chapter).
 */
export async function extensionStopScrape(): Promise<void> {
  try {
    await sendMessage({ action: "stopScrape" });
  } catch (err) {
    console.warn("Stop scrape signal failed:", err);
  }
}

/**
 * Check if the extension is installed and responsive.
 * Returns the version string if available, or null if not connected.
 */
export async function checkExtensionStatus(): Promise<{
  available: boolean;
  version: string | null;
}> {
  if (!getExtensionId()) return { available: false, version: null };

  try {
    const response = await Promise.race([
      sendMessage({ type: "PING" }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000),
      ),
    ]);
    return {
      available: response.ok === true,
      version: response.version ?? null,
    };
  } catch {
    return { available: false, version: null };
  }
}

/**
 * @deprecated Use checkExtensionStatus instead
 */
export async function isExtensionAvailable(): Promise<boolean> {
  const { available } = await checkExtensionStatus();
  return available;
}
