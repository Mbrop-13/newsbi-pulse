/**
 * Live market quotes for portfolio + AI tools.
 * Never invent prices: callers must treat a missing quote as unavailable.
 */
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

const MODULE_OPTS = { validateResult: false } as const;
const FETCH_TIMEOUT_MS = 8_000;
const YAHOO_UA = "Mozilla/5.0 (compatible; Maverlang/1.0; +https://www.maverlang.com)";

export interface LiveQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number | null;
  currency: string;
  marketState: string | null;
  asOf: string;
  source: "yahoo-quote" | "yahoo-chart";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && "raw" in value) {
    const raw = (value as { raw?: unknown }).raw;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  }
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function toIso(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

/** Strip exchange prefixes and map class shares (BRK.B → BRK-B). */
export function toYahooSymbol(raw: string): string | null {
  if (typeof raw !== "string") return null;
  let s = raw.trim().toUpperCase();
  s = s.replace(/^(NASDAQ|NYSE|AMEX|BATS|NYSEARCA|OTC|BMV|BCS|BCBA|B3):/, "");
  s = s.replace(/^([A-Z]{1,5})\.([A-Z])$/, "$1-$2");
  if (!s || s.length > 20) return null;
  if (!/^[A-Z0-9.^|=-]{1,20}$/.test(s)) return null;
  return s;
}

export function quoteKey(symbol: string): string {
  return toYahooSymbol(symbol) || symbol.trim().toUpperCase();
}

function pickPrice(q: Record<string, unknown>): number | null {
  const candidates = [
    q.regularMarketPrice,
    q.postMarketPrice,
    q.preMarketPrice,
    q.regularMarketPreviousClose,
  ];
  for (const c of candidates) {
    const n = asNumber(c);
    if (n != null && n > 0) return n;
  }
  return null;
}

function fromYfQuote(q: any): LiveQuote | null {
  if (!q || typeof q !== "object") return null;
  const symbol = typeof q.symbol === "string" ? q.symbol : null;
  const price = pickPrice(q);
  if (!symbol || price == null) return null;

  const prev =
    asNumber(q.regularMarketPreviousClose) ??
    asNumber(q.postMarketPrice) ??
    null;
  const change =
    asNumber(q.regularMarketChange) ??
    (prev != null ? price - prev : 0);
  const changePercent =
    asNumber(q.regularMarketChangePercent) ??
    (prev && prev > 0 ? ((price - prev) / prev) * 100 : 0);

  return {
    symbol,
    price,
    change: change ?? 0,
    changePercent: changePercent ?? 0,
    previousClose: prev,
    currency: typeof q.currency === "string" ? q.currency : "USD",
    marketState: typeof q.marketState === "string" ? q.marketState : null,
    asOf: toIso(q.regularMarketTime),
    source: "yahoo-quote",
  };
}

async function fetchChartQuote(symbol: string): Promise<LiveQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?interval=1d&range=5d`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": YAHOO_UA, Accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price =
      asNumber(meta.regularMarketPrice) ?? asNumber(meta.previousClose);
    if (price == null || price <= 0) return null;

    const prev =
      asNumber(meta.chartPreviousClose) ?? asNumber(meta.previousClose);
    const change = prev != null ? price - prev : asNumber(meta.regularMarketChange) ?? 0;
    const changePercent =
      prev && prev > 0
        ? ((price - prev) / prev) * 100
        : asNumber(meta.regularMarketChangePercent) ?? 0;

    return {
      symbol: typeof meta.symbol === "string" ? meta.symbol : symbol,
      price,
      change,
      changePercent,
      previousClose: prev,
      currency: typeof meta.currency === "string" ? meta.currency : "USD",
      marketState: typeof meta.currentTradingPeriod === "object" ? "REGULAR" : null,
      asOf: toIso(meta.regularMarketTime),
      source: "yahoo-chart",
    };
  } catch {
    return null;
  }
}

async function fetchYfQuote(symbol: string): Promise<LiveQuote | null> {
  try {
    const q = await yf.quote(symbol, {}, MODULE_OPTS);
    return fromYfQuote(q);
  } catch {
    return null;
  }
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  const n = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

/**
 * Fetch live quotes for a list of tickers.
 * Batch Yahoo first, then per-symbol + chart fallback for misses.
 */
export async function getLiveQuotes(rawSymbols: string[]): Promise<Map<string, LiveQuote>> {
  const wanted = [...new Set(rawSymbols.map(toYahooSymbol).filter((s): s is string => !!s))];
  const byKey = new Map<string, LiveQuote>();

  if (wanted.length === 0) return byKey;

  try {
    const quotes = await yf.quote(wanted, {}, MODULE_OPTS);
    const list = Array.isArray(quotes) ? quotes : quotes ? [quotes] : [];
    for (const q of list) {
      const live = fromYfQuote(q);
      if (!live) continue;
      byKey.set(quoteKey(live.symbol), live);
    }
  } catch (error) {
    console.error("[market-quotes] batch quote failed:", error);
  }

  const missing = wanted.filter((s) => !byKey.has(quoteKey(s)));
  if (missing.length > 0) {
    await mapPool(missing, 5, async (symbol) => {
      const live = (await fetchYfQuote(symbol)) || (await fetchChartQuote(symbol));
      if (live) byKey.set(quoteKey(symbol), live);
      return live;
    });
  }

  return byKey;
}

export function findQuote(
  quotes: Map<string, LiveQuote>,
  rawSymbol: string
): LiveQuote | undefined {
  const key = quoteKey(rawSymbol);
  if (quotes.has(key)) return quotes.get(key);
  const yahoo = toYahooSymbol(rawSymbol);
  if (yahoo && quotes.has(yahoo)) return quotes.get(yahoo);
  for (const [k, v] of quotes) {
    if (k === key || v.symbol.toUpperCase() === key) return v;
  }
  return undefined;
}
