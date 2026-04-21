"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, AlertTriangle, Gem } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";

interface ResolvedBet {
  id: string;
  side: "a" | "b";
  amount: number;
  shares: number;
  prediction: {
    id: string;
    title: string;
    winner: "a" | "b";
    option_a_label: string;
    option_b_label: string;
    pool_a: number;
    pool_b: number;
  };
}

export function ResolvedBetsPopup() {
  const user = useAuthStore(s => s.user);
  const supabase = createClient();
  const [resolvedBets, setResolvedBets] = useState<ResolvedBet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!user) return;

    const checkResolvedBets = async () => {
      // Fetch bets where prediction is resolved
      const { data, error } = await supabase
        .from("user_bets")
        .select(`
          id,
          side,
          amount,
          shares,
          prediction:predictions!inner (
            id,
            title,
            status,
            winner,
            option_a_label,
            option_b_label,
            pool_a,
            pool_b
          )
        `)
        .eq("prediction.status", "resolved")
        .order("created_at", { ascending: false });

      if (error || !data) return;

      // Filter out seen bets from localStorage
      const seenStr = localStorage.getItem("seen_resolved_bets") || "[]";
      let seen: string[] = [];
      try { seen = JSON.parse(seenStr); } catch (e) {}

      const unseen = (data as unknown as ResolvedBet[]).filter(b => !seen.includes(b.id));
      
      if (unseen.length > 0) {
        setResolvedBets(unseen);
      }
    };

    // Check on mount and every 2 minutes
    checkResolvedBets();
    const interval = setInterval(checkResolvedBets, 120000);
    return () => clearInterval(interval);
  }, [user, supabase]);

  const handleDismiss = (betId: string) => {
    // Mark as seen
    const seenStr = localStorage.getItem("seen_resolved_bets") || "[]";
    let seen: string[] = [];
    try { seen = JSON.parse(seenStr); } catch (e) {}
    seen.push(betId);
    localStorage.setItem("seen_resolved_bets", JSON.stringify(seen));

    // Move to next or close
    if (currentIndex < resolvedBets.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setResolvedBets([]);
      setCurrentIndex(0);
    }
  };

  if (resolvedBets.length === 0) return null;

  const currentBet = resolvedBets[currentIndex];
  const p = currentBet.prediction;
  const isWinner = currentBet.side === p.winner;
  
  // Calculate exact payout logic used in resolution
  // Total pool
  const totalPool = p.pool_a + p.pool_b;
  // User's share of the winning pool
  const winningPool = p.winner === "a" ? p.pool_a : p.pool_b;
  const payout = isWinner ? Math.round((currentBet.shares / winningPool) * totalPool) : 0;
  const profit = payout - currentBet.amount;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-6 right-6 z-50 w-full max-w-sm"
      >
        <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl p-5 ${
          isWinner 
            ? "bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/10" 
            : "bg-rose-500/10 border-rose-500/30 shadow-rose-500/10"
        }`}>
          {/* Close button */}
          <button 
            onClick={() => handleDismiss(currentBet.id)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 text-white/70 hover:text-white hover:bg-black/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${isWinner ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isWinner ? <Trophy className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isWinner ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isWinner ? "¡Predicción Acertada!" : "Predicción Perdida"}
              </h3>
              <p className="text-xs text-muted-foreground">Mercado Resuelto</p>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <p className="text-sm text-foreground font-medium leading-tight mb-2">
              {p.title}
            </p>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-muted-foreground">Tu apuesta:</span>
              <span className={`px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                currentBet.side === "a" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
              }`}>
                {currentBet.side === "a" ? p.option_a_label : p.option_b_label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] mt-1.5">
              <span className="text-muted-foreground">Resultado Real:</span>
              <span className={`px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                p.winner === "a" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
              }`}>
                {p.winner === "a" ? p.option_a_label : p.option_b_label}
              </span>
            </div>
          </div>

          {/* Payout */}
          <div className={`p-3 rounded-xl flex items-center justify-between ${
            isWinner ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-black/20 border border-white/5"
          }`}>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                {isWinner ? "Retorno Total" : "Monto Perdido"}
              </p>
              <div className="flex items-center gap-1.5">
                <Gem className={`w-4 h-4 ${isWinner ? "text-emerald-400" : "text-rose-400"}`} />
                <span className={`text-xl font-black ${isWinner ? "text-emerald-400" : "text-rose-400"}`}>
                  {isWinner ? `+${payout}` : `-${currentBet.amount}`}
                </span>
              </div>
            </div>
            {isWinner && (
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/60 mb-1">
                  Ganancia Neta
                </p>
                <span className="text-sm font-bold text-emerald-400">
                  +{profit} 💎
                </span>
              </div>
            )}
          </div>

          <button 
            onClick={() => handleDismiss(currentBet.id)}
            className={`w-full mt-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              isWinner 
                ? "bg-emerald-500 hover:bg-emerald-600 text-black" 
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            {resolvedBets.length > 1 ? `Siguiente (${currentIndex + 1}/${resolvedBets.length})` : "Aceptar"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
