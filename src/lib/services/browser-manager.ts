import { Redis } from "@upstash/redis";

/**
 * Browser Manager Service
 * Manages headless Chromium instances via Playwright for the AI agent's
 * virtual browsing capabilities. Provides navigation, interaction, and
 * screencasting (live frame capture) APIs.
 */

let chromium: any = null;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || "";
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export interface BrowserStep {
  action: string;
  description: string;
  status: "running" | "done" | "error";
  timestamp?: number;
}

interface BrowserSession {
  browser: any;
  context: any;
  page: any;
  sessionId: string;
  createdAt: Date;
  screencasting: boolean;
  frameCallback: ((frame: string) => void) | null;
  stepCallback: ((step: { action: string; description: string; status: string }) => void) | null;
}

// In-memory fallback map (local dev only)
const globalForBrowser = globalThis as unknown as {
  browserSessions: Map<string, BrowserSession>;
};
const sessions = globalForBrowser.browserSessions ?? new Map<string, BrowserSession>();
if (process.env.NODE_ENV !== "production") {
  globalForBrowser.browserSessions = sessions;
}

const MAX_SESSIONS = 5;
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

async function getChromium() {
  if (!chromium) {
    try {
      const pw = await import("playwright-core");
      chromium = pw.chromium;
    } catch (err) {
      console.error("[BrowserManager] playwright-core not installed:", err);
      throw new Error(
        "playwright-core is not installed. Run: npm install playwright-core && npx playwright install chromium"
      );
    }
  }
  return chromium;
}

