"use client"

import { useState } from "react"
import { Eye, Code2, Copy, Sparkles, Check } from "lucide-react"
import { toast } from "sonner"

interface UseCasePreviewProps {
  code: string
  title: string
  type?: 'html' | 'react' | 'iframe'
}

export function UseCasePreview({ code, title, type = 'html' }: UseCasePreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success("Código copiado al portapapeles")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full border border-slate-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden bg-[#FAF9F5] dark:bg-zinc-950/20 shadow-md text-left mt-10">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/60">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-500/10 text-[#1890FF]">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{title}</h4>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Generado en una sola petición por Maverlang AI
            </span>
          </div>
        </div>

        {/* Tab triggers & copy */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl flex items-center gap-1 border border-slate-200/40 dark:border-zinc-800/40">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-zinc-950 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Vista Previa
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-white dark:bg-zinc-950 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Código
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-650 dark:text-zinc-400 transition-all cursor-pointer"
            title="Copiar código"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Screen container */}
      <div className="relative min-h-[480px] max-h-[640px] w-full bg-white dark:bg-zinc-950/80">
        {activeTab === 'preview' ? (
          <iframe
            srcDoc={code}
            title={title}
            className="w-full h-[480px] border-none bg-white"
            sandbox="allow-scripts"
          />
        ) : (
          <pre className="w-full h-[480px] overflow-auto p-5 font-mono text-xs text-slate-800 dark:text-zinc-350 bg-[#0d1117] dark:bg-zinc-950 border-none leading-relaxed select-text">
            <code>{code}</code>
          </pre>
        )}
      </div>

      {/* Notification banner */}
      <div className="p-3 bg-blue-500/5 border-t border-slate-200/80 dark:border-zinc-800/80 text-center">
        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
          * Este código y diseño fue generado de forma autónoma con una única instrucción de prompt. Puedes reemplazar este código en tu copia local.
        </p>
      </div>
    </div>
  )
}
