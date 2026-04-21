"use client";

import { useState } from "react";
import { Info, Newspaper } from "lucide-react";

export function AssetTabs({ 
  informacion, 
  noticias 
}: { 
  informacion: React.ReactNode, 
  noticias: React.ReactNode 
}) {
  const [activeTab, setActiveTab] = useState<"info" | "news">("info");

  return (
    <div className="w-full mt-6">
      {/* Selector */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 mb-6 pb-px">
        <button
          onClick={() => setActiveTab("info")}
          className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "info" 
              ? "border-[#1890FF] text-[#1890FF]" 
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Info className="w-4 h-4" />
          Información
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "news" 
              ? "border-[#1890FF] text-[#1890FF]" 
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Newspaper className="w-4 h-4" />
          Noticias
        </button>
      </div>

      {/* Content */}
      <div className="w-full min-h-[500px]">
        {activeTab === "info" ? informacion : noticias}
      </div>
    </div>
  );
}