async function startBrowserlessSession(token: string): Promise<{ connect: string; stop: string }> {
  const res = await fetch(`https://chrome.browserless.io/session?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ttl: 300000, // 5 minutes session TTL (Required by Browserless Session API)
      stealth: true,
      headless: true
    })
  });
  if (!res.ok) {
    throw new Error(`Failed to create Browserless session: ${res.statusText}`);
  }
  return await res.json() as { connect: string; stop: string };
}

/**
 * Executes a function using the page context from the active session.
 * Connects on-demand to the remote CDP session if Redis is configured (serverless mode),
 * or reads from the local in-memory map (development/fallback mode).
 */
async function withSessionPage<T>(
  sessionId: string,
  fn: (page: any) => Promise<T>
): Promise<T> {
  if (redis) {
    const sessionRaw = await redis.get(`browser:session:${sessionId}`);
    if (sessionRaw) {
      const sessionData = typeof sessionRaw === "string" ? JSON.parse(sessionRaw) : sessionRaw;
      const connectUrl = sessionData.connectUrl;
      const ch = await getChromium();
      console.log(`[BrowserManager] Connecting to remote CDP session for action: ${sessionId}`);
      const browser = await ch.connectOverCDP(connectUrl);
      try {
        const context = browser.contexts()[0];
        const page = context.pages()[0] || await context.newPage();
        return await fn(page);
      } finally {
        await browser.close();
      }
    }
  }

  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);
  return await fn(session.page);
}

/**
 * Creates a new browser session and returns the session ID.
 */
export async function createSession(): Promise<string> {
  const wsUrl = process.env.BROWSERLESS_WS_URL;
  const tokenMatch = wsUrl?.match(/token=([a-zA-Z0-9\-]+)/);
  const token = tokenMatch ? tokenMatch[1] : "";
  const sessionId = `browser-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (wsUrl && token && redis) {
    console.log("[BrowserManager] Creating persistent Browserless session via REST API...");
    try {
      const sessionInfo = await startBrowserlessSession(token);
      
      // Store connection URL in Redis
      await redis.set(`browser:session:${sessionId}`, JSON.stringify({
        connectUrl: sessionInfo.connect,
        stopUrl: sessionInfo.stop,
        createdAt: Date.now()
      }), { ex: 300 }); // 5 minutes TTL
      
      // Initialize steps and frame keys
      await redis.set(`browser:steps:${sessionId}`, JSON.stringify([]), { ex: 300 });
      await redis.set(`browser:frame:${sessionId}`, "", { ex: 300 });
      
      console.log(`[BrowserManager] Session ${sessionId} stored in Redis`);
      return sessionId;
    } catch (err) {
      console.error("[BrowserManager] Failed to start Browserless persistent session, falling back to local:", err);
    }
  }

  // Fallback to local Chromium instance (Dev environment)
  if (sessions.size >= MAX_SESSIONS) {
    const oldest = [...sessions.entries()].sort(
      (a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime()
    )[0];
    if (oldest) {
      await destroySession(oldest[0]);
    }
  }

  const ch = await getChromium();
  console.log("[BrowserManager] Launching local Chromium instance (local fallback)");
  const browser = await ch.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  const session: BrowserSession = {
    browser,
    context,
    page,
    sessionId,
    createdAt: new Date(),
    screencasting: false,
    frameCallback: null,
    stepCallback: null,
  };

  sessions.set(sessionId, session);

  // Auto-destroy after timeout
  setTimeout(() => {
    destroySession(sessionId).catch(() => {});
  }, SESSION_TIMEOUT_MS);

  return sessionId;
}

/**
 * Navigates to a URL and returns the page text content.
 */
export async function navigateTo(
  sessionId: string,
  url: string
): Promise<{ url: string; title: string; textContent: string }> {
  await emitStep(sessionId, "navigate", `Navegando a ${url}`, "running");

  try {
    return await withSessionPage(sessionId, async (page) => {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(1000);

      await captureAndEmitFrame(sessionId, page);

      const title = await page.title();
      const textContent = await page.evaluate(() => {
        return document.body.innerText.substring(0, 8000);
      });

      await emitStep(sessionId, "navigate", `Navegó a ${url}`, "done");
      return { url: page.url(), title, textContent };
    });
  } catch (err: any) {
    await emitStep(sessionId, "navigate", `Error navegando a ${url}: ${err.message}`, "error");
    throw err;
  }
}

/**
 * Performs click coordinate interaction on-demand.
 * Relies on Playwright mouse API to click coordinates on screenshot viewport.
 */
export async function clickCoordinate(
  sessionId: string,
  x: number,
  y: number
): Promise<{ success: boolean; message: string; url?: string }> {
  const desc = `Haciendo clic en la coordenada (${x}, ${y})`;
  await emitStep(sessionId, "click", desc, "running");

  try {
    return await withSessionPage(sessionId, async (page) => {
      await page.mouse.click(x, y, { delay: 100 });
      await page.waitForTimeout(600);
      await captureAndEmitFrame(sessionId, page);
      await emitStep(sessionId, "click", desc, "done");
      return { success: true, message: `Clicked at (${x}, ${y})`, url: page.url() };
    });
  } catch (err: any) {
    await emitStep(sessionId, "click", `Error: ${err.message}`, "error");
    return { success: false, message: err.message };
  }
}

/**
 * Clicks on an element matching a CSS selector.
 */
export async function clickElement(
  sessionId: string,
  selector: string,
  description?: string
): Promise<{ success: boolean; message: string }> {
  const desc = description || `Haciendo clic en "${selector}"`;
  await emitStep(sessionId, "click", desc, "running");

  try {
    return await withSessionPage(sessionId, async (page) => {
      await page.click(selector, { timeout: 5000 });
      await page.waitForTimeout(800);
      await captureAndEmitFrame(sessionId, page);
      await emitStep(sessionId, "click", desc, "done");
      return { success: true, message: `Clicked on ${selector}` };
    });
  } catch (err: any) {
    await emitStep(sessionId, "click", `Error: ${err.message}`, "error");
    return { success: false, message: err.message };
  }
}

/**
 * Types text into an input element.
 */
export async function typeText(
  sessionId: string,
  selector: string,
  text: string,
  description?: string
): Promise<{ success: boolean; message: string }> {
  const desc = description || `Escribiendo "${text.slice(0, 30)}..." en "${selector}"`;
  await emitStep(sessionId, "type", desc, "running");

  try {
    return await withSessionPage(sessionId, async (page) => {
      await page.fill(selector, text, { timeout: 5000 });
      await page.waitForTimeout(500);
      await captureAndEmitFrame(sessionId, page);
      await emitStep(sessionId, "type", desc, "done");
      return { success: true, message: `Typed into ${selector}` };
    });
  } catch (err: any) {
    await emitStep(sessionId, "type", `Error: ${err.message}`, "error");
    return { success: false, message: err.message };
  }
}

/**
 * Scrolls the page in a direction.
 */
export async function scrollPage(
  sessionId: string,
  direction: "down" | "up" = "down",
  amount: number = 400
): Promise<{ success: boolean }> {
  await emitStep(sessionId, "scroll", `Desplazando la página hacia ${direction === "down" ? "abajo" : "arriba"}`, "running");

  try {
    return await withSessionPage(sessionId, async (page) => {
      const delta = direction === "down" ? amount : -amount;
      await page.evaluate((d: number) => window.scrollBy(0, d), delta);
      await page.waitForTimeout(500);
      await captureAndEmitFrame(sessionId, page);
      await emitStep(sessionId, "scroll", `Página desplazada`, "done");
      return { success: true };
    });
  } catch (err: any) {
    await emitStep(sessionId, "scroll", `Error: ${err.message}`, "error");
    throw err;
  }
}

/**
 * Takes a screenshot and returns a base64-encoded JPEG.
 */
export async function takeScreenshot(
  sessionId: string
): Promise<string> {
  return await withSessionPage(sessionId, async (page) => {
    const buffer = await page.screenshot({
      type: "jpeg",
      quality: 75,
      fullPage: false,
    });
    const base64 = buffer.toString("base64");
    if (redis) {
      await redis.set(`browser:frame:${sessionId}`, base64, { ex: 300 });
    }
    return base64;
  });
}

/**
 * Registers a callback for receiving live frames via SSE (dev mode only).
 */
export function onFrame(
  sessionId: string,
  callback: (frame: string) => void
): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.frameCallback = callback;
}

/**
 * Registers a callback for receiving step updates via SSE (dev mode only).
 */
export function onStep(
  sessionId: string,
  callback: (step: { action: string; description: string; status: string }) => void
): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.stepCallback = callback;
}

