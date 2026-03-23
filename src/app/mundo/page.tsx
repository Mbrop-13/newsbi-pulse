"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Globe must be dynamically imported with SSR disabled because it relies on window/document.
const GlobeMundo = dynamic(
  () => import("@/components/globe-mundo").then((mod) => mod.GlobeMundo),
  { ssr: false, loading: () => <GlobeFallback /> }
);

function GlobeFallback() {
  return (
    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-500">
      <div className="w-16 h-16 border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-6" />
      <p className="font-editorial text-lg text-slate-800 tracking-widest uppercase mb-2">
        Iniciando Motor Mapbox...
      </p>
      <p className="text-xs tracking-wide">Cargando mapas y datos de eventos en vivo</p>
    </div>
  );
}

export default function MundoPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full h-[100dvh] bg-slate-100 text-slate-900 overflow-hidden relative">
      <div className="absolute inset-0">
        {mounted ? <GlobeMundo /> : <GlobeFallback />}
      </div>
    </div>
  );
}
