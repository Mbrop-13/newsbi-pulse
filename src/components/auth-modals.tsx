"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Github,
  Chrome,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  Newspaper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createClient } from "@/lib/supabase/client";

interface AuthModalsProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: "login" | "register";
}

export function AuthModals({
  isOpen,
  onClose,
  defaultView = "login",
}: AuthModalsProps) {
  const [view, setView] = useState<"login" | "register">(defaultView);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    try {
      if (view === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0066FF&color=fff&bold=true`,
            },
          },
        });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        onClose();
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[460px] overflow-hidden rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ───── Top Decorative Banner ───── */}
            <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#0052CC] via-[#0066FF] to-[#22D3EE]">
              {/* Animated grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)`,
                  backgroundSize: "32px 32px",
                }}
              />
              {/* Floating orbs */}
              <motion.div
                animate={{ y: [-8, 8, -8], x: [-4, 4, -4] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-6 right-8 w-20 h-20 rounded-full bg-white/10 blur-xl"
              />
              <motion.div
                animate={{ y: [6, -6, 6], x: [3, -3, 3] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-2 left-12 w-28 h-28 rounded-full bg-cyan-300/10 blur-2xl"
              />
              {/* Logo / Icon */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                  className="w-16 h-16 rounded-2xl bg-background border-4 border-background shadow-xl flex items-center justify-center"
                >
                  <Newspaper className="w-7 h-7 text-accent" />
                </motion.div>
              </div>
              {/* Tagline */}
              <div className="absolute top-5 left-6">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                  NewsBI Pulse
                </p>
              </div>
            </div>

            {/* ───── Form Body ───── */}
            <div className="bg-background pt-12 pb-8 px-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, x: view === "login" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: view === "login" ? 20 : -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Title */}
                  <div className="text-center mb-6">
                    <h2 className="font-editorial text-2xl font-bold mb-1.5">
                      {view === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {view === "login"
                        ? "Ingresa a tu plataforma de noticias premium."
                        : "Únete a la comunidad de noticias IA."}
                    </p>
                  </div>

                  {/* Error Banner */}
                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold px-4 py-2.5 rounded-lg mb-5 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse flex-shrink-0" />
                        {errorMsg}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Social Login Buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <Button
                      type="button"
                      onClick={signInWithGoogle}
                      variant="outline"
                      className="h-11 border-border/80 text-[13px] font-semibold gap-2.5 rounded-xl hover:bg-secondary/60 transition-all duration-200 hover:border-border"
                    >
                      <Chrome className="w-4 h-4" />
                      Google
                    </Button>
                    <Button
                      type="button"
                      disabled
                      variant="outline"
                      className="h-11 border-border/80 text-[13px] font-semibold gap-2.5 rounded-xl"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/60" />
                    </div>
                    <div className="relative flex justify-center text-[11px]">
                      <span className="bg-background px-3 text-muted-foreground font-medium">
                        o con correo electrónico
                      </span>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {view === "register" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5 ml-0.5">
                          Nombre completo
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                          <Input
                            name="fullName"
                            placeholder="Manuel Valdés"
                            className="h-11 pl-10 bg-secondary/30 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/40 focus-visible:ring-accent/30 focus-visible:border-accent/50 transition-colors"
                            required
                          />
                        </div>
                      </motion.div>
                    )}

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5 ml-0.5">
                        Correo electrónico
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        <Input
                          type="email"
                          name="email"
                          placeholder="name@company.com"
                          className="h-11 pl-10 bg-secondary/30 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/40 focus-visible:ring-accent/30 focus-visible:border-accent/50 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5 ml-0.5">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Contraseña
                        </label>
                        {view === "login" && (
                          <button
                            type="button"
                            className="text-[11px] font-semibold text-accent hover:text-accent/80 transition-colors"
                          >
                            ¿Olvidaste tu clave?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="••••••••"
                          className="h-11 pl-10 pr-10 bg-secondary/30 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/40 focus-visible:ring-accent/30 focus-visible:border-accent/50 transition-colors"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold text-sm tracking-wide rounded-xl transition-all duration-200 mt-2 group shadow-lg shadow-accent/20 hover:shadow-accent/30"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Procesando...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {view === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </form>

                  {/* Toggle view */}
                  <div className="mt-6 text-center text-[13px]">
                    <span className="text-muted-foreground">
                      {view === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
                    </span>{" "}
                    <button
                      onClick={() => {
                        setView(view === "login" ? "register" : "login");
                        setErrorMsg(null);
                      }}
                      className="font-bold text-accent hover:text-accent/80 transition-colors"
                    >
                      {view === "login" ? "Regístrate gratis" : "Inicia Sesión"}
                    </button>
                  </div>

                  {/* Terms */}
                  <p className="text-[10px] text-muted-foreground/60 text-center mt-4 leading-relaxed">
                    Al continuar, aceptas los{" "}
                    <span className="underline cursor-pointer">Términos</span> y la{" "}
                    <span className="underline cursor-pointer">Política de Privacidad</span>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
