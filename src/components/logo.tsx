"use client";

import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group" aria-label="NewsBI Pulse Home">
      {/* ProgramBI-style triangle logo */}
      <div className="relative w-9 h-9 flex items-center justify-center">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_8px_rgba(0,161,255,0.4)] group-hover:drop-shadow-[0_0_12px_rgba(0,161,255,0.6)] transition-all duration-300"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00A1FF" />
              <stop offset="50%" stopColor="#33B4FF" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
            <linearGradient id="logoShine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
            </linearGradient>
          </defs>
          {/* Main triangle */}
          <path
            d="M20 4L36 34H4L20 4Z"
            fill="url(#logoGradient)"
            stroke="url(#logoGradient)"
            strokeWidth="0.5"
          />
          {/* Shine overlay */}
          <path
            d="M20 4L36 34H4L20 4Z"
            fill="url(#logoShine)"
          />
          {/* Inner highlight line */}
          <path
            d="M20 10L30 30H10L20 10Z"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.5"
          />
        </svg>
      </div>
      {/* Text */}
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-extrabold tracking-tight gradient-text">
          NEWSBI
        </span>
        <span className="text-[9px] font-medium tracking-[0.25em] text-muted-foreground uppercase">
          Pulse
        </span>
      </div>
    </Link>
  );
}
