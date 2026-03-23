"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Cpu, Database, Ghost, Terminal } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface LogEntry {
  id: string;
  trace_id: string;
  step: string;
  model: string;
  prompt: string;
  response: string;
  tokens_used: number;
  created_at: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase
        .from("ai_pipeline_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) setLogs(data);
      setLoading(false);
    }

    fetchLogs();

    // Subscribe to real-time logs
    const channel = supabase
      .channel("ai_logs_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ai_pipeline_logs" },
        (payload) => {
          setLogs((prev) => [payload.new as LogEntry, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-gray-100 p-4 sm:p-8 pt-24 font-mono">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b border-gray-800 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Terminal className="text-blue-500 w-8 h-8" />
              AI Observability <span className="text-blue-500">Log</span>
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Seguimiento en tiempo real de prompts, respuestas y consumo de tokens.
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">
              Status: Live
            </span>
          </div>
        </header>

        {logs.length === 0 ? (
          <div className="text-center py-24 bg-gray-900/50 rounded-2xl border border-gray-800">
            <Ghost className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">Sin logs aún</h3>
            <p className="text-gray-600 mt-2">Ejecuta el pipeline de noticias para ver los datos aquí.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <motion.div
                key={log.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-xl overflow-hidden transition-colors ${
                  expandedId === log.id ? "bg-gray-900 border-blue-500/50" : "bg-gray-900/40 border-gray-800 hover:border-gray-700"
                }`}
              >
                <div 
                  className="p-4 sm:p-6 cursor-pointer flex items-center justify-between gap-4"
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        log.step.includes('clustering') ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {log.step}
                      </span>
                      <span className="text-gray-600 text-[10px] truncate max-w-[200px] hidden sm:inline">
                        Trace: {log.trace_id}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-200 truncate">
                      {log.model}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                      <span className="text-xs text-blue-400 font-bold">{log.tokens_used} tokens</span>
                      <span className="text-[10px] text-gray-600">{formatDate(log.created_at)}</span>
                    </div>
                    {expandedId === log.id ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === log.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-800"
                    >
                      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-500 uppercase">
                            <Cpu className="w-3 h-3" /> Prompt Enviado
                          </div>
                          <pre className="bg-black/40 p-4 rounded-lg text-[11px] leading-relaxed text-gray-400 whitespace-pre-wrap max-h-[400px] overflow-y-auto border border-white/5">
                            {log.prompt}
                          </pre>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-500 uppercase">
                            <Database className="w-3 h-3" /> Respuesta de IA
                          </div>
                          <pre className="bg-black/40 p-4 rounded-lg text-[11px] leading-relaxed text-blue-100/80 whitespace-pre-wrap max-h-[400px] overflow-y-auto border border-blue-500/10">
                            {log.response}
                          </pre>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
