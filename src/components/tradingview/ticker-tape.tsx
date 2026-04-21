"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface TickerTapeProps {
  symbols?: { proName: string; title: string }[];
}

const DEFAULT_SYMBOLS = [
  { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
  { proName: "FOREXCOM:NSXUSD", title: "Nasdaq" },
  { proName: "FOREXCOM:DJI", title: "Dow Jones" },
  { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
  { proName: "BITSTAMP:ETHUSD", title: "Ethereum" },
  { proName: "FX:EURUSD", title: "EUR/USD" },
  { proName: "FX:USDCLP", title: "USD/CLP" },
  { proName: "OANDA:XAUUSD", title: "Oro" },
  { proName: "CAPITALCOM:COPPER", title: "Cobre" },
];

export function TickerTape({ symbols = DEFAULT_SYMBOLS }: TickerTapeProps) {
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
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.textContent = JSON.stringify({
      symbols: symbols.map(s => ({ proName: s.proName, title: s.title })),
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: resolvedTheme === "dark" ? "dark" : "light",
      locale: "es",
    });

    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);
  }, [mounted, resolvedTheme, symbols]);

  if (!mounted) return <div className="h-[46px]" />;

  return (
    <div className="w-full overflow-hidden border-b border-gray-200 dark:border-white/5">
      <div ref={containerRef} className="h-[46px]" />
    </div>
  );
}
