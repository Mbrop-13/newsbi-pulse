"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Loader2,
  MousePointer2,
  Keyboard,
  Eye,
  ArrowUpRight,
  CheckCircle2,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface BrowserStep {
  action: string; // "navigate" | "click" | "type" | "scroll" | "screenshot" | "extract"
  description: string;
  timestamp: Date;
  status: "running" | "done" | "error";
}

interface VirtualBrowserCardProps {
  sessionId?: string;
  currentUrl?: string;
  screenshotBase64?: string;
  steps?: BrowserStep[];
  isActive?: boolean;
  extractedContent?: string;
}

const ACTION_ICONS: Record<string, any> = {
  navigate: Globe,
  click: MousePointer2,
  type: Keyboard,
  scroll: ArrowUpRight,
  screenshot: Eye,
  extract: Eye,
};

export function VirtualBrowserCard({
  sessionId,
  currentUrl = "",
  screenshotBase64,
  steps = [],
  isActive = false,
  extractedContent,
}: VirtualBrowserCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSteps, setShowSteps] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // SSE connection for live streaming
  const [liveFrame, setLiveFrame] = useState<string | null>(null);
  const [liveUrl, setLiveUrl] = useState(currentUrl);
  const [liveSteps, setLiveSteps] = useState<BrowserStep[]>(steps);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId || !isActive) return;

    const es = new EventSource(`/api/browser/stream?sessionId=${sessionId}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "frame") {
          setLiveFrame(data.image);
          setImageLoaded(true);
        } else if (data.type === "url") {
          setLiveUrl(data.url);
        } else if (data.type === "step") {
          setLiveSteps((prev) => [
            ...prev,
            {
              action: data.action,
              description: data.description,
              timestamp: new Date(),
              status: data.status || "done",
            },
          ]);
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [sessionId, isActive]);

  // Use live frame or static screenshot
  const displayFrame = liveFrame || screenshotBase64;
  const displayUrl = liveUrl || currentUrl;
  const displaySteps = liveSteps.length > 0 ? liveSteps : steps;

  const hostname = (() => {
    try {
      return new URL(displayUrl).hostname;
    } catch {
      return displayUrl || "navegando...";
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 24, stiffness: 260 }}
      className={`w-full rounded-2xl overflow-hidden border transition-all duration-300 ${
        expanded
          ? "max-w-4xl border-[#1890FF]/30 shadow-2xl shadow-[#1890FF]/10"
          : "max-w-2xl border-gray-200 dark:border-white/10 shadow-lg"
      } bg-white dark:bg-[#0F1117]`}
    >
      {/* ─── Browser Chrome Bar ─── */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-[#111827] border-b border-gray-100 dark:border-white/5">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400 dark:bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-amber-400 dark:bg-amber-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-400 dark:bg-green-500/70" />
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-0.5 ml-1 shrink-0">
          <button className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${isActive ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* URL Bar */}
        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#0a0e17] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 min-w-0">
          <Shield className="w-3.5 h-3.5 text-green-500 shrink-0" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
            {hostname}
          </span>
          {isActive && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="ml-auto"
            >
              <Loader2 className="w-3 h-3 text-[#1890FF] animate-spin" />
            </motion.div>
          )}
        </div>

        {/* Expand / Collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors shrink-0"
        >
          {expanded ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* ─── Browser Viewport ─── */}
      <div
        className={`relative bg-gray-100 dark:bg-[#0a0a0a] overflow-hidden transition-all duration-300 ${
          expanded ? "aspect-[16/10]" : "aspect-[16/9] max-h-[400px]"
        }`}
      >
        {displayFrame ? (
          <img
            ref={imgRef}
            src={
              displayFrame.startsWith("data:")
                ? displayFrame
                : `data:image/jpeg;base64,${displayFrame}`
            }
            alt="Pantalla del navegador virtual"
            className="w-full h-full object-cover object-top"
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          /* Placeholder when no frame is available */
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Globe className="w-12 h-12 text-gray-300 dark:text-gray-700" />
            </motion.div>
            <p className="text-sm font-semibold text-gray-400 dark:text-gray-600">
              {isActive
                ? "Iniciando navegador virtual..."
                : "El agente navegará aquí"}
            </p>
            {isActive && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-[#1890FF] animate-spin" />
                <span className="text-xs text-[#1890FF] font-medium">
                  Conectando...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Live indicator */}
        {isActive && displayFrame && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-2 h-2 bg-red-500 rounded-full"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              En vivo
            </span>
          </div>
        )}
      </div>

      {/* ─── Step Log ─── */}
      {displaySteps.length > 0 && (
        <div className="border-t border-gray-100 dark:border-white/5">
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {displaySteps.length} acción{displaySteps.length !== 1 ? "es" : ""} del agente
            </span>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showSteps ? "rotate-90" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {showSteps && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {displaySteps.map((step, i) => {
                    const Icon = ACTION_ICONS[step.action] || Globe;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 py-1.5 text-xs"
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                            step.status === "running"
                              ? "bg-[#1890FF]/10 text-[#1890FF]"
                              : step.status === "error"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-green-500/10 text-green-500"
                          }`}
                        >
                          {step.status === "running" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : step.status === "error" ? (
                            <X className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {step.description}
                          </span>
                        </div>
                        <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Extracted Content Preview ─── */}
      {extractedContent && (
        <div className="border-t border-gray-100 dark:border-white/5 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
            Contenido extraído
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4">
            {extractedContent}
          </p>
        </div>
      )}
    </motion.div>
  );
}
