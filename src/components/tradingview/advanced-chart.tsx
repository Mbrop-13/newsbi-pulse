"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface AdvancedChartProps {
  symbol: string;
  height?: number;
}

export function AdvancedChart({ symbol, height = 500 }: AdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    containerRef.current.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.style.height = "100%";
    wrapper.style.width = "100%";
    wrapper.innerHTML = `<div class="tradingview-widget-container__widget" style="height:calc(100% - 32px);width:100%"></div>`;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "D",
      timezone: "America/Santiago",
      theme: resolvedTheme === "dark" ? "dark" : "light",
      style: "1",
      locale: "es",
      backgroundColor: resolvedTheme === "dark" ? "#1A1A1E" : "#ffffff",
      gridColor: resolvedTheme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
    });

    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);
  }, [mounted, symbol, resolvedTheme]);

  if (!mounted) return <div style={{ height }} className="animate-pulse bg-gray-100 dark:bg-white/5 rounded-2xl" />;

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 bg-white dark:bg-[#1A1A1E] shadow-lg">
      <div ref={containerRef} style={{ height }} />
    </div>
  );
}
