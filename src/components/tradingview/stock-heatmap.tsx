"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface StockHeatmapProps {
  exchange?: string;
  height?: number;
}

export function StockHeatmap({ exchange = "US", height = 500 }: StockHeatmapProps) {
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
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
    script.async = true;
    script.textContent = JSON.stringify({
      exchanges: [],
      dataSource: "SPX500",
      grouping: "sector",
      blockSize: "market_cap_basic",
      blockColor: "change",
      locale: "es",
      symbolUrl: "",
      colorTheme: resolvedTheme === "dark" ? "dark" : "light",
      hasTopBar: true,
      isDataSetEnabled: true,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: "100%",
      height: "100%",
    });

    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);
  }, [mounted, resolvedTheme, exchange]);

  if (!mounted) return <div style={{ height }} className="animate-pulse bg-gray-100 dark:bg-white/5 rounded-2xl" />;

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 bg-white dark:bg-[#1A1A1E] shadow-sm">
      <div ref={containerRef} style={{ height }} />
    </div>
  );
}
