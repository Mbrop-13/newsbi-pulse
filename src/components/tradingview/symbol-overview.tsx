"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface SymbolOverviewProps {
  symbol: string;
  height?: number | string;
}

export function SymbolOverview({ symbol, height = 550 }: SymbolOverviewProps) {
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

    const isDark = resolvedTheme === "dark";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.async = true;
    script.textContent = JSON.stringify({
      symbols: [[symbol.split(":")[1] || symbol, symbol + "|1D"]],
      chartOnly: false,
      width: "100%",
      height: "100%",
      locale: "es",
      colorTheme: isDark ? "dark" : "light",
      autosize: true,
      showVolume: true,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: "area",
      lineWidth: 2,
      lineType: 0,
      dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
      upColor: "#22ab94",
      downColor: "#f7525f",
      borderUpColor: "#22ab94",
      borderDownColor: "#f7525f",
      wickUpColor: "#22ab94",
      wickDownColor: "#f7525f",
      isTransparent: true,
    });

    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);
  }, [mounted, symbol, resolvedTheme]);

  if (!mounted) return <div style={{ height }} className="animate-pulse bg-gray-100 dark:bg-white/5 rounded-2xl w-full" />;

  return (
    <div className="w-full relative" style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
