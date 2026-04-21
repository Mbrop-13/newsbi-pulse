"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface MiniChartProps {
  symbol: string;
  width?: string;
  height?: number;
  dateRange?: string;
}

export function MiniChart({ symbol, height = 220, dateRange = "12M" }: MiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    containerRef.current.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.innerHTML = `<div class="tradingview-widget-container__widget"></div>`;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.textContent = JSON.stringify({
      symbol: symbol,
      width: "100%",
      height: "100%",
      locale: "es",
      dateRange: dateRange,
      colorTheme: resolvedTheme === "dark" ? "dark" : "light",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      chartOnly: false,
      noTimeScale: false,
    });

    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);
  }, [mounted, symbol, resolvedTheme, dateRange]);

  if (!mounted) return <div style={{ height }} className="animate-pulse bg-gray-100 dark:bg-white/5 rounded-2xl" />;

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 bg-white dark:bg-[#1A1A1E] shadow-sm hover:shadow-lg hover:border-[#1890FF]/20 transition-all">
      <div ref={containerRef} style={{ height }} />
    </div>
  );
}
