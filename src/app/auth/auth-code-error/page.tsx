"use client";

import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { useAuthModalStore } from "@/lib/stores/auth-store";

export default function AuthCodeErrorPage() {
  const { openModal } = useAuthModalStore();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">No pudimos completar el acceso</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        El enlace de Google expiró o fue cancelado. Vuelve a intentar iniciar sesión o crea una cuenta con tu correo.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={() => openModal("login")}
          className="group flex items-center justify-center gap-2 bg-black text-white hover:bg-black/90 font-bold text-sm px-6 py-3.5 rounded-xl transition-all cursor-pointer"
        >
          Reintentar
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
        <Link
          href="/"
          className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-3"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
