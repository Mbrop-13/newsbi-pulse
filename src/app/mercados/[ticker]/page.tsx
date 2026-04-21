import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Newspaper } from "lucide-react";
import { SymbolOverview } from "@/components/tradingview/symbol-overview";
import { SymbolProfile } from "@/components/tradingview/symbol-profile";
import { Financials } from "@/components/tradingview/financials";
import { createClient } from "@/lib/supabase/server";
import { NewsCard } from "@/components/news-card";
import { AssetTabs } from "./asset-tabs";

interface Props {
  params: Promise<{ ticker: string }>;
}

/* ── Display Name Map ── */
const TICKER_MAP: Record<string, { name: string; description: string }> = {
  "BCS:SP_IPSA": { name: "IPSA", description: "Índice de Precio Selectivo de Acciones — Chile" },
  "BCS:IPSA": { name: "IPSA", description: "Índice de Precio Selectivo de Acciones — Chile" },
  "NYSE:SQM": { name: "SQM", description: "Sociedad Química y Minera de Chile" },
  "BCS:SQMB": { name: "SQM-B", description: "Sociedad Química y Minera de Chile" },
  "CAPITALCOM:COPPER": { name: "Cobre", description: "Cobre — Commodity clave para Chile" },
  "OANDA:XAUUSD": { name: "Oro", description: "Oro — Refugio seguro global" },
  "BCS:FALABELLA": { name: "Falabella", description: "SACI Falabella — Retail" },
  "BCS:COPEC": { name: "Copec", description: "Empresas Copec S.A." },
  "BCS:CENCOSUD": { name: "Cencosud", description: "Cencosud S.A. — Retail" },
  "BCS:ENELCHILE": { name: "Enel Chile", description: "Enel Chile S.A. — Energía" },
  "BCS:BSANTANDER": { name: "Santander Chile", description: "Banco Santander Chile" },
  "FOREXCOM:SPXUSD": { name: "S&P 500", description: "Índice de las 500 mayores empresas de EE.UU." },
  "FOREXCOM:NSXUSD": { name: "Nasdaq 100", description: "Líderes tecnológicos mundiales" },
  "FOREXCOM:DJI": { name: "Dow Jones", description: "30 principales blue chips de EE.UU." },
  "BITSTAMP:BTCUSD": { name: "Bitcoin", description: "Criptomoneda líder a nivel global" },
  "BITSTAMP:ETHUSD": { name: "Ethereum", description: "Plataforma de contratos inteligentes" },
  "FX:EURUSD": { name: "EUR/USD", description: "Euro vs Dólar estadounidense" },
  "FX:USDCLP": { name: "USD/CLP", description: "Dólar vs Peso chileno" },
  "COMEX:GC1!": { name: "Oro", description: "Futuros de Oro — Refugio seguro" },
  "COMEX:HG1!": { name: "Cobre", description: "Futuros de Cobre — Commodity clave para Chile" },
  "NYMEX:CL1!": { name: "Petróleo WTI", description: "Futuros de Crudo West Texas Intermediate" },
  "TVC:DAX": { name: "DAX", description: "Índice principal de la Bolsa de Frankfurt" },
  "TVC:NI225": { name: "Nikkei 225", description: "Índice principal de la Bolsa de Tokio" },
  "BINANCE:SOLUSDT": { name: "Solana", description: "Blockchain de alto rendimiento" },
  "FX:GBPUSD": { name: "GBP/USD", description: "Libra esterlina vs Dólar" },
  "FX:USDJPY": { name: "USD/JPY", description: "Dólar vs Yen japonés" },
  SPX: { name: "S&P 500", description: "Índice de las 500 mayores empresas de EE.UU." },
  NDX: { name: "Nasdaq 100", description: "Líderes tecnológicos mundiales" },
  IPSA: { name: "IPSA", description: "Índice de Precio Selectivo de Acciones — Chile" },
  BTCUSD: { name: "Bitcoin", description: "Criptomoneda líder a nivel global" },
  "HG1!": { name: "Cobre", description: "Futuros de Cobre — Commodity clave para Chile" },
};

function getTickerInfo(ticker: string) {
  const decoded = decodeURIComponent(ticker);
  const info = TICKER_MAP[decoded] || TICKER_MAP[decoded.toUpperCase()];
  return {
    symbol: decoded,
    name: info?.name || decoded.split(":").pop() || decoded,
    description: info?.description || "",
  };
}

