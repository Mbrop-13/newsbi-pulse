/**
 * Maverlang AI Agent Tools
 * 
 * Functions the AI agent can invoke to fetch real-time data from
 * the user's portfolio, stock prices, news articles, and alerts.
 */

import { createClient } from "@supabase/supabase-js";
import YahooFinance from "yahoo-finance2";

// yahoo-finance2 v3+ requires instantiation before use
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Logo helpers (same as portfolio page)
function getLogoUrl(symbol: string): string {
  return `https://assets.parqet.com/logos/symbol/${symbol}`;
}
function getFallbackLogo(symbol: string): string {
  return `https://ui-avatars.com/api/?name=${symbol}&background=1890FF&color=fff&bold=true&size=96`;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Types ──────────────────────────────────────────

export interface ToolResult {
  tool: "portfolio" | "stock_info" | "news" | "alerts";
  data: any;
  summary: string;
}

export interface PortfolioStock {
  symbol: string;
  company_name: string;
  shares: number;
  average_price: number;
  price: number;
  change: number;
  changePercent: number;
  positionValue: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  url: string;
  image_url: string;
  published_at: string;
  slug: string;
}

export interface AlertItem {
  id: string;
  symbol: string;
  target_price: number;
  condition: "above" | "below";
  is_active: boolean;
}

// ── Tool: Portfolio Data ───────────────────────────

export async function getPortfolioData(userId: string): Promise<ToolResult> {
  // 1. Get user's portfolio from Supabase
  const { data: dbAssets } = await supabase
    .from("portfolios")
    .select("*")
    .eq("user_id", userId);

  if (!dbAssets || dbAssets.length === 0) {
    return {
      tool: "portfolio",
      data: [],
      summary: "El usuario no tiene activos en su portafolio",
    };
  }

  // 2. Fetch live prices from Yahoo Finance
  let liveData: any[] = [];
  try {
    const symbolArray = dbAssets.map((a: any) => a.symbol.trim().toUpperCase());
    const quotes = await yf.quote(symbolArray);
    const quoteArray = Array.isArray(quotes) ? quotes : [quotes];
    
    liveData = quoteArray.map((q: any) => ({
      symbol: q.symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePercent: q.regularMarketChangePercent,
    }));
  } catch (error) {
    console.error("[agent-tools] Yahoo Finance Portfolio Error:", error);
    // If Yahoo Finance fails, return DB data only
  }

  // 3. Enrich with live data
  const stocks: PortfolioStock[] = dbAssets.map((dbA: any) => {
    const live = liveData.find((l: any) => l.symbol === dbA.symbol) || {};
    const price = live.price || 0;
    const shares = dbA.shares || 0;
    return {
      symbol: dbA.symbol,
      company_name: dbA.company_name || dbA.symbol,
      shares,
      average_price: dbA.average_price || 0,
      price,
      change: live.change || 0,
      changePercent: live.changePercent || 0,
      positionValue: price * shares,
      logo: getLogoUrl(dbA.symbol),
      fallbackLogo: getFallbackLogo(dbA.symbol)
    };
  });

  const totalValue = stocks.reduce((sum, s) => sum + s.positionValue, 0);
  const avgChange = stocks.length > 0
    ? stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length
    : 0;

  return {
    tool: "portfolio",
    data: stocks,
    summary: `${stocks.length} activos · Valor total: $${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })} · Cambio promedio: ${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`,
  };
}

// ── Tool: Stock Info ───────────────────────────────

export async function getStockInfo(symbol: string): Promise<ToolResult> {
  try {
    const quote = await yf.quote(symbol.toUpperCase());
    if (!quote) throw new Error("Stock not found");
    
    const stock = {
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      logo: getLogoUrl(quote.symbol),
      fallbackLogo: getFallbackLogo(quote.symbol)
    };

    return {
      tool: "stock_info",
      data: stock,
      summary: `${stock.symbol}: $${stock.price?.toFixed(2)} (${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent?.toFixed(2)}%)`,
    };
  } catch {
    return {
      tool: "stock_info",
      data: null,
      summary: `No se pudo obtener información de ${symbol}`,
    };
  }
}

// ── Tool: Top News ─────────────────────────────────

export async function getTopNews(category?: string, limit: number = 8): Promise<ToolResult> {
  let query = supabase
    .from("news_articles")
    .select("id, title, summary, category, original_source, source_url, image_url, published_at, slug, tags")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq("category", category);
  }

  const { data: articles } = await query;

  if (!articles || articles.length === 0) {
    return {
      tool: "news",
      data: [],
      summary: "No se encontraron noticias recientes",
    };
  }

  const newsItems: NewsItem[] = articles.map((a: any) => ({
    id: a.id,
    title: a.title,
    summary: a.summary || "",
    category: a.category || "general",
    source: a.original_source || "",
    url: a.source_url || "",
    image_url: a.image_url || "",
    published_at: a.published_at,
    slug: a.slug || "",
  }));

  return {
    tool: "news",
    data: newsItems,
    summary: `${newsItems.length} noticias encontradas`,
  };
}

