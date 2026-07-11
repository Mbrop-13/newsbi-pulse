"use client"

import { useState } from "react"
import { Eye, Code2, Copy, Sparkles, Check } from "lucide-react"
import { toast } from "sonner"

interface UseCasePreviewProps {
  code: string
  title: string
  type?: 'html' | 'react' | 'iframe'
  previewCode?: string
}

export function UseCasePreview({ code, title, type = 'html', previewCode }: UseCasePreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success("Código copiado al portapapeles")
    setTimeout(() => setCopied(false), 2000)
  }

  // Simple client-side syntax highlighter
  const highlightCode = (rawCode: string) => {
    let escaped = rawCode
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Comment highlight
    escaped = escaped.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-zinc-500 italic">$1</span>');
    escaped = escaped.replace(/(\/\/.*)/g, '<span class="text-zinc-500 italic">$1</span>');

    // String highlight
    escaped = escaped.replace(/(["'`])(.*?)\1/g, '<span class="text-emerald-400">"$2"</span>');

    // HTML Tag highlight
    escaped = escaped.replace(/&lt;(\/?[a-zA-Z0-9:-]+)(\s|&gt;)/g, '&lt;<span class="text-blue-400 font-bold">$1</span>$2');

    // JS/TS Keywords highlight
    const keywords = ['const', 'let', 'var', 'function', 'return', 'import', 'export', 'from', 'default', 'class', 'extends', 'if', 'else', 'for', 'while', 'new', 'interface', 'type'];
    keywords.forEach(kw => {
      const reg = new RegExp(`\\b(${kw})\\b`, 'g');
      escaped = escaped.replace(reg, '<span class="text-purple-400 font-bold">$1</span>');
    });

    return escaped;
  }

  const codeLines = code.split('\n');

  return (
    <div className="w-full border border-slate-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden bg-[#FAF9F5] dark:bg-zinc-950/20 shadow-md text-left mt-10">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-500/10 text-[#1890FF]">
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

      {/* Screen container with increased height */}
      <div className="relative min-h-[680px] max-h-[850px] w-full bg-white dark:bg-zinc-950/80">
        {activeTab === 'preview' ? (
          <iframe
            srcDoc={previewCode || code}
            title={title}
            className="w-full h-[680px] border-none bg-white"
            sandbox="allow-scripts"
          />
        ) : (
          <div className="w-full h-[680px] overflow-auto flex bg-[#070b12] dark:bg-zinc-950 p-5 font-mono text-xs leading-relaxed select-text border-none">
            {/* Line numbers */}
            <div className="text-zinc-650 pr-4 border-r border-zinc-800/40 text-right select-none min-w-[3rem]">
              {codeLines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* Colored code content */}
            <pre className="pl-4 flex-1 overflow-x-auto text-zinc-300">
              <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
            </pre>
          </div>
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
