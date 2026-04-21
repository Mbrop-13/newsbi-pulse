"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gem, ChevronDown, ChevronUp, Loader2, Clock, Users, TrendingUp, Zap, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDiamondStore } from "@/lib/stores/diamond-store";
import { PredictionChart } from "./prediction-chart";
import Link from "next/link";

interface PredictionCardProps {
  prediction: {
    id: string;
    title: string;
    description?: string;
    rules?: string;
    resolution_method?: string;
    option_a_label: string;
    option_b_label: string;
    pool_a: number;
    pool_b: number;
    prob_a: number;
    prob_b: number;
    total_volume: number;
    resolution_date: string | null;
    status: string;
    winner: string | null;
    category: string;
    image_url?: string | null;
    slug?: string;
    history?: { date: string; probA: number }[];
  };
  compact?: boolean;
  onBetPlaced?: () => void;
}

export function PredictionCard({ prediction: p, compact = false, onBetPlaced }: PredictionCardProps) {
  const [showBetPanel, setShowBetPanel] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [betSide, setBetSide] = useState<"a" | "b" | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [betting, setBetting] = useState(false);
  const [betResult, setBetResult] = useState<any>(null);
  const [poolA, setPoolA] = useState(p.pool_a);
  const [poolB, setPoolB] = useState(p.pool_b);

  const user = useAuthStore((s) => s.user);
  const balance = useDiamondStore((s) => s.balance);

  const probA = poolA / (poolA + poolB);
  const probB = poolB / (poolA + poolB);
  const pctA = Math.round(probA * 100);
  const pctB = Math.round(probB * 100);

  const isResolved = p.status === "resolved";
  const isActive = p.status === "active";

  const timeLeft = p.resolution_date
    ? Math.max(0, new Date(p.resolution_date).getTime() - Date.now())
    : null;
  const daysLeft = timeLeft ? Math.ceil(timeLeft / (1000 * 60 * 60 * 24)) : null;

  // Calculate potential payout for current bet
  const potentialPayout = useMemo(() => {
    if (!betSide || betAmount < 1) return 0;
    const pThis = betSide === "a" ? poolA : poolB;
    const pOther = betSide === "a" ? poolB : poolA;
    const shares = (betAmount * pOther) / (pThis + betAmount);
    // Total pool after bet
    const totalAfter = poolA + poolB + betAmount;
    // My share of winnings
    const totalSharesWinSide = (betSide === "a" ? pOther : pOther); // existing opposite pool = existing shares
    // Rough payout: shares/totalSharesSide * totalPool
    // Simpler: you get back proportional to your shares
    return Math.round(shares + betAmount); // approximate payout
  }, [betSide, betAmount, poolA, poolB]);

  const handleBet = async () => {
    if (!betSide || betAmount < 1) return;
    setBetting(true);
    try {
      const res = await fetch(`/api/predictions/${p.id}/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side: betSide, amount: betAmount }),
      });
      const data = await res.json();
      if (data.success) {
        setBetResult(data);
        // Update local pools
        if (betSide === "a") setPoolA(prev => prev + betAmount);
        else setPoolB(prev => prev + betAmount);
        useDiamondStore.setState({ balance: data.newBalance });
        onBetPlaced?.();
      } else {
        setBetResult({ error: data.error });
      }
    } catch (err: any) {
      setBetResult({ error: err.message });
    }
    setBetting(false);
  };

  return (
    <div className={`rounded-2xl overflow-hidden ${compact ? "" : ""}`}>
      {/* Main card body */}
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl overflow-hidden hover:border-blue-500/20 transition-all">
        <div className={compact ? "p-3.5" : "p-5"}>
          {/* Top row: badge + timer */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                {p.category}
              </span>
              {isResolved && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/15 text-green-400 border border-green-500/20">
                  ✓ {p.winner === "a" ? p.option_a_label : p.option_b_label}
                </span>
              )}
            </div>
            {daysLeft !== null && isActive && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {daysLeft}d
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/predicciones/${p.slug || p.id}`} className="group/link block">
            <h3 className={`font-bold text-foreground leading-snug group-hover/link:text-blue-400 transition-colors flex items-start gap-2 ${compact ? "text-[13px]" : "text-base"}`}>
              {p.title}
              {!compact && <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity mt-1 shrink-0" />}
            </h3>
          </Link>

          {/* Chart */}
          {!compact && isActive && (
            <div className="mt-4 mb-2 -mx-2 h-[120px] pointer-events-none">
               <PredictionChart 
                 currentProbA={probA} 
                 history={p.history?.map(h => ({ date: new Date(h.date), probA: h.probA }))}
                 startDate={p.resolution_date || undefined}
               />
            </div>
          )}

          {/* Polymarket-style probability buttons */}
          {isActive && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => { setBetSide("a"); setShowBetPanel(true); setBetResult(null); }}
                className={`group relative rounded-xl border-2 transition-all py-3 px-3 text-center ${
                  betSide === "a" && showBetPanel
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-emerald-500/15 bg-emerald-500/5 hover:border-emerald-500/30 hover:bg-emerald-500/10"
                }`}
              >
                <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider mb-0.5">{p.option_a_label}</p>
                <p className="text-2xl font-black text-emerald-400">{pctA}¢</p>
              </button>
              <button
                onClick={() => { setBetSide("b"); setShowBetPanel(true); setBetResult(null); }}
                className={`group relative rounded-xl border-2 transition-all py-3 px-3 text-center ${
                  betSide === "b" && showBetPanel
                    ? "border-rose-500/50 bg-rose-500/10"
                    : "border-rose-500/15 bg-rose-500/5 hover:border-rose-500/30 hover:bg-rose-500/10"
                }`}
              >
                <p className="text-[10px] font-bold text-rose-400/70 uppercase tracking-wider mb-0.5">{p.option_b_label}</p>
                <p className="text-2xl font-black text-rose-400">{pctB}¢</p>
              </button>
            </div>
          )}

          {/* Resolved result */}
          {isResolved && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className={`rounded-xl py-3 px-3 text-center ${p.winner === "a" ? "bg-emerald-500/10 border-2 border-emerald-500/30" : "bg-muted/30 border-2 border-transparent opacity-40"}`}>
                <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider mb-0.5">{p.option_a_label}</p>
                <p className={`text-2xl font-black ${p.winner === "a" ? "text-emerald-400" : "text-muted-foreground"}`}>{pctA}¢</p>
              </div>
              <div className={`rounded-xl py-3 px-3 text-center ${p.winner === "b" ? "bg-rose-500/10 border-2 border-rose-500/30" : "bg-muted/30 border-2 border-transparent opacity-40"}`}>
                <p className="text-[10px] font-bold text-rose-400/70 uppercase tracking-wider mb-0.5">{p.option_b_label}</p>
                <p className={`text-2xl font-black ${p.winner === "b" ? "text-rose-400" : "text-muted-foreground"}`}>{pctB}¢</p>
              </div>
            </div>
          )}

          {/* Volume bar */}
          <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Gem className="w-3 h-3 text-purple-400/60" /> {p.total_volume + (poolA + poolB - p.pool_a - p.pool_b)} vol</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {poolA + poolB} pool</span>
          </div>

          {/* Rules toggle */}
          {(p.rules || p.resolution_method) && (
            <button
              onClick={() => setShowRules(!showRules)}
              className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {showRules ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Reglas y Resolución
            </button>
          )}

          <AnimatePresence>
            {showRules && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                  {p.rules && (
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Reglas</p>
                      <p className="text-xs text-muted-foreground/80">{p.rules}</p>
                    </div>
                  )}
                  {p.resolution_method && (
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Resolución</p>
                      <p className="text-xs text-muted-foreground/80">{p.resolution_method}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bet Panel */}
          <AnimatePresence>
            {showBetPanel && betSide && user && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-4 rounded-xl bg-muted/20 border border-blue-500/15 space-y-3">
                  {betResult?.success ? (
                    <div className="text-center py-2">
                      <div className="text-2xl mb-1">🎉</div>
                      <p className="text-foreground font-bold text-sm">¡Apuesta realizada!</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        {betResult.bet.shares.toFixed(2)} shares · Potencial ~{Math.round(betResult.bet.shares + betResult.bet.amount)} 💎
                      </p>
                      <button onClick={() => { setShowBetPanel(false); setBetResult(null); }} className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors">Cerrar</button>
                    </div>
                  ) : betResult?.error ? (
                    <div className="text-center py-2">
                      <p className="text-red-400 font-bold text-sm">{betResult.error}</p>
                      <button onClick={() => setBetResult(null)} className="mt-2 text-xs text-muted-foreground hover:text-foreground">Reintentar</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-foreground">
                          Apostar a{" "}
                          <span className={betSide === "a" ? "text-emerald-400" : "text-rose-400"}>
                            {betSide === "a" ? p.option_a_label : p.option_b_label}
                          </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">{balance} 💎</p>
                      </div>

                      {/* Quick amounts */}
                      <div className="flex items-center gap-1.5">
                        {[5, 10, 25, 50, 100].map(amt => (
                          <button
                            key={amt}
                            onClick={() => setBetAmount(amt)}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                              betAmount === amt
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10"
                                : "bg-muted/30 text-muted-foreground hover:text-foreground border border-transparent"
                            }`}
                          >
                            {amt}
                          </button>
                        ))}
                      </div>

                      {/* Amount input + payout preview */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Gem className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-400/50" />
                          <input
                            type="number"
                            min={1}
                            max={balance}
                            value={betAmount || ""}
                            onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                            className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-blue-500/50"
                          />
                        </div>
                        <button
                          onClick={handleBet}
                          disabled={betting || betAmount < 1 || betAmount > balance}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-600 text-white text-sm font-bold disabled:opacity-40 flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-blue-500/20 shrink-0"
                        >
                          {betting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                          Apostar
                        </button>
                      </div>

                      {/* Payout preview */}
                      <div className="flex items-center justify-between px-1 text-[10px]">
                        <span className="text-muted-foreground">Retorno potencial</span>
                        <span className="font-bold text-emerald-400">~{potentialPayout} 💎 ({betAmount > 0 ? ((potentialPayout / betAmount)).toFixed(1) : "0"}x)</span>
                      </div>

                      <button onClick={() => { setShowBetPanel(false); setBetSide(null); }} className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">Cancelar</button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login prompt */}
          {isActive && !user && (
            <p className="mt-3 text-[10px] text-muted-foreground text-center">Inicia sesión para apostar</p>
          )}
        </div>
      </div>
    </div>
  );
}
