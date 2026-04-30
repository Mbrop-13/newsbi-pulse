"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

export default function TradingViewWidget({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!container.current) return;
    
    // Clean up previous widget if symbol or theme changes
    container.current.innerHTML = "";
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    const widgetTheme = theme === "dark" ? "dark" : "light";
    
    // Try to guess exchange or default to NASDAQ
    // TradingView needs exchange prefix for best results, e.g., NASDAQ:AAPL
    // But it handles plain symbols okay if they are major ones.
    const tvSymbol = symbol.includes(":") ? symbol : `NASDAQ:${symbol}`;

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: widgetTheme,
      style: "1",
      locale: "es",
      enable_publishing: false,
      backgroundColor: widgetTheme === "dark" ? "#0F172A" : "#ffffff", // Match Tailwind slate-900 / white
      gridColor: widgetTheme === "dark" ? "#1e293b" : "#f1f5f9",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      container_id: `tradingview_${symbol}`,
      support_host: "https://www.tradingview.com"
    });

    container.current.appendChild(script);
  }, [symbol, theme]);

  return (
    <div className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
      <div id={`tradingview_${symbol}`} ref={container} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
