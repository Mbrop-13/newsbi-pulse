// Utility to detect stock tickers / indices from article text
// Maps common company names and Spanish terms to TradingView symbols

const TICKER_MAP: Record<string, { symbol: string; name: string }> = {
  // US Stocks
  "apple": { symbol: "NASDAQ:AAPL", name: "Apple" },
  "aapl": { symbol: "NASDAQ:AAPL", name: "Apple" },
  "microsoft": { symbol: "NASDAQ:MSFT", name: "Microsoft" },
  "msft": { symbol: "NASDAQ:MSFT", name: "Microsoft" },
  "google": { symbol: "NASDAQ:GOOGL", name: "Google" },
  "alphabet": { symbol: "NASDAQ:GOOGL", name: "Alphabet" },
  "googl": { symbol: "NASDAQ:GOOGL", name: "Alphabet" },
  "amazon": { symbol: "NASDAQ:AMZN", name: "Amazon" },
  "amzn": { symbol: "NASDAQ:AMZN", name: "Amazon" },
  "meta": { symbol: "NASDAQ:META", name: "Meta" },
  "facebook": { symbol: "NASDAQ:META", name: "Meta" },
  "tesla": { symbol: "NASDAQ:TSLA", name: "Tesla" },
  "tsla": { symbol: "NASDAQ:TSLA", name: "Tesla" },
  "nvidia": { symbol: "NASDAQ:NVDA", name: "NVIDIA" },
  "nvda": { symbol: "NASDAQ:NVDA", name: "NVIDIA" },
  "amd": { symbol: "NASDAQ:AMD", name: "AMD" },
  "netflix": { symbol: "NASDAQ:NFLX", name: "Netflix" },
  "nflx": { symbol: "NASDAQ:NFLX", name: "Netflix" },
  "spotify": { symbol: "NYSE:SPOT", name: "Spotify" },
  "uber": { symbol: "NYSE:UBER", name: "Uber" },
  "airbnb": { symbol: "NASDAQ:ABNB", name: "Airbnb" },
  "twitter": { symbol: "NYSE:TWTR", name: "Twitter" },
  "x corp": { symbol: "NYSE:TWTR", name: "X Corp" },
  "disney": { symbol: "NYSE:DIS", name: "Disney" },
  "coca-cola": { symbol: "NYSE:KO", name: "Coca-Cola" },
  "coca cola": { symbol: "NYSE:KO", name: "Coca-Cola" },
  "pepsi": { symbol: "NASDAQ:PEP", name: "PepsiCo" },
  "pepsico": { symbol: "NASDAQ:PEP", name: "PepsiCo" },
  "walmart": { symbol: "NYSE:WMT", name: "Walmart" },
  "boeing": { symbol: "NYSE:BA", name: "Boeing" },
  "jpmorgan": { symbol: "NYSE:JPM", name: "JPMorgan" },
  "jp morgan": { symbol: "NYSE:JPM", name: "JPMorgan" },
  "goldman sachs": { symbol: "NYSE:GS", name: "Goldman Sachs" },
  "bank of america": { symbol: "NYSE:BAC", name: "Bank of America" },
  "visa": { symbol: "NYSE:V", name: "Visa" },
  "mastercard": { symbol: "NYSE:MA", name: "Mastercard" },
  "paypal": { symbol: "NASDAQ:PYPL", name: "PayPal" },
  "coinbase": { symbol: "NASDAQ:COIN", name: "Coinbase" },
  "palantir": { symbol: "NYSE:PLTR", name: "Palantir" },
  "openai": { symbol: "NASDAQ:MSFT", name: "Microsoft (OpenAI)" },

  // Indices
  "s&p 500": { symbol: "FOREXCOM:SPXUSD", name: "S&P 500" },
  "s&p500": { symbol: "FOREXCOM:SPXUSD", name: "S&P 500" },
  "sp500": { symbol: "FOREXCOM:SPXUSD", name: "S&P 500" },
  "nasdaq": { symbol: "NASDAQ:NDX", name: "NASDAQ 100" },
  "dow jones": { symbol: "DJ:DJI", name: "Dow Jones" },
  "wall street": { symbol: "FOREXCOM:SPXUSD", name: "S&P 500" },
  "nikkei": { symbol: "TVC:NI225", name: "Nikkei 225" },
  "dax": { symbol: "XETR:DAX", name: "DAX" },
  "ftse": { symbol: "FTSE:UKX", name: "FTSE 100" },
  "ibex": { symbol: "BME:IBC", name: "IBEX 35" },

  // Crypto
  "bitcoin": { symbol: "BINANCE:BTCUSDT", name: "Bitcoin" },
  "btc": { symbol: "BINANCE:BTCUSDT", name: "Bitcoin" },
  "ethereum": { symbol: "BINANCE:ETHUSDT", name: "Ethereum" },
  "eth": { symbol: "BINANCE:ETHUSDT", name: "Ethereum" },
  "solana": { symbol: "BINANCE:SOLUSDT", name: "Solana" },
  "sol": { symbol: "BINANCE:SOLUSDT", name: "Solana" },
  "cardano": { symbol: "BINANCE:ADAUSDT", name: "Cardano" },
  "ripple": { symbol: "BINANCE:XRPUSDT", name: "Ripple (XRP)" },
  "xrp": { symbol: "BINANCE:XRPUSDT", name: "Ripple (XRP)" },
  "dogecoin": { symbol: "BINANCE:DOGEUSDT", name: "Dogecoin" },
  "doge": { symbol: "BINANCE:DOGEUSDT", name: "Dogecoin" },

  // Currency pairs
  "dólar": { symbol: "FX_IDC:USDCLP", name: "USD/CLP" },
  "dolar": { symbol: "FX_IDC:USDCLP", name: "USD/CLP" },
  "tipo de cambio": { symbol: "FX_IDC:USDCLP", name: "USD/CLP" },
  "euro": { symbol: "FX:EURUSD", name: "EUR/USD" },
  "yen": { symbol: "FX:USDJPY", name: "USD/JPY" },
  "libra esterlina": { symbol: "FX:GBPUSD", name: "GBP/USD" },

  // Commodities
  "oro": { symbol: "TVC:GOLD", name: "Oro (XAU/USD)" },
  "gold": { symbol: "TVC:GOLD", name: "Oro (XAU/USD)" },
  "petróleo": { symbol: "TVC:USOIL", name: "Petróleo WTI" },
  "petroleo": { symbol: "TVC:USOIL", name: "Petróleo WTI" },
  "oil": { symbol: "TVC:USOIL", name: "Petróleo WTI" },
  "cobre": { symbol: "TVC:COPPER", name: "Cobre" },
  "copper": { symbol: "TVC:COPPER", name: "Cobre" },
  "litio": { symbol: "NASDAQ:ALB", name: "Albemarle (Litio)" },
  "plata": { symbol: "TVC:SILVER", name: "Plata (XAG/USD)" },
  "silver": { symbol: "TVC:SILVER", name: "Plata (XAG/USD)" },

  // LatAm stocks
  "mercado libre": { symbol: "NASDAQ:MELI", name: "Mercado Libre" },
  "mercadolibre": { symbol: "NASDAQ:MELI", name: "Mercado Libre" },
  "nubank": { symbol: "NYSE:NU", name: "Nubank" },
  "falabella": { symbol: "BCS:FALABELLA", name: "Falabella" },
  "copec": { symbol: "BCS:COPEC", name: "Copec" },
  "sqm": { symbol: "NYSE:SQM", name: "SQM" },
  "latam airlines": { symbol: "BCS:LTM", name: "LATAM Airlines" },
  "latam": { symbol: "BCS:LTM", name: "LATAM Airlines" },
  "banco de chile": { symbol: "BCS:CHILE", name: "Banco de Chile" },
  "enel chile": { symbol: "BCS:ENELCHILE", name: "Enel Chile" },
  "ipsa": { symbol: "BCS:IPSA", name: "IPSA" },
};

