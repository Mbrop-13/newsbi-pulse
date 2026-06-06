"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BarChart3, TrendingUp, PieChart, Activity, Maximize2, Minimize2 } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#1890FF', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];

interface ChartCardProps {
  result: any;
}

function ChartIcon({ type }: { type: string }) {
  switch (type) {
    case 'bar': return <BarChart3 className="w-4.5 h-4.5 text-white" />;
    case 'line': return <TrendingUp className="w-4.5 h-4.5 text-white" />;
    case 'pie': return <PieChart className="w-4.5 h-4.5 text-white" />;
    case 'area': return <Activity className="w-4.5 h-4.5 text-white" />;
    default: return <BarChart3 className="w-4.5 h-4.5 text-white" />;
  }
}

function gradientId(type: string) { return `chart-grad-${type}`; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a1f2e] px-3 py-2 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 text-xs">
      <p className="font-bold text-gray-900 dark:text-white mb-1">{label || payload[0]?.name}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: p.color || COLORS[i] }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : p.value}
        </p>
      ))}
    </div>
  );
};

export function AIChartCard({ result }: ChartCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!result || result.error || !result.data || result.data.length === 0) {
    if (result?.error) {
      return (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20 w-fit">
          <BarChart3 className="w-4 h-4 shrink-0" />
          {typeof result.error === 'string' ? result.error : (result.error?.message || JSON.stringify(result.error))}
        </div>
      );
    }
    return null;
  }

  const { type, title, data, xLabel, yLabel, series } = result;
  const chartHeight = isExpanded ? 400 : 240;

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id={gradientId('bar')} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1890FF" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#1890FF" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#9ca3af' } } : undefined} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(24,144,255,0.05)' }} />
              {series && series.length > 1 ? (
                series.map((s: string, i: number) => (
                  <Bar key={s} dataKey={s} fill={COLORS[i % COLORS.length]} radius={[6, 6, 0, 0]} />
                ))
              ) : (
                <Bar dataKey="value" fill={`url(#${gradientId('bar')})`} radius={[6, 6, 0, 0]}>
                  {data.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              )}
              {(series && series.length > 1) && <Legend wrapperStyle={{ fontSize: 11 }} />}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {series && series.length > 1 ? (
                series.map((s: string, i: number) => (
                  <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 4, fill: COLORS[i % COLORS.length] }} activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} />
                ))
              ) : (
                <Line type="monotone" dataKey="value" stroke="#1890FF" strokeWidth={2.5} dot={{ r: 4, fill: '#1890FF' }} activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} />
              )}
              {(series && series.length > 1) && <Legend wrapperStyle={{ fontSize: 11 }} />}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id={gradientId('area')} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1890FF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1890FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#1890FF" strokeWidth={2} fill={`url(#${gradientId('area')})`} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <RechartsPie>
              <Pie data={data} cx="50%" cy="50%" innerRadius={chartHeight * 0.22} outerRadius={chartHeight * 0.38} paddingAngle={3} dataKey="value" nameKey="label" label={({ label, percent }: any) => `${label} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }} style={{ fontSize: 11 }}>
                {data.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPie>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <RadarChart data={data} cx="50%" cy="50%" outerRadius={chartHeight * 0.35}>
              <PolarGrid stroke="rgba(128,128,128,0.15)" />
              <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: '#9ca3af' }} />
              <Radar dataKey="value" stroke="#1890FF" fill="#1890FF" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const gradients: Record<string, string> = {
    bar: 'from-[#1890FF] to-indigo-600',
    line: 'from-emerald-500 to-teal-600',
    pie: 'from-violet-500 to-purple-600',
    area: 'from-cyan-500 to-blue-600',
    radar: 'from-amber-500 to-orange-600',
  };
  const iconGradient = gradients[type] || 'from-[#1890FF] to-indigo-600';

  return (
    <div className={`w-full ${isExpanded ? 'max-w-2xl' : 'max-w-md'} my-3 transition-all duration-300`}>
      {/* Header */}
      <div className={`flex items-center gap-3 w-full px-4 py-3.5 bg-white dark:bg-[#141821] border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-sm ${isOpen ? 'rounded-b-none border-b-0 shadow-none' : ''}`}>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-md shrink-0`}>
          <ChartIcon type={type} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{title || 'Gráfico'}</p>
          <span className="text-[11px] text-gray-400">{data.length} datos · {type === 'bar' ? 'Barras' : type === 'line' ? 'Líneas' : type === 'pie' ? 'Torta' : type === 'area' ? 'Área' : 'Radar'}</span>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-[#1890FF] transition-colors" title={isExpanded ? 'Reducir' : 'Expandir'}>
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <button onClick={() => setIsOpen(!isOpen)} className="p-1">
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Chart */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="bg-white dark:bg-[#141821] border border-t-0 border-gray-200/80 dark:border-white/10 rounded-b-2xl shadow-sm p-4">
              {renderChart()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
