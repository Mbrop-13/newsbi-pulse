"use client";
 
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { cn } from "@/lib/utils";
 
interface CanvasFileCardProps {
  title: string;
  code: string;
  language: string;
  timestamp?: string;
  stdout?: string;
  output?: string;
  error?: string;
  durationMs?: number;
  success?: boolean;
}
 
export function CanvasFileCard({
  title,
  code,
  language,
  stdout,
  output,
  error,
  durationMs,
  success,
}: CanvasFileCardProps) {
  const openCanvas = useCanvasStore((s) => s.openCanvas);
  const langUpper = language.toUpperCase();
  
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openCanvas({
          title,
          code,
          language,
          stdout,
          output,
          error,
          durationMs,
          success,
        });
      }}
      className={cn(
        "group inline-flex flex-col min-w-[200px] w-fit rounded-[1rem] border border-black/15 bg-white dark:bg-[#16181A] dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 px-3 py-2.5 gap-2 cursor-pointer transition-all duration-200 select-none active:scale-[0.98] shadow-sm hover:shadow text-left"
      )}
      aria-label={`Generar archivo ${title}`}
    >
      {/* SECCIÓN SUPERIOR: Título e Icono */}
      <div className="flex flex-1 w-full items-center gap-3">
        {/* Icono HTML (Código con destellos) */}
        <div className="flex shrink-0 items-center justify-center text-black dark:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="1.333">
            <path fill="currentColor" fillRule="evenodd" d="M13.113 2.266a.936.936 0 0 1 .797 1.057l-2.476 17.614a.936.936 0 0 1-1.854-.26l2.476-17.615a.936.936 0 0 1 1.057-.796M6.811 6.744a.936.936 0 0 1 0 1.324l-3.55 3.55 3.55 3.551a.936.936 0 1 1-1.324 1.324l-4.213-4.212a.936.936 0 0 1 0-1.325l4.213-4.212a.936.936 0 0 1 1.324 0m15.447 4.213c.357.356.365.93.025 1.297a6.05 6.05 0 0 0-2.377-1.001l-3.185-3.185a.936.936 0 1 1 1.324-1.324zm-3.47 10.491a.48.48 0 0 0 .48-.425c.225-1.341.423-2.03.849-2.457.425-.426 1.11-.624 2.445-.849a.485.485 0 0 0 .438-.48.48.48 0 0 0-.44-.48c-1.332-.227-2.018-.425-2.443-.851-.426-.427-.624-1.115-.849-2.455a.48.48 0 0 0-.48-.428.49.49 0 0 0-.481.426c-.226 1.341-.423 2.03-.85 2.457-.424.426-1.108.624-2.44.85a.48.48 0 0 0-.442.481c0 .26.199.448.439.48 1.335.225 2.02.418 2.444.842.426.425.623 1.114.849 2.466.04.24.23.423.482.423" clipRule="evenodd"></path>
          </svg>
        </div> 
        {/* Texto del Título */}
        <div className="flex flex-col shrink truncate">
          <span className="font-bold text-[14px] text-black dark:text-white tracking-wide">{langUpper}</span>
        </div>
      </div> 

      {/* LÍNEA SEPARADORA */}
      <div className="w-full h-[1px] bg-black/10 dark:bg-white/10" aria-hidden="true"></div>

      {/* SECCIÓN INFERIOR: Subtítulo y Acción */}
      <div className="flex items-center gap-1.5 pt-0.5 pb-0.5">
        {/* Icono Circular */}
        <div className="flex shrink-0 items-center justify-center text-black/40 dark:text-white/40 group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" className="w-3.5 h-3.5" strokeWidth="1.5">
            <path fill="currentColor" d="M12 1.25c5.937 0 10.75 4.813 10.75 10.75S17.937 22.75 12 22.75 1.25 17.937 1.25 12 6.063 1.25 12 1.25m0 2a8.75 8.75 0 1 0 0 17.5 8.75 8.75 0 0 0 0-17.5m0 3.25a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11"></path>
          </svg>
        </div>
        {/* Texto Descriptivo */}
        <span className="text-[13px] font-medium text-black/50 dark:text-white/50 group-hover:text-black/70 dark:group-hover:text-white/70 transition-colors">
          Generar {title}
        </span>
      </div>
    </button>
  );
}