// Words that are too generic - only match these in financial context
const CONTEXT_REQUIRED = new Set([
  "meta", "uber", "visa", "sol", "euro", "latam", "dólar", "dolar",
]);

const FINANCIAL_CONTEXT = [
  "acción", "acciones", "accion", "bolsa", "cotización", "cotizacion",
  "mercado", "inversionista", "inversión", "inversion", "índice", "indice",
  "financier", "bursátil", "bursatil", "Wall Street", "trading",
  "precio", "valorización", "valoracion", "capitalización", "rendimiento",
  "dividendo", "ganancias", "pérdidas", "bajist", "alcist",
  "IPO", "OPA", "fusión", "adquisición",
];

export function detectTicker(text: string): { symbol: string; name: string } | null {
  if (!text) return null;

  const lower = text.toLowerCase();
  const hasFinancialContext = FINANCIAL_CONTEXT.some((w) => lower.includes(w.toLowerCase()));

  // Sort by key length descending so multi-word matches come first
  const sortedKeys = Object.keys(TICKER_MAP).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    // Skip context-required words unless financial context is present
    if (CONTEXT_REQUIRED.has(key) && !hasFinancialContext) continue;

    // Use word boundary to avoid false positives
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(text)) {
      return TICKER_MAP[key];
    }
  }

  return null;
}