// ── Tool: Portfolio News ───────────────────────────

export async function getPortfolioNews(userId: string, limit: number = 10): Promise<ToolResult> {
  // 1. Get user's portfolio symbols
  const { data: dbAssets } = await supabase
    .from("portfolios")
    .select("symbol, company_name")
    .eq("user_id", userId);

  if (!dbAssets || dbAssets.length === 0) {
    return {
      tool: "news",
      data: [],
      summary: "Sin portafolio para buscar noticias",
    };
  }

  // 2. Search news with portfolio symbols as tags
  const symbols = dbAssets.map((a: any) => a.symbol);
  const companyNames = dbAssets.map((a: any) => a.company_name).filter(Boolean);
  
  // Search using tags overlap or title/summary containment
  const { data: articles } = await supabase
    .from("news_articles")
    .select("id, title, summary, category, original_source, source_url, image_url, published_at, slug, tags")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(50);

  if (!articles || articles.length === 0) {
    return {
      tool: "news",
      data: [],
      summary: "No se encontraron noticias de tu portafolio",
    };
  }

  // Filter articles that mention portfolio symbols
  const relevant = articles.filter((a: any) => {
    const text = `${a.title} ${a.summary || ""} ${(a.tags || []).join(" ")}`.toLowerCase();
    return symbols.some((s: string) => text.includes(s.toLowerCase())) ||
           companyNames.some((n: string) => text.includes(n.toLowerCase()));
  }).slice(0, limit);

  const newsItems: NewsItem[] = relevant.map((a: any) => ({
    id: a.id,
    title: a.title,
    summary: a.summary || "",
    category: a.category || "general",
    source: a.original_source || "",
    url: a.source_url || "",
    image_url: a.image_url || "",
    published_at: a.published_at,
    slug: a.slug || "",
  }));

  return {
    tool: "news",
    data: newsItems,
    summary: `${newsItems.length} noticias relacionadas con tu portafolio`,
  };
}

// ── Tool: User Alerts ──────────────────────────────

export async function getUserAlerts(userId: string): Promise<ToolResult> {
  const { data: alerts } = await supabase
    .from("price_alerts")
    .select("id, symbol, target_price, condition, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!alerts || alerts.length === 0) {
    return {
      tool: "alerts",
      data: [],
      summary: "Sin alertas activas",
    };
  }

  return {
    tool: "alerts",
    data: alerts as AlertItem[],
    summary: `${alerts.length} alertas activas`,
  };
}

// ── Tool Call Parser ───────────────────────────────

export interface ParsedToolCall {
  tool: string;
  params: string;
}

export function parseToolCalls(text: string): ParsedToolCall[] {
  const regex = /\[TOOL:(\w+)(?:\s+([^\]]*))?\]/g;
  const calls: ParsedToolCall[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    calls.push({
      tool: match[1],
      params: (match[2] || "").trim(),
    });
  }
  return calls;
}

// ── Execute Tool ───────────────────────────────────

export async function executeTool(
  toolName: string,
  params: string,
  userId: string
): Promise<ToolResult | null> {
  switch (toolName) {
    case "portfolio":
      return getPortfolioData(userId);
    case "stock_info":
      return getStockInfo(params || "AAPL");
    case "news":
      return getTopNews(params || undefined);
    case "portfolio_news":
      return getPortfolioNews(userId);
    case "alerts":
      return getUserAlerts(userId);
    default:
      return null;
  }
}

// ── Build Thinking Steps from Tool Calls ───────────

export function buildThinkingSteps(toolCalls: ParsedToolCall[]): string[] {
  const steps: string[] = [];
  for (const call of toolCalls) {
    switch (call.tool) {
      case "portfolio":
        steps.push("Consultando tu portafolio...");
        steps.push("Obteniendo precios en tiempo real...");
        break;
      case "stock_info":
        steps.push(`Buscando datos de ${call.params.toUpperCase()}...`);
        break;
      case "news":
        steps.push("Buscando noticias relevantes...");
        break;
      case "portfolio_news":
        steps.push("Analizando noticias de tu portafolio...");
        break;
      case "alerts":
        steps.push("Verificando tus alertas de precio...");
        break;
    }
  }
  steps.push("Generando análisis...");
  return steps;
}
