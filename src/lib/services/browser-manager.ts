/**
 * Browser Manager Service
 * Manages headless Chromium instances via Playwright for the AI agent's
 * virtual browsing capabilities. Provides navigation, interaction, and
 * screencasting (live frame capture) APIs.
 *
 * NOTE: This module requires `playwright-core` to be installed.
 * The Chromium binary will be downloaded automatically on first use via
 * `npx playwright install chromium`.
 */

// The actual playwright import is lazy-loaded to avoid build errors
// when playwright-core is not installed yet.
let chromium: any = null;

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

const sessions = new Map<string, BrowserSession>();

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

/**
 * Creates a new browser session and returns the session ID.
 */
export async function createSession(): Promise<string> {
  // Enforce max sessions
  if (sessions.size >= MAX_SESSIONS) {
    // Kill the oldest session
    const oldest = [...sessions.entries()].sort(
      (a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime()
    )[0];
    if (oldest) {
      await destroySession(oldest[0]);
    }
  }

  const ch = await getChromium();
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
  const sessionId = `browser-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  emitStep(session, "navigate", `Navegando a ${url}`, "running");

  try {
    await session.page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await session.page.waitForTimeout(1000);

    // Capture frame after navigation
    await captureAndEmitFrame(session);

    const title = await session.page.title();
    const textContent = await session.page.evaluate(() => {
      return document.body.innerText.substring(0, 8000);
    });

    emitStep(session, "navigate", `Navegó a ${url}`, "done");

    return { url: session.page.url(), title, textContent };
  } catch (err: any) {
    emitStep(session, "navigate", `Error navegando a ${url}: ${err.message}`, "error");
    throw err;
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
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const desc = description || `Haciendo clic en "${selector}"`;
  emitStep(session, "click", desc, "running");

  try {
    await session.page.click(selector, { timeout: 5000 });
    await session.page.waitForTimeout(800);
    await captureAndEmitFrame(session);
    emitStep(session, "click", desc, "done");
    return { success: true, message: `Clicked on ${selector}` };
  } catch (err: any) {
    emitStep(session, "click", `Error: ${err.message}`, "error");
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
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const desc = description || `Escribiendo "${text.slice(0, 30)}..." en "${selector}"`;
  emitStep(session, "type", desc, "running");

  try {
    await session.page.fill(selector, text, { timeout: 5000 });
    await session.page.waitForTimeout(500);
    await captureAndEmitFrame(session);
    emitStep(session, "type", desc, "done");
    return { success: true, message: `Typed into ${selector}` };
  } catch (err: any) {
    emitStep(session, "type", `Error: ${err.message}`, "error");
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
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  emitStep(session, "scroll", `Desplazando la página hacia ${direction === "down" ? "abajo" : "arriba"}`, "running");

  const delta = direction === "down" ? amount : -amount;
  await session.page.evaluate((d: number) => window.scrollBy(0, d), delta);
  await session.page.waitForTimeout(500);
  await captureAndEmitFrame(session);

  emitStep(session, "scroll", `Página desplazada`, "done");
  return { success: true };
}

/**
 * Takes a screenshot and returns a base64-encoded JPEG.
 */
export async function takeScreenshot(
  sessionId: string
): Promise<string> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const buffer = await session.page.screenshot({
    type: "jpeg",
    quality: 75,
    fullPage: false,
  });

  const base64 = buffer.toString("base64");

  // Emit frame to SSE listeners
  if (session.frameCallback) {
    session.frameCallback(base64);
  }

  return base64;
}

/**
 * Registers a callback for receiving live frames via SSE.
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
 * Registers a callback for receiving step updates via SSE.
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
export function hasSession(sessionId: string): boolean {
  return sessions.has(sessionId);
}

// ─── Internal Helpers ───

async function captureAndEmitFrame(session: BrowserSession) {
  try {
    const buffer = await session.page.screenshot({
      type: "jpeg",
      quality: 60,
      fullPage: false,
    });
    const base64 = buffer.toString("base64");

    if (session.frameCallback) {
      session.frameCallback(base64);
    }
  } catch {}
}

function emitStep(
  session: BrowserSession,
  action: string,
  description: string,
  status: string
) {
  if (session.stepCallback) {
    session.stepCallback({ action, description, status });
  }
}
