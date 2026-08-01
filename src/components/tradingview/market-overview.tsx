"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useTheme } from "next-themes";

interface SymbolOverviewProps {
  symbols: [string, string][]; // [["Display Name", "EXCHANGE:SYMBOL|1D"], ...]
  height?: number;
}

/* ── Pre-built symbol sets ── */
export const CHILE_SYMBOLS: [string, string][] = [
  ["IPSA", "BCS:SP_IPSA|1D"],
  ["USD/CLP", "FX:USDCLP|1D"],
  ["Cobre", "CAPITALCOM:COPPER|1D"],
  ["SQM", "NYSE:SQM|1D"],
  ["Falabella", "BCS:FALABELLA|1D"],
  ["Copec", "BCS:COPEC|1D"],
  ["Cencosud", "BCS:CENCOSUD|1D"],
  ["Enel Chile", "BCS:ENELCHILE|1D"],
];

export const GLOBAL_SYMBOLS: [string, string][] = [
  ["S&P 500", "FOREXCOM:SPXUSD|1D"],
  ["Nasdaq", "FOREXCOM:NSXUSD|1D"],
  ["Dow Jones", "FOREXCOM:DJI|1D"],
  ["Bitcoin", "BITSTAMP:BTCUSD|1D"],
  ["Ethereum", "BITSTAMP:ETHUSD|1D"],
  ["EUR/USD", "FX:EURUSD|1D"],
  ["Oro", "OANDA:XAUUSD|1D"],
  ["Petróleo", "NYMEX:CL1!|1D"],
];

export const TENDENCIA_SYMBOLS: [string, string][] = [
  ["S&P 500", "FOREXCOM:SPXUSD|1D"],
  ["Nasdaq", "FOREXCOM:NSXUSD|1D"],
  ["Bitcoin", "BITSTAMP:BTCUSD|1D"],
  ["IPSA", "BCS:SP_IPSA|1D"],
  ["Oro", "OANDA:XAUUSD|1D"],
  ["Cobre", "CAPITALCOM:COPPER|1D"],
];

export function SymbolOverview({ symbols, height = 500 }: SymbolOverviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const symbolsKey = useMemo(() => JSON.stringify(symbols), [symbols]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !containerRef.current || !resolvedTheme) return;

    const el = containerRef.current;
    el.innerHTML = "";

    const isDark = resolvedTheme === "dark";
    let cancelled = false;

    // Defer script inject so DOM is stable after tab switches
    const timer = window.setTimeout(() => {
      if (cancelled || !containerRef.current) return;

      const wrapper = document.createElement("div");
      wrapper.className = "tradingview-widget-container";
      wrapper.style.width = "100%";
      wrapper.style.height = "100%";
      const widgetDiv = document.createElement("div");
      widgetDiv.className = "tradingview-widget-container__widget";
      widgetDiv.style.width = "100%";
      widgetDiv.style.height = "100%";
      wrapper.appendChild(widgetDiv);

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
      script.async = true;
      script.innerHTML = JSON.stringify({
        lineWidth: 2,
        lineType: 0,
        chartType: "area",
        fontColor: isDark ? "rgb(180, 183, 195)" : "rgb(106, 109, 120)",
        gridLineColor: isDark ? "rgba(242, 242, 242, 0.06)" : "rgba(46, 46, 46, 0.06)",
        volumeUpColor: "rgba(34, 171, 148, 0.5)",
        volumeDownColor: "rgba(247, 82, 95, 0.5)",
        backgroundColor: isDark ? "#1A1A1E" : "#ffffff",
        widgetFontColor: isDark ? "#DBDBDB" : "#0F0F0F",
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
        symbols: JSON.parse(symbolsKey) as [string, string][],
        dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
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

      wrapper.appendChild(script);
      containerRef.current.appendChild(wrapper);
    }, 50);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (el) el.innerHTML = "";
    };
  }, [mounted, symbolsKey, resolvedTheme]);

  if (!mounted || !resolvedTheme) {
    return <div style={{ height }} className="animate-pulse bg-gray-100 dark:bg-white/5 rounded-2xl" />;
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 shadow-sm bg-white dark:bg-[#1A1A1E]">
      <div ref={containerRef} style={{ height, width: "100%" }} />
    </div>
  );
}
