"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface TradingViewWidgetProps {
  symbol: string;     // e.g. "NASDAQ:AAPL"
  displayName: string; // e.g. "Apple"
}

export function TradingViewWidget({ symbol, displayName }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";

    const isDark = resolvedTheme === "dark";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container";
    widgetDiv.innerHTML = `<div class="tradingview-widget-container__widget"></div>`;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.async = true;
    script.textContent = JSON.stringify({
      lineWidth: 2,
      lineType: 0,
      chartType: "area",
      fontColor: isDark ? "rgb(180, 183, 195)" : "rgb(106, 109, 120)",
      gridLineColor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(46, 46, 46, 0.06)",
      volumeUpColor: "rgba(34, 171, 148, 0.5)",
      volumeDownColor: "rgba(247, 82, 95, 0.5)",
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      widgetFontColor: isDark ? "#e2e8f0" : "#0F0F0F",
      upColor: "#22ab94",
      downColor: "#f7525f",
      borderUpColor: "#22ab94",
      borderDownColor: "#f7525f",
      wickUpColor: "#22ab94",
      wickDownColor: "#f7525f",
      colorTheme: isDark ? "dark" : "light",
      isTransparent: false,
      locale: "es",
      chartOnly: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      valuesTracking: "1",
      changeMode: "price-and-percent",
      symbols: [[displayName, `${symbol}|1D`]],
      dateRanges: [
        "1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M",
      ],
      fontSize: "10",
      headerFontSize: "medium",
      autosize: true,
      width: "100%",
      height: "100%",
      noTimeScale: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
    });

    widgetDiv.appendChild(script);
    containerRef.current.appendChild(widgetDiv);
  }, [mounted, symbol, displayName, resolvedTheme]);

  if (!mounted) return null;

  return (
    <div className="mb-6 rounded-2xl overflow-hidden border border-border/50 shadow-sm">
      <div ref={containerRef} className="w-full h-[380px]" />
    </div>
  );
}
