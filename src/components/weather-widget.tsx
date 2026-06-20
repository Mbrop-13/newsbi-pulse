"use client";

import { useEffect, useState } from "react";
import { Sun, Cloud, CloudRain, CloudSun, CloudDrizzle } from "lucide-react";

interface HourlyForecast {
  hour: string;
  temp: number;
  icon: React.ComponentType<any>;
}

export function WeatherWidget() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const hourlyData: HourlyForecast[] = [
    { hour: "12:00", temp: 21, icon: Sun },
    { hour: "13:00", temp: 12, icon: CloudSun },
    { hour: "14:00", temp: 13, icon: Cloud },
    { hour: "15:00", temp: 18, icon: CloudDrizzle },
    { hour: "16:00", temp: 16, icon: Cloud },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border p-4.5 flex flex-col gap-4 shadow-sm">
      {/* Current Weather Info */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">12°</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase">F/C</span>
          </div>
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Renca, Santiago</span>
        </div>
        
        <div className="flex flex-col items-end gap-0.5 text-right">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Mayormente nublado</span>
          <span className="text-[11px] font-medium text-muted-foreground">M: 21° B: 7°</span>
        </div>
      </div>

      {/* Hourly forecast row */}
      <div className="grid grid-cols-5 gap-1.5 pt-1.5 border-t border-border/40">
        {hourlyData.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div key={index} className="flex flex-col items-center gap-1.5 text-center">
              <span className="text-[10px] font-bold text-muted-foreground/80">{item.hour}</span>
              <div className="w-7 h-7 rounded-full bg-secondary/50 dark:bg-white/5 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
                <IconComponent className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-white">{item.temp}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
