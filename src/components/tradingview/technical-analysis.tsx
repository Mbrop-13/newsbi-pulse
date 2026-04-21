"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface TechnicalAnalysisProps {
  symbol: string;
  height?: number;
}

export function TechnicalAnalysis({ symbol, height = 425 }: TechnicalAnalysisProps) {
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
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    script.async = true;
    script.textContent = JSON.stringify({
      interval: "1D",
      width: "100%",
      height: "100%",
      isTransparent: true,
      symbol: symbol,
      showIntervalTabs: true,
      displayMode: "single",
      locale: "es",
      colorTheme: resolvedTheme === "dark" ? "dark" : "light",
    });

    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);
  }, [mounted, symbol, resolvedTheme]);

  if (!mounted) return <div style={{ height }} className="animate-pulse bg-gray-100 dark:bg-white/5 rounded-2xl" />;

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 bg-white dark:bg-[#1A1A1E] shadow-sm">
      <div ref={containerRef} style={{ height }} />
    </div>
  );
}
