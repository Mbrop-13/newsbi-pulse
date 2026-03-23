"use client";

import { motion } from "framer-motion";
import { MOCK_TICKER } from "@/lib/mock-data";

export function LiveTicker() {
  const items = [...MOCK_TICKER, ...MOCK_TICKER];

  return (
    <div className="bg-foreground text-background overflow-hidden">
      <div className="flex items-center">
        {/* Breaking badge */}
        <div className="flex-shrink-0 z-10 bg-live-red px-3 py-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-live" />
          <span className="text-[10px] font-bold text-white tracking-[0.1em] uppercase">
            Urgente
          </span>
        </div>

        {/* Scrolling content */}
        <div className="overflow-hidden flex-1">
          <motion.div
            className="flex items-center gap-8 whitespace-nowrap py-1.5 px-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 40,
                ease: "linear",
              },
            }}
          >
            {items.map((item, i) => (
              <span
                key={`${item.id}-${i}`}
                className="inline-flex items-center gap-2 text-[12px]"
              >
                {item.isLive && (
                  <span className="w-1 h-1 rounded-full bg-live-red animate-pulse-live flex-shrink-0" />
                )}
                <span className="text-background/90">{item.title}</span>
                <span className="text-background/30">|</span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
