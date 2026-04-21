"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDiamondStore } from "@/lib/stores/diamond-store";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Trophy, TrendingUp, Gem, BarChart3, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface Bet {
  id: string;
  prediction_id: string;
  side: string;
  amount: number;
  shares: number;
  created_at: string;
  prediction?: {
    id: string;
    title: string;
    option_a_label: string;
    option_b_label: string;
    pool_a: number;
    pool_b: number;
    winner: string | null;
    total_volume: number;
    slug?: string;
    status: string;
  };
}

export default function MisPrediccionesPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const balance = useDiamondStore((s) => s.balance);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = createClient();

      // Get user bets
      const { data: userBets, error } = await supabase
        .from("user_bets")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error || !userBets) { setLoading(false); return; }

      const predictionIds = [...new Set(userBets.map(b => b.prediction_id))];
      const { data: predictions } = await supabase
        .from("predictions")
        .select("id, slug, title, option_a_label, option_b_label, pool_a, pool_b, status, winner, total_volume")
        .in("id", predictionIds);

      const predMap = new Map((predictions || []).map(p => [p.id, p]));

      setBets(userBets.map(b => ({
        ...b,
        prediction: predMap.get(b.prediction_id) || undefined,
      })));
      setLoading(false);
    }
    load();
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Inicia sesión para ver tus predicciones.</p>
      </div>
    );
  }

  const activeBets = bets.filter(b => b.prediction?.status === "active");
  const resolvedBets = bets.filter(b => b.prediction?.status === "resolved");

  const totalWagered = bets.reduce((s, b) => s + b.amount, 0);
  const wins = resolvedBets.filter(b => b.prediction?.winner === b.side);
  const winRate = resolvedBets.length > 0 ? Math.round((wins.length / resolvedBets.length) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-foreground mb-1">Mis Predicciones</h1>
        <p className="text-muted-foreground text-sm mb-6">Tu historial de apuestas y rendimiento.</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
      >
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-foreground">{bets.length}</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Apuestas</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-foreground">{totalWagered} 💎</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Apostados</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-purple-400">{winRate}%</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Tasa Acierto</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-foreground">{balance} 💎</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Balance</p>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : bets.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Aún no has hecho predicciones.</p>
          <Link href="/predicciones" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold">
            Explorar Mercados
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active */}
          {activeBets.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Activas ({activeBets.length})
              </h2>
              <div className="space-y-2">
                {activeBets.map((bet, i) => {
                  const p = bet.prediction!;
                  const probMy = bet.side === "a"
                    ? p.pool_a / (p.pool_a + p.pool_b)
                    : p.pool_b / (p.pool_a + p.pool_b);
                  const potentialPayout = (bet.shares * (p.pool_a + p.pool_b)) / 
                    (bet.side === "a" ? p.pool_b : p.pool_a) * probMy;

                  return (
                    <motion.div
                      key={bet.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <Link href={`/predicciones/${p.slug || p.id}`} className="font-bold text-foreground text-sm truncate hover:text-blue-400 transition-colors block">
                          {p.title}
                        </Link>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Apostaste <span className="text-purple-400 font-bold">{bet.amount} 💎</span> a{" "}
                          <span className={bet.side === "a" ? "text-green-400" : "text-red-400"}>
                            {bet.side === "a" ? p.option_a_label : p.option_b_label}
                          </span>
                          {" "}· {bet.shares.toFixed(1)} shares · {Math.round(probMy * 100)}%
                        </p>
                      </div>
                      <div className="shrink-0 text-right flex flex-col gap-2 items-end">
                        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg w-fit">
                          EN JUEGO
                        </span>
                        <Link 
                          href={`/predicciones/${p.slug || p.id}`}
                          className="text-[10px] font-bold text-white bg-[#0ea5e9] hover:bg-[#0284c7] px-3 py-1.5 rounded-md transition-colors"
                        >
                          Vender
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resolved */}
          {resolvedBets.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5" /> Resueltas ({resolvedBets.length})
              </h2>
              <div className="space-y-2">
                {resolvedBets.map((bet, i) => {
                  const p = bet.prediction!;
                  const won = p.winner === bet.side;
                  return (
                    <motion.div
                      key={bet.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`bg-card border rounded-xl p-4 flex items-center justify-between gap-3 ${
                        won ? "border-green-500/20" : "border-border"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <Link href={`/predicciones/${p.slug || p.id}`} className="font-bold text-foreground text-sm truncate hover:text-blue-400 transition-colors block">
                          {p.title}
                        </Link>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Apostaste <span className="text-purple-400 font-bold">{bet.amount} 💎</span> a{" "}
                          <span className={bet.side === "a" ? "text-green-400" : "text-red-400"}>
                            {bet.side === "a" ? p.option_a_label : p.option_b_label}
                          </span>
                        </p>
                      </div>
                      <div className="shrink-0">
                        {won ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg">
                            <CheckCircle className="w-3 h-3" /> GANASTE
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg">
                            <XCircle className="w-3 h-3" /> PERDISTE
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