/**
 * Destroys a browser session and releases all resources.
 */
export async function destroySession(sessionId: string): Promise<void> {
  if (redis) {
    const sessionRaw = await redis.get(`browser:session:${sessionId}`);
    if (sessionRaw) {
      const sessionData = typeof sessionRaw === "string" ? JSON.parse(sessionRaw) : sessionRaw;
      const stopUrl = sessionData.stopUrl;
      try {
        await fetch(stopUrl, { method: "DELETE" }).catch(() => {});
      } catch {}
      await redis.del(`browser:session:${sessionId}`);
      await redis.del(`browser:frame:${sessionId}`);
      await redis.del(`browser:steps:${sessionId}`);
      console.log(`[BrowserManager] Released persistent Browserless session: ${sessionId}`);
    }
  }

  const session = sessions.get(sessionId);
  if (!session) return;

  try {
    await session.context.close();
    await session.browser.close();
  } catch {}

  sessions.delete(sessionId);
}

/**
 * Checks whether a session exists.
 */
export async function hasSession(sessionId: string): Promise<boolean> {
  if (redis) {
    const exists = await redis.exists(`browser:session:${sessionId}`);
    return exists > 0;
  }
  return sessions.has(sessionId);
}

/**
 * Manually triggers a screen capture and emits it to listeners.
 */
export async function refreshSessionFrame(sessionId: string): Promise<void> {
  await withSessionPage(sessionId, async (page) => {
    await captureAndEmitFrame(sessionId, page);
  });
}

// ─── Internal Helpers ───

async function captureAndEmitFrame(sessionId: string, page: any) {
  try {
    const buffer = await page.screenshot({
      type: "jpeg",
      quality: 60,
      fullPage: false,
    });
    const base64 = buffer.toString("base64");

    if (redis) {
      await redis.set(`browser:frame:${sessionId}`, base64, { ex: 300 });
    }

    const session = sessions.get(sessionId);
    if (session && session.frameCallback) {
      session.frameCallback(base64);
    }
  } catch {}
}

async function emitStep(
  sessionId: string,
  action: string,
  description: string,
  status: "running" | "done" | "error"
) {
  const step = { action, description, status };
  
  if (redis) {
    const stepsRaw = await redis.get(`browser:steps:${sessionId}`);
    const stepsList = stepsRaw ? (typeof stepsRaw === "string" ? JSON.parse(stepsRaw) : stepsRaw) : [];
    stepsList.push({ ...step, timestamp: Date.now() });
    await redis.set(`browser:steps:${sessionId}`, JSON.stringify(stepsList), { ex: 300 });
  }

  const session = sessions.get(sessionId);
  if (session && session.stepCallback) {
    session.stepCallback(step);
  }
}

