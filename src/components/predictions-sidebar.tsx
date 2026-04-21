"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { PredictionCard } from "./prediction-card";

interface Prediction {
  id: string;
  title: string;
  description: string;
  rules: string;
  resolution_method: string;
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
  tags: string[];
  image_url: string | null;
}

export function PredictionsSidebar() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/predictions?status=active")
      .then(r => r.json())
      .then(d => {
        if (d.predictions) setPredictions(d.predictions.slice(0, 3));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-purple-500/10">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Predicciones</h3>
        </div>
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-purple-500/50" />
        </div>
      </div>
    );
  }

  if (predictions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Predicciones</h3>
        </div>
        <Link
          href="/predicciones"
          className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider"
        >
          Ver todo →
        </Link>
      </div>

      {/* Prediction cards */}
      <div className="p-3 space-y-3">
        {predictions.map((pred, i) => (
          <PredictionCard
            key={pred.id}
            prediction={pred}
            compact
          />
        ))}
      </div>
    </motion.div>
  );
}
