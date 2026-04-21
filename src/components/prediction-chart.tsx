"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HistoryPoint {
  date: Date;
  probA: number; // 0 to 1
}

interface PredictionChartProps {
  history?: HistoryPoint[];
  currentProbA: number;
  startDate?: string; // ISO string
  colorA?: string;
  colorB?: string;
  height?: number;
  showAxes?: boolean;
}

export function PredictionChart({
  history,
  currentProbA,
  startDate,
  colorA = "#10b981", // Emerald 500
  colorB = "#f43f5e", // Rose 500
  height = 160,
  showAxes = false,
}: PredictionChartProps) {
  
  // If no history is provided, generate a simulated history curve from 50% to current
  // In a real app, this would be fetched from a subquery on user_bets ordered by time
  const data = useMemo(() => {
    if (history && history.length > 0) {
      // Generate a dense array of points for smooth hovering
      const points = [];
      const sortedHistory = [...history].sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const startTime = sortedHistory[0].date.getTime();
      const endTime = Date.now();
      
      // If the market was just created (startTime == endTime), avoid division by zero
      const duration = endTime - startTime;
      if (duration < 60000) {
        // Less than a minute old, just return the current point and a point 1 hr from now
        return [
          { time: startTime, probA: currentProbA * 100, formattedTime: format(new Date(startTime), "dd MMM HH:mm", { locale: es }) },
          { time: endTime, probA: currentProbA * 100, formattedTime: format(new Date(endTime), "dd MMM HH:mm", { locale: es }) }
        ];
      }

      const RESOLUTION = 100; // number of points across the X axis to allow smooth hovering
      const timeStep = duration / RESOLUTION;
      
      let historyIndex = 0;
      let lastKnownProb = sortedHistory[0].probA * 100;

      for (let i = 0; i <= RESOLUTION; i++) {
        const t = startTime + i * timeStep;
        
        // Advance the historyIndex to find the latest valid bet up to time 't'
        while (historyIndex < sortedHistory.length - 1 && sortedHistory[historyIndex + 1].date.getTime() <= t) {
          historyIndex++;
          lastKnownProb = sortedHistory[historyIndex].probA * 100;
        }

        points.push({
          time: t,
          probA: lastKnownProb,
          formattedTime: format(new Date(t), "dd MMM HH:mm", { locale: es }),
        });
      }
      
      // Ensure the very last point perfectly matches the real current probability
      points[points.length - 1].probA = currentProbA * 100;

      return points;
    }

    // Synthesize data for visual effect (Polymarket vibe)
    const points = [];
    const now = Date.now();
    const start = startDate ? new Date(startDate).getTime() : now - 7 * 24 * 60 * 60 * 1000;
    const steps = 30;
    const timeStep = (now - start) / steps;
    
    // Random walk from 50 to current
    let currentVal = 50;
    for (let i = 0; i <= steps; i++) {
      const t = start + timeStep * i;
      
      // On the last step, align exactly with current true probability
      if (i === steps) {
        currentVal = currentProbA * 100;
      } else {
        // Interpolate towards target + some noise
        const progress = i / steps;
        const targetHere = 50 + (currentProbA * 100 - 50) * progress;
        const noise = (Math.random() - 0.5) * 15 * (1 - progress); // less noise towards end
        currentVal = Math.max(1, Math.min(99, targetHere + noise));
      }

      points.push({
        time: t,
        probA: currentVal,
        formattedTime: format(new Date(t), "dd MMM HH:mm", { locale: es }),
      });
    }
    return points;
  }, [history, currentProbA, startDate]);

  const winningColor = currentProbA >= 0.5 ? colorA : colorB;
  const gradientId = `colorProb_${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div style={{ width: "100%", height, WebkitTapHighlightColor: 'transparent', userSelect: 'none' }} className="relative group outline-none focus:outline-none">
      <ResponsiveContainer width="100%" height="100%" className="outline-none" style={{ outline: 'none' }}>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} className="outline-none focus:outline-none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={winningColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={winningColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {showAxes && (
            <XAxis 
              dataKey="formattedTime" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
              minTickGap={40}
              dy={10}
            />
          )}
          {showAxes && (
            <YAxis 
              domain={[0, 100]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
              tickFormatter={(val) => `${val}¢`}
              width={35}
              orientation="right"
              dx={10}
            />
          )}
          
          <Tooltip 
            cursor={{ stroke: '#334155', strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const val = payload[0].value as number;
                return (
                  <div className="bg-[#1e293b]/95 backdrop-blur-md border border-slate-700/50 p-3 rounded-xl shadow-2xl">
                    <p className="text-[11px] text-slate-400 font-medium mb-1.5">{payload[0].payload.formattedTime}</p>
                    <div className="flex items-baseline gap-2">
                       <p className="font-black text-2xl tracking-tight" style={{ color: val >= 50 ? colorA : colorB }}>
                         {val.toFixed(0)}¢
                       </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          
          {/* Main probability line */}
          <Area 
            type="linear" 
            dataKey="probA" 
            stroke={winningColor} 
            strokeWidth={2}
            fillOpacity={1} 
            fill={`url(#${gradientId})`} 
            animationDuration={1000}
            activeDot={{ r: 4, fill: '#fff', stroke: winningColor, strokeWidth: 2, className: "shadow-lg" }}
          />

          {/* 50% Reference line */}
          <ReferenceLine y={50} stroke="#475569" strokeDasharray="4 4" opacity={0.4} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
