"use client"

import { useState } from "react"
import { Eye, Code2, Copy, Sparkles, Check, Monitor, Smartphone, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface UseCasePreviewProps {
  code: string
  title: string
  type?: 'html' | 'react' | 'iframe'
  previewCode?: string
  deviceType?: 'desktop' | 'mobile' | 'multiplatform'
}

export function UseCasePreview({ code, title, type = 'html', previewCode, deviceType = 'desktop' }: UseCasePreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>(
    deviceType === 'mobile' ? 'mobile' : 'desktop'
  )

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success("Código copiado al portapapeles")
    setTimeout(() => setCopied(false), 2000)
  }

  // Safe tab opening using client-side Blobs (100% sandboxed & isolated from the application parent origin)
  const handleOpenNewTab = () => {
    try {
      const blob = new Blob([previewCode || code], { type: "text/html;charset=utf-8" })
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, "_blank", "noopener,noreferrer")
    } catch (e) {
      toast.error("No se pudo abrir la demo en una nueva pestaña")
    }
  }

  // Client-side syntax highlighter optimized for light theme (GitHub Light Style)
  const highlightCode = (rawCode: string) => {
    let escaped = rawCode
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Comment highlight (slate-400)
    escaped = escaped.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-slate-400 italic">$1</span>');
    escaped = escaped.replace(/(\/\/.*)/g, '<span class="text-slate-400 italic">$1</span>');

    // String highlight (emerald-650)
    escaped = escaped.replace(/(["'`])(.*?)\1/g, '<span class="text-emerald-600 font-medium">"$2"</span>');

    // HTML Tag highlight (indigo-600)
    escaped = escaped.replace(/&lt;(\/?[a-zA-Z0-9:-]+)(\s|&gt;)/g, '&lt;<span class="text-indigo-600 font-bold">$1</span>$2');

    // JS/TS Keywords highlight (pink-600)
    const keywords = ['const', 'let', 'var', 'function', 'return', 'import', 'export', 'from', 'default', 'class', 'extends', 'if', 'else', 'for', 'while', 'new', 'interface', 'type'];
    keywords.forEach(kw => {
      const reg = new RegExp(`\\b(${kw})\\b`, 'g');
      escaped = escaped.replace(reg, '<span class="text-pink-600 font-bold">$1</span>');
    });

    return escaped;
  }

  const codeLines = code.split('\n');

  return (
    <div className="w-full border border-slate-200/80 rounded-3xl overflow-hidden bg-[#FAF9F5] shadow-xs text-left mt-10">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-200/80 bg-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-650">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">{title}</h4>
            <span className="text-[10px] font-semibold text-emerald-600">
              Generado de forma autónoma con Maverlang AI
            </span>
          </div>
        </div>

        {/* Device Controls, Tab Triggers & Copy Action */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Multiplatform Device Mode Selectors */}
          {deviceType === 'multiplatform' && activeTab === 'preview' && (
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/40">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all cursor-pointer ${
                  deviceMode === 'desktop'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista Escritorio"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Escritorio</span>
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all cursor-pointer ${
                  deviceMode === 'mobile'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista Móvil"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Celular</span>
              </button>
            </div>
          )}

          {/* Tab Selection */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/40">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Vista Previa
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Código
            </button>
          </div>

          {/* Safe External Fullscreen Link Button */}
          {activeTab === 'preview' && (
            <button
              onClick={handleOpenNewTab}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-650 transition-all cursor-pointer"
              title="Abrir a pantalla completa (Pestaña nueva)"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}

          {/* Copy Code */}
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-650 transition-all cursor-pointer"
            title="Copiar código"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Screen container */}
      <div className="relative w-full bg-white">
        {activeTab === 'preview' ? (
          deviceMode === 'mobile' ? (
            // Mobile Device Wrapper Frame
            <div className="flex justify-center items-center py-8 bg-slate-50/50 w-full min-h-[720px] select-none">
              <div className="relative w-[360px] h-[640px] border-[12px] border-zinc-950 dark:border-zinc-900 rounded-[44px] shadow-2xl overflow-hidden bg-white">
                {/* Simulated Phone Camera / Speaker Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-zinc-950 dark:bg-zinc-900 rounded-full z-30 pointer-events-none flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-zinc-800/80 absolute right-3" />
                  <div className="w-10 h-1 bg-zinc-800/40 rounded-full" />
                </div>
                
                {/* Mobile Preview Frame */}
                <iframe
                  srcDoc={previewCode || code}
                  title={title}
                  className="w-full h-full border-none bg-white relative z-25"
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          ) : (
            // Desktop Preview Frame
            <iframe
              srcDoc={previewCode || code}
              title={title}
              className="w-full h-[680px] border-none bg-white"
              sandbox="allow-scripts"
            />
          )
        ) : (
          <div className="w-full h-[680px] overflow-auto flex bg-white p-5 font-mono text-xs leading-relaxed select-text border-none">
            {/* Line numbers (slate border) */}
            <div className="text-slate-400 pr-4 border-r border-slate-200/80 text-right select-none min-w-[3rem]">
              {codeLines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* Colored code content */}
            <pre className="pl-4 flex-1 overflow-x-auto text-slate-800">
              <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
            </pre>
          </div>
        )}
      </div>

      {/* Notification banner */}
      <div className="p-3 bg-blue-500/5 border-t border-slate-200/80 text-center">
        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
          * Este código y diseño fue generado de forma autónoma con una única instrucción de prompt. Puedes reemplazar este código en tu copia local.
        </p>
      </div>
    </div>
  )
}
