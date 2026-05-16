"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, AlertCircle, Info, TrendingUp, TrendingDown, Minus, Shield, BarChart3, FileText, Globe, ChevronDown, Calculator, ExternalLink } from 'lucide-react';

function getLogoUrl(symbol: string): string {
  return `https://assets.parqet.com/logos/symbol/${symbol}`;
}
function getFallbackLogo(symbol: string): string {
  return `https://ui-avatars.com/api/?name=${symbol}&background=1890FF&color=fff&bold=true&size=96`;
}

interface ReportViewerProps {
  report: any;
  onClose: () => void;
}

const VERDICT_CONFIG: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  COMPRAR: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', icon: TrendingUp },
  MANTENER: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', icon: Minus },
  VENDER: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20', icon: TrendingDown },
};

const ALERT_CONFIG: Record<string, { bg: string; border: string; text: string; icon: any }> = {
  danger: { bg: 'bg-red-50 dark:bg-red-500/5', border: 'border-red-200 dark:border-red-500/20', text: 'text-red-700 dark:text-red-400', icon: AlertTriangle },
  warning: { bg: 'bg-amber-50 dark:bg-amber-500/5', border: 'border-amber-200 dark:border-amber-500/20', text: 'text-amber-700 dark:text-amber-400', icon: AlertCircle },
  info: { bg: 'bg-blue-50 dark:bg-blue-500/5', border: 'border-blue-200 dark:border-blue-500/20', text: 'text-blue-700 dark:text-blue-400', icon: Info },
};

const RISK_CONFIG: Record<string, string> = {
  BAJO: 'text-emerald-500 bg-emerald-500/10',
  MEDIO: 'text-amber-500 bg-amber-500/10',
  ALTO: 'text-red-500 bg-red-500/10',
};

