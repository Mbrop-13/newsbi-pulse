"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface SymbolInfoProps {
  symbol: string;
  width?: string;
}

export function SymbolInfo({ symbol }: SymbolInfoProps) {
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
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js";
    script.async = true;
    script.textContent = JSON.stringify({
      symbol: symbol,
      width: "100%",
      locale: "es",
      colorTheme: resolvedTheme === "dark" ? "dark" : "light",
      isTransparent: true,
    });

    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);
  }, [mounted, symbol, resolvedTheme]);

  if (!mounted) return <div className="h-[180px] animate-pulse bg-gray-100 dark:bg-white/5 rounded-2xl" />;

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 bg-white dark:bg-[#1A1A1E] shadow-sm">
      <div ref={containerRef} />
    </div>
  );
}