export async function generateMetadata({ params }: Props) {
  const { ticker } = await params;
  const info = getTickerInfo(ticker);
  return { title: `${info.name} | Mercados | Reclu`, description: info.description };
}

export default async function TickerPage({ params }: Props) {
  const { ticker } = await params;
  const info = getTickerInfo(ticker);

  return (
    <div className="min-h-screen bg-transparent pt-20 pb-16">
      <div className="w-full mx-auto px-4 sm:px-6 xl:px-8">

        {/* ── BREADCRUMB ── */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5 font-medium">
          <Link href="/mercados" className="hover:text-[#1890FF] transition-colors">Mercados</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 dark:text-white font-bold">{info.name}</span>
        </nav>

        {/* ── HEADER ── */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{info.name}</h1>
          <span className="px-2.5 py-1 bg-[#1890FF]/10 rounded-lg text-xs font-mono font-bold text-[#1890FF]">{info.symbol}</span>
        </div>
        {info.description && (
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-8 -mt-2">{info.description}</p>
        )}

        {/* ──────────────────────────────────────────────────── */}
        {/* MAIN OVERVIEW CHART (Full Width, Transparent)        */}
        {/* ──────────────────────────────────────────────────── */}
        <div className="w-full h-[500px] mb-16">
           <SymbolOverview symbol={info.symbol} />
        </div>

        {/* ──────────────────────────────────────────────────── */}
        {/* TABS: INFORMACIÓN vs NOTICIAS                        */}
        {/* ──────────────────────────────────────────────────── */}
        <AssetTabs 
          informacion={
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SymbolProfile symbol={info.symbol} />
              <Financials symbol={info.symbol} />
            </div>
          }
          noticias={
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Suspense fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1,2,3,4].map(i => <div key={i} className="h-[300px] rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
                </div>
              }>
                <RelatedNewsGrid searchTerms={[info.name, info.symbol.split(":").pop() || ""]} />
              </Suspense>
            </div>
          }
        />

      </div>
    </div>
  );
}

/* ── Side Panel News (compact, vertical list) ── */
async function NewsSidePanel({ searchTerms }: { searchTerms: string[] }) {
  const supabase = await createClient();
  const filters = searchTerms.filter(t => t.length > 1).flatMap(t => [`title.ilike.%${t}%`, `summary.ilike.%${t}%`]).join(",");

  const { data: articles } = await supabase.from("news_articles").select("*").or(filters).order("published_at", { ascending: false }).limit(8);

  if (!articles || articles.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-gray-500">Sin noticias específicas para este activo.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50 dark:divide-white/5">
      {articles.map((article: any) => (
        <Link
          key={article.id}
          href={`/article/${article.slug || article.id}`}
          className="flex gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
        >
          {article.image_url && (
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-white/5">
              <img src={article.image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-[#1890FF] transition-colors leading-snug">
              {article.title}
            </p>
            <span className="text-[10px] text-gray-400 mt-1.5 block">
              {(() => {
                try {
                  const d = new Date(article.published_at);
                  const diff = Date.now() - d.getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 60) return `hace ${mins}m`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `hace ${hrs}h`;
                  return `hace ${Math.floor(hrs / 24)}d`;
                } catch { return ""; }
              })()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ── Full Width News Grid ── */
async function RelatedNewsGrid({ searchTerms }: { searchTerms: string[] }) {
  const supabase = await createClient();
  const filters = searchTerms.filter(t => t.length > 1).flatMap(t => [`title.ilike.%${t}%`, `summary.ilike.%${t}%`]).join(",");

  const { data: articles } = await supabase.from("news_articles").select("*").or(filters).order("published_at", { ascending: false }).limit(12);

  if (!articles || articles.length === 0) {
    return (
      <div className="py-16 text-center w-full bg-white dark:bg-white/[0.02] rounded-3xl border border-gray-200/50 dark:border-white/5">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Sin noticias adicionales</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm">
          Las noticias aparecerán aquí automáticamente cuando se publiquen artículos relacionados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {articles.map((article: any, i: number) => (
        <NewsCard key={article.id} article={article} index={i} />
      ))}
    </div>
  );
}
