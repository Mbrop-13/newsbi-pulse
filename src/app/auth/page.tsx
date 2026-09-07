"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";

type AuthView = "login" | "register" | "forgot";

function parseView(value: string | null): AuthView {
  if (value === "login" || value === "forgot" || value === "register") {
    return value;
  }
  return "register";
}

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoaded } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const view = parseView(searchParams.get("view"));

  useEffect(() => {
    if (!isLoaded) return;
    if (isAuthenticated) {
      router.replace("/");
      return;
    }
    openModal(view);
  }, [isLoaded, isAuthenticated, view, openModal, router]);

  const title =
    view === "login"
      ? "Inicia sesión"
      : view === "forgot"
        ? "Recuperar contraseña"
        : "Crea tu cuenta gratis";
  const cta =
    view === "login"
      ? "Iniciar sesión"
      : view === "forgot"
        ? "Recuperar contraseña"
        : "Comenzar Gratis";

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-white px-6">
      <Logo showText={false} size="lg" forceLight />
      <h1 className="mt-6 text-2xl font-bold text-slate-900 text-center">{title}</h1>
      <p className="mt-2 text-sm text-slate-500 text-center max-w-sm">
        Accede a Maverlang para chatear con IA, seguir mercados y gestionar tu portafolio.
      </p>
      <button
        type="button"
        onClick={() => openModal(view)}
        className="mt-6 group flex items-center justify-center gap-2 bg-black text-white hover:bg-black/90 font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md shadow-black/25 cursor-pointer"
      >
        {cta}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-white">
          <div className="h-8 w-8 rounded-full border-b-2 border-black animate-spin" />
        </div>
      }
    >
      <AuthPageInner />
    </Suspense>
  );
}
