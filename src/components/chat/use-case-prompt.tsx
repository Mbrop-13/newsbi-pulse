"use client"

import { useState } from "react"
import { Sparkles, Copy, Check, ChevronDown } from "lucide-react"

interface UseCasePromptProps {
  promptText: string
}

export function UseCasePrompt({ promptText }: UseCasePromptProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent accordion toggle when copying
    navigator.clipboard.writeText(promptText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="w-full bg-[#FAF9F5] border border-slate-200/80 rounded-3xl overflow-hidden mt-12 shadow-xs transition-all duration-300">
      
      {/* Clickable Header Accordion Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-5 md:p-6 cursor-pointer hover:bg-slate-50 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 tracking-tight">Prompt de Generación Única</h4>
            <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider">
              {isOpen ? "Haz clic para contraer" : "Haz clic para ver instrucción a la IA"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isOpen && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[10px] md:text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer select-none active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar Prompt</span>
                </>
              )}
            </button>
          )}
          <div className={`p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Accordion Expandable Content (white bg, dark text) */}
      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[800px] border-t border-slate-200/80 p-5 md:p-6 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
              Instrucción original enviada a la IA:
            </span>
          </div>

          <p className="text-sm md:text-base text-slate-800 leading-relaxed font-medium select-text whitespace-pre-wrap font-sans bg-white p-5 md:p-6 rounded-2xl border border-slate-200/60 shadow-inner">
            {promptText}
          </p>
        </div>
      </div>

    </div>
  )
}
