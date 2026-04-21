"use client";

import { useState, useMemo } from "react";
import { NewsCard } from "@/components/news-card";
import { ArrowLeft, Clock, Info, AlertCircle, ChevronDown, Flag } from "lucide-react";
import Link from "next/link";
import { useViewStore } from "@/lib/stores/use-view-store";
import { PredictionChart } from "@/components/prediction-chart";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDiamondStore } from "@/lib/stores/diamond-store";

export function PredictionClientPage({ 
  initialPrediction, 
  initialNews,
  initialMyBets = []
}: { 
  initialPrediction: any; 
  initialNews: any[];
  initialMyBets?: any[];
}) {
  const { layout: viewLayout, density } = useViewStore();
  const user = useAuthStore((s) => s.user);
  const balance = useDiamondStore((s) => s.balance);

  const [poolA, setPoolA] = useState(initialPrediction.pool_a);
  const [poolB, setPoolB] = useState(initialPrediction.pool_b);
  const [betSide, setBetSide] = useState<"a" | "b">("a");
  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");
  const [betAmount, setBetAmount] = useState<number | "">("");
  const [betting, setBetting] = useState(false);
  const [betResult, setBetResult] = useState<any>(null);
  const [myBets, setMyBets] = useState<any[]>(initialMyBets);

  const probA = poolA / (poolA + poolB);
  const probB = poolB / (poolA + poolB);
  const pctA = Math.round(probA * 100);
  const pctB = Math.round(probB * 100);

  const isActive = initialPrediction.status === "active";

  const ownedSharesA = myBets.filter(b => b.side === 'a').reduce((sum, b) => sum + Number(b.shares || 0), 0);
  const ownedSharesB = myBets.filter(b => b.side === 'b').reduce((sum, b) => sum + Number(b.shares || 0), 0);
  const currentSideProb = betSide === 'a' ? probA : probB;
  
  // Maximum shares you can sell (allow decimals up to 2 places)
  const maxSellValue = Number((ownedSharesA > 0 && betSide === 'a' ? ownedSharesA : ownedSharesB > 0 && betSide === 'b' ? ownedSharesB : 0).toFixed(2));

  const handleBet = async () => {
    if (!betSide || !betAmount || betAmount <= 0) return;
    setBetting(true);
    setBetResult(null);
    try {
      const endpoint = tradeMode === "buy" ? "bet" : "sell";
      const payload = tradeMode === "buy" 
        ? { side: betSide, amount: betAmount }
        : { side: betSide, shares: betAmount }; // Send shares for sell!

      const res = await fetch(`/api/predictions/${initialPrediction.id}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setBetResult(data);
        if (tradeMode === "buy") {
          if (betSide === "a") setPoolA((prev: number) => prev + (betAmount as number));
          else setPoolB((prev: number) => prev + (betAmount as number));
          setMyBets([...myBets, data.bet]);
        } else {
          // Selling: subtract calculated amount from pool
          const diamondsReceived = (betAmount as number) * currentSideProb;
          if (betSide === "a") setPoolA((prev: number) => Math.max(0, prev - diamondsReceived));
          else setPoolB((prev: number) => Math.max(0, prev - diamondsReceived));
          // Add a negative bet to reflect burned shares
          setMyBets([...myBets, { side: betSide, amount: -diamondsReceived, shares: -(betAmount as number) }]);
        }
        useDiamondStore.setState({ balance: data.newBalance });
        setBetAmount(""); // Reset input on success!
      } else {
        setBetResult({ error: data.error });
      }
    } catch (err: any) {
      setBetResult({ error: err.message });
    }
    setBetting(false);
  };

  const gapClass = density === 'compact' ? 'gap-3' : density === 'spacious' ? 'gap-8' : 'gap-6';
  const gridClass = viewLayout === 'list' ? 'grid-cols-1 max-w-3xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num}`;
  };

  const volumeStr = formatNumber(initialPrediction.total_volume + (poolA + poolB - initialPrediction.initial_liquidity * 2));

  // Potential Return vs Sell Value
  const safeProb = currentSideProb || 0.0001;
  const numAmount = (betAmount as number) || 0;
  
  // Buy: shares = amount / prob. Each share pays 1💎 on win.
  // Sell: shares × current probability × 0.95 (5% spread fee)
  const SELL_FEE = 0.05;
  const buyShares = Number((numAmount / safeProb).toFixed(2));
  const sellDiamonds = Number((numAmount * currentSideProb * (1 - SELL_FEE)).toFixed(2));
  
  const potentialText = tradeMode === "buy" 
    ? `${buyShares} shares · Si gana → ${buyShares} 💎` 
    : `Recibes ≈${sellDiamonds} 💎 (5% comisión)`;

  return (
    <div className="max-w-[1400px] mx-auto w-full pt-6 pb-24 px-4 sm:px-8 bg-background min-h-screen text-foreground transition-colors overflow-x-hidden">
      <Link href="/predicciones" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" />
        Volver a predicciones
      </Link>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-14">
        {/* Left Column (Main Content) */}
        <div className="flex-1 min-w-0 flex flex-col">
          
          {/* Top Breadcrumbs / Category */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center p-1">
              <Flag className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-muted-foreground capitalize">
              {initialPrediction.category} {initialPrediction.tags?.[0] ? ` • ${initialPrediction.tags[0]}` : ""}
            </span>
          </div>

          <h1 className="text-[32px] sm:text-[40px] font-black leading-tight tracking-tight mb-4 text-foreground">
            {initialPrediction.title}
          </h1>

          {/* Huge Probability */}
          <div className="flex items-center gap-3 mb-6">
            <div className="text-[40px] font-bold text-[#0ea5e9] tracking-tight">{pctA}% prob</div>
          </div>

          {/* Huge Chart */}
          <div className="h-[400px] w-full mb-8 pt-4">
            <PredictionChart 
              currentProbA={probA} 
              history={initialPrediction.history?.map((h: any) => ({ date: new Date(h.date), probA: h.probA }))}
              startDate={initialPrediction.resolution_date || undefined}
              height={400}
              showAxes={true}
              colorA="#0ea5e9"
            />
          </div>
          
          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mb-8 border-b border-border pb-6">
            <span>{volumeStr} Vol.</span>
            {initialPrediction.resolution_date && (
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(initialPrediction.resolution_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Info className="w-5 h-5 text-muted-foreground" /> Detalles del Mercado
            </h2>
            
            {initialPrediction.description && (
              <p className="text-muted-foreground leading-relaxed text-sm">{initialPrediction.description}</p>
            )}

            {(initialPrediction.rules || initialPrediction.resolution_method) && (
               <div className="grid sm:grid-cols-2 gap-6 bg-card p-6 rounded-xl border border-border shadow-sm">
                {initialPrediction.rules && (
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Reglas Especiales</h3>
                    <p className="text-foreground/80 text-sm leading-relaxed">{initialPrediction.rules}</p>
                  </div>
                )}
                {initialPrediction.resolution_method && (
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Fuente de Verdad</h3>
                    <p className="text-foreground/80 text-sm leading-relaxed">{initialPrediction.resolution_method}</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Sticky Betting Panel Polymarket Style) */}
        <div className="w-full lg:w-[400px] shrink-0 mt-6 lg:mt-0">
          {isActive && (
            <div className="sticky top-28 bg-card rounded-[16px] border border-border p-5 shadow-2xl transition-colors">
              
              {/* Comprar / Vender Tabs */}
              <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
                <div className="flex gap-4 text-[15px] font-bold">
                  <span 
                    onClick={() => { setTradeMode("buy"); setBetResult(null); }}
                    className={`pb-3 -mb-[13px] cursor-pointer transition-colors ${tradeMode === "buy" ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
                  >
                    Comprar
                  </span>
                  <span 
                    onClick={() => { setTradeMode("sell"); setBetResult(null); }}
                    className={`pb-3 -mb-[13px] cursor-pointer transition-colors ${tradeMode === "sell" ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
                  >
                    Vender
                  </span>
                </div>
              </div>

              {/* Yes / No Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => { setBetSide("a"); setBetResult(null); }}
                  className={`flex-1 rounded-[10px] py-3.5 font-bold text-[15px] transition-all flex justify-center items-center gap-2 ${
                    betSide === "a"
                      ? "bg-[#10b981] text-white"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {initialPrediction.option_a_label} {pctA}¢
                </button>
                <button
                  onClick={() => { setBetSide("b"); setBetResult(null); }}
                  className={`flex-1 rounded-[10px] py-3.5 font-bold text-[15px] transition-all flex justify-center items-center gap-2 ${
                    betSide === "b"
                      ? "bg-[#f43f5e] text-white"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {initialPrediction.option_b_label} {pctB}¢
                </button>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <div className="flex justify-between items-center text-sm font-bold text-foreground mb-2">
                  <span>Monto ({tradeMode === "buy" ? "Diamantes" : "Shares"})</span>
                  {tradeMode === "sell" && (
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      Max: {maxSellValue} Shares
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between bg-transparent border-b border-border pb-1">
                  <span className="text-4xl font-medium text-muted-foreground pl-1 mb-1">{tradeMode === "buy" ? "💎" : ""}</span>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={betAmount === "" ? "" : betAmount}
                    onChange={(e) => {
                      setBetResult(null);
                      const val = e.target.value;
                      setBetAmount(val === "" ? "" : parseFloat(val) || 0);
                    }}
                    className="bg-transparent text-right text-[42px] font-black text-foreground w-full outline-none placeholder:text-muted-foreground"
                    placeholder="0"
                  />
                </div>
                <div className="text-right mt-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {betAmount !== "" && betAmount > 0 ? potentialText : ""}
                  </span>
                </div>
              </div>

              {/* Quick Amounts */}
              <div className="flex gap-1.5 mb-6">
                {[10, 50, 100, 500, "Max"].map((amt) => {
                  return (
                    <button
                      key={amt}
                      onClick={() => { 
                        setBetResult(null);
                        if (amt === "Max") {
                          setBetAmount(tradeMode === "buy" ? (balance || 0) : maxSellValue);
                        } else {
                          setBetAmount(prev => (prev === "" ? 0 : prev) + (amt as number));
                        }
                      }}
                      className="flex-1 bg-muted/60 hover:bg-muted text-foreground py-[7px] rounded-[8px] text-[13px] font-bold transition-colors"
                    >
                      {amt === "Max" ? "Max" : `+${amt}`}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {betResult?.error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 dark:text-red-400 text-sm font-medium text-center">
                  {betResult.error}
                </div>
              )}
              {betResult?.success && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm font-bold text-center">
                  {tradeMode === "buy" ? "🎉 Apuesta confirmada" : "💸 Venta exitosa"}
                </div>
              )}

              {/* Trade Button */}
              {!user ? (
                <Link href="/login" className="w-full flex items-center justify-center bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold text-[17px] py-4 rounded-xl transition-colors">
                  Inicia sesión para Tradear
                </Link>
              ) : (
                <button
                  onClick={handleBet}
                  disabled={
                    betAmount === "" ||
                    betting || 
                    (tradeMode === "buy" && betAmount > (balance || 0)) ||
                    (tradeMode === "sell" && betAmount > maxSellValue) ||
                    (tradeMode === "buy" && user?.tier === "free" && betAmount > 10)
                  }
                  className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] disabled:bg-muted disabled:text-muted-foreground text-white font-bold text-[17px] py-[14px] rounded-[10px] transition-colors"
                >
                  {betting 
                    ? "Procesando..." 
                    : tradeMode === "buy" && user?.tier === "free" && typeof betAmount === "number" && betAmount > 10
                      ? "Límite Free: Máx 10💎"
                      : tradeMode === "buy" && typeof betAmount === "number" && betAmount > (balance || 0)
                        ? "Saldo insuficiente" 
                        : tradeMode === "sell" && typeof betAmount === "number" && betAmount > maxSellValue
                          ? "Te faltan participaciones"
                          : tradeMode === "buy" 
                            ? "Comprar" 
                            : "Vender"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-width Related News Section at the Bottom */}
        {initialNews.length > 0 && (
          <div className="mt-16 pt-10 border-t border-border">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              Noticias Relacionadas al Mercado
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {initialNews.map((article, i) => (
                <NewsCard key={article.id} article={article} index={i} />
              ))}
            </div>
          </div>
        )}

      </div>
  );
}
