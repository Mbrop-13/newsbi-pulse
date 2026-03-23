"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Globe } from "lucide-react";

interface Source {
  name: string;
  url: string;
}

interface ExpandableSourcesProps {
  sources?: Source[];
}

export function ExpandableSources({ sources = [] }: ExpandableSourcesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  if (!sources || sources.length === 0) return null;

  const getFavicon = (url: string) => {
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
    catch { return `https://www.google.com/s2/favicons?domain=google.com&sz=32`; }
  };

  const visibleSources = sources.slice(0, 3);

  const toggle = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); };
  const openLink = (e: React.MouseEvent, url: string) => { e.preventDefault(); e.stopPropagation(); window.open(url, "_blank"); };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 group/src rounded-full py-0.5 transition-colors"
        title={`${sources.length} fuentes`}
      >
        <div className="flex -space-x-1.5">
          {visibleSources.map((s, i) => (
            <div key={i} className="w-5 h-5 rounded-full bg-background border border-border/60 flex items-center justify-center overflow-hidden shrink-0" style={{ zIndex: 3 - i }}>
              <img src={getFavicon(s.url)} alt="" className="w-3 h-3 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          ))}
        </div>
        <span className="text-[10px] font-medium text-muted-foreground/60 group-hover/src:text-foreground/80 transition-colors">
          {sources.length}
        </span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-0 mb-2 w-60 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden z-50"
          >
            <div className="p-2.5 border-b border-border/30 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#1890FF]" />
              <span className="text-[11px] font-semibold text-foreground/80">{sources.length} fuentes analizadas</span>
            </div>

            <div className="max-h-48 overflow-y-auto p-1 hide-scrollbar">
              {sources.map((source, i) => (
                <button
                  key={i}
                  onClick={(e) => openLink(e, source.url)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-foreground/[0.04] rounded-xl transition-colors group text-left"
                >
                  <div className="w-5 h-5 rounded-lg bg-foreground/[0.04] flex items-center justify-center shrink-0">
                    <img src={getFavicon(source.url)} alt="" className="w-3 h-3 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground/80 truncate group-hover:text-[#1890FF] transition-colors">
                      {source.name}
                    </p>
                    <p className="text-[9px] text-muted-foreground/40 truncate">
                      {source.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                    </p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground/20 group-hover:text-[#1890FF]/50 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
