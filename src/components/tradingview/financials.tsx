"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

export function Financials({ symbol }: { symbol: string }) {
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
    wrapper.innerHTML = `<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>`;

    const isDark = resolvedTheme === "dark";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-financials.js";
    script.async = true;
    script.textContent = JSON.stringify({
      colorTheme: isDark ? "dark" : "light",
      isTransparent: true,
      largeChartUrl: "",
      displayMode: "regular",
      width: "100%",
      height: 550,
      symbol: symbol,
      locale: "es"
    });

    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);
  }, [mounted, symbol, resolvedTheme]);

  if (!mounted) return <div className="h-[550px] animate-pulse bg-gray-100 dark:bg-white/5 rounded-2xl w-full" />;

  return (
    <div className="w-full bg-white dark:bg-[#1A1A1E] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden p-2">
      <div ref={containerRef} className="h-[550px]" />
    </div>
  );
}