export function ReportViewer({ report, onClose }: ReportViewerProps) {
  const [expandedStocks, setExpandedStocks] = useState<Record<string, boolean>>({});
  const data = report.report_data;
  if (!data) return null;

  const toggleStock = (symbol: string) => {
    setExpandedStocks(prev => ({ ...prev, [symbol]: !prev[symbol] }));
  };

  const createdAt = new Date(report.created_at);
  const dateStr = createdAt.toLocaleDateString('es-CL', { dateStyle: 'long' });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="w-full max-w-4xl h-[95vh] bg-white dark:bg-[#0C0E14] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gradient-to-r from-[#1890FF]/5 via-indigo-500/5 to-purple-500/5 shrink-0">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1890FF]" />
              {data.title || report.title}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">{dateStr} · {report.symbols?.length || 0} activos · {((report.generation_time_ms || 0) / 1000).toFixed(1)}s</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto hidden-scrollbar px-6 py-6 space-y-6">

          {/* Executive Summary */}
          {data.executive_summary && (
            <div className="bg-gradient-to-br from-[#1890FF]/5 to-indigo-500/5 border border-[#1890FF]/15 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-[#1890FF] uppercase tracking-wider mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Resumen Ejecutivo
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{data.executive_summary}</p>
            </div>
          )}

          {/* Market Context */}
          {data.market_context && (
            <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Contexto de Mercado
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{data.market_context}</p>
            </div>
          )}

          {/* Alerts */}
          {data.alerts && data.alerts.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Alertas ({data.alerts.length})
              </h2>
              {data.alerts.map((alert: any, i: number) => {
                const cfg = ALERT_CONFIG[alert.type] || ALERT_CONFIG.info;
                const Icon = cfg.icon;
                return (
                  <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.text}`} />
                    <div>
                      <p className={`text-sm font-bold ${cfg.text}`}>{alert.symbol && <span className="mr-1.5">[{alert.symbol}]</span>}{alert.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Portfolio Metrics */}
          {data.portfolio_metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Valor Total', value: `$${(data.portfolio_metrics.total_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                { label: 'P&L Total', value: `$${(data.portfolio_metrics.total_pnl || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: (data.portfolio_metrics.total_pnl || 0) >= 0 ? 'text-emerald-500' : 'text-red-500' },
                { label: 'Diversificación', value: data.portfolio_metrics.diversification_score || 'N/A' },
                { label: 'Riesgo', value: data.portfolio_metrics.risk_assessment?.substring(0, 30) || 'N/A' },
              ].map((m, i) => (
                <div key={i} className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-xl p-3.5 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{m.label}</p>
                  <p className={`text-sm font-bold mt-1 ${m.color || 'text-gray-900 dark:text-white'}`}>{m.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Individual Stock Analyses */}
          {data.analyses && data.analyses.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Análisis por Acción ({data.analyses.length})
              </h2>
              {data.analyses.map((analysis: any) => {
                const isOpen = expandedStocks[analysis.symbol];
                const vc = VERDICT_CONFIG[analysis.verdict] || VERDICT_CONFIG.MANTENER;
                const VerdictIcon = vc.icon;
                const isPositive = (analysis.change_pct || 0) >= 0;

                return (
                  <div key={analysis.symbol} className="border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-white/[0.02]">
                    <button onClick={() => toggleStock(analysis.symbol)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 ring-2 ring-gray-100 dark:ring-gray-800">
                        <img src={getLogoUrl(analysis.symbol)} alt="" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = getFallbackLogo(analysis.symbol); }} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{analysis.company_name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{analysis.symbol}</span>
                          <span className="text-[10px] text-gray-400">{analysis.sector}</span>
                          <span className={`text-[11px] font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                            ${analysis.price?.toFixed(2)} ({isPositive ? '+' : ''}{analysis.change_pct?.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${vc.bg} ${vc.border} border`}>
                        <VerdictIcon className={`w-3.5 h-3.5 ${vc.text}`} />
                        <span className={`text-xs font-bold ${vc.text}`}>{analysis.verdict}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                          <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-white/5 pt-4">
                            {/* Fundamental */}
                            <div>
                              <h4 className="text-xs font-bold text-[#1890FF] uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Análisis Fundamental</h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.fundamental_analysis}</p>
                            </div>
                            {/* Technical */}
                            <div>
                              <h4 className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Análisis Técnico</h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.technical_analysis}</p>
                            </div>
                            {/* Formulas */}
                            {analysis.formula_examples && analysis.formula_examples.length > 0 && (
                              <div>
                                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Calculator className="w-3.5 h-3.5" /> Fórmulas y Cálculos</h4>
                                <div className="space-y-1.5">
                                  {analysis.formula_examples.map((f: string, i: number) => (
                                    <div key={i} className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-lg px-3 py-2">
                                      <code className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all">{f}</code>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Outlook */}
                            <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-3 border border-gray-200 dark:border-white/5">
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Perspectiva</h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{analysis.outlook}</p>
                            </div>
                            {/* Verdict Reasoning */}
                            <div className={`rounded-xl p-3 border ${vc.bg} ${vc.border}`}>
                              <p className={`text-sm font-medium ${vc.text}`}>{analysis.verdict_reasoning}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recommendations Table */}
          {data.recommendations_table && data.recommendations_table.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Tabla de Recomendaciones
              </h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/5">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-50 dark:bg-white/[0.03]">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-white/5">Acción</th>
                      <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-white/5">Consenso</th>
                      <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-white/5">Riesgo</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-white/5">Razonamiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {data.recommendations_table.map((rec: any, i: number) => {
                      const vc = VERDICT_CONFIG[rec.action] || VERDICT_CONFIG.MANTENER;
                      const VIcon = vc.icon;
                      return (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                                <img src={getLogoUrl(rec.symbol)} alt="" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = getFallbackLogo(rec.symbol); }} />
                              </div>
                              <span className="font-bold text-gray-900 dark:text-white">{rec.symbol}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${vc.bg} ${vc.text} ${vc.border} border`}>
                              <VIcon className="w-3 h-3" /> {rec.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${RISK_CONFIG[rec.risk_level] || 'text-gray-500 bg-gray-100'}`}>{rec.risk_level || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-xs">{rec.reasoning}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Web Sources */}
          {data.web_sources && data.web_sources.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fuentes web:</span>
              {data.web_sources.slice(0, 5).map((url: string, i: number) => {
                let hostname = 'web';
                try { hostname = new URL(url).hostname.replace('www.', ''); } catch {}
                return (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-[10px] font-medium text-gray-500 hover:text-[#1890FF] transition-colors">
                    <ExternalLink className="w-2.5 h-2.5" /> {hostname}
                  </a>
                );
              })}
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl p-4 mt-4">
            <p className="text-[10px] text-gray-400 leading-relaxed italic">{data.disclaimer || 'Este informe es generado por inteligencia artificial con fines informativos y educativos. No constituye asesoría financiera. Las decisiones de inversión son responsabilidad exclusiva del usuario.'}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
