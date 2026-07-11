"use client"

import { useState } from "react"
import { Sparkles, Copy, Check } from "lucide-react"

interface UseCasePromptProps {
  promptText: string
}

export function UseCasePrompt({ promptText }: UseCasePromptProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="w-full bg-[#070a13] border border-zinc-800 rounded-3xl p-6 md:p-8 text-left relative overflow-hidden mt-12 shadow-xl">
      {/* Glow backgrounds */}
      <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Simulated terminal window header */}
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4 mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] opacity-80" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] opacity-80" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] opacity-80" />
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Prompt de Generación Única
          </span>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
            Instrucción enviada a la IA:
          </span>
          
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer select-none active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Prompt</span>
              </>
            )}
          </button>
        </div>

        <p className="text-sm md:text-base text-zinc-100 leading-relaxed font-medium select-text whitespace-pre-wrap font-sans bg-zinc-950/50 p-5 md:p-6 rounded-2xl border border-zinc-800/40 shadow-inner">
          {promptText}
        </p>
      </div>
    </div>
  )
}
