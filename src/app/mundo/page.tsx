"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SidebarLayout } from "@/components/sidebar/sidebar-layout";

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
    <SidebarLayout>
    <div className="w-full h-[calc(100dvh)] bg-slate-100 text-slate-900 overflow-hidden relative">
      <div className="absolute inset-0">
        {mounted ? <GlobeMundo /> : <GlobeFallback />}
      </div>
      
      {/* Mobile Back Button */}
      <Link 
        href="/home" 
        className="md:hidden absolute top-4 left-4 z-50 flex items-center justify-center w-10 h-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full shadow-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:text-[#1890FF] transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
    </div>
    </SidebarLayout>
  );
}
