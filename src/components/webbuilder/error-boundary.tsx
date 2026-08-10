"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  /** Optional: called when user clicks recover */
  onRecover?: () => void;
  label?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Aísla crashes de React (p.ej. #185 Maximum update depth) dentro del
 * workspace Build para que no tumbe toda la página. Ofrece reintentar
 * montando de nuevo el árbol hijo.
 */
export class WebBuilderErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || "Error de renderizado",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[WebBuilderErrorBoundary]", error, info?.componentStack);
  }

  private handleRecover = () => {
    this.setState({ hasError: false, errorMessage: "" });
    try {
      this.props.onRecover?.();
    } catch {
      /* noop */
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 p-8 bg-slate-50 dark:bg-[#0B1120] text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <div className="max-w-sm space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {this.props.label || "El panel de Build se detuvo"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
              Ocurrió un error de interfaz (a veces por actualizaciones muy
              rápidas al generar archivos). Tu código en el proyecto se
              conserva. Podés reintentar el panel o pedir en el chat que
              continúe generando.
            </p>
            {process.env.NODE_ENV === "development" && this.state.errorMessage ? (
              <p className="text-[10px] font-mono text-red-400/80 break-all pt-1">
                {this.state.errorMessage}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={this.handleRecover}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1890FF] hover:bg-[#0d7de0] text-white text-xs font-bold px-4 py-2.5 transition-colors active:scale-[0.98]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reintentar panel
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
