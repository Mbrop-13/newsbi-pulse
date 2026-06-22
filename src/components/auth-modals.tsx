"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Chrome,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createClient } from "@/lib/supabase/client";

type AuthView = "login" | "register" | "forgot" | "verify-signup" | "verify-forgot" | "new-password";

interface AuthModalsProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: "login" | "register" | "forgot";
}

export function AuthModals({
  isOpen,
  onClose,
  defaultView = "login",
}: AuthModalsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<AuthView>(defaultView === "forgot" ? "forgot" : defaultView);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // State for forms
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countdown, setCountdown] = useState(0);

  const login = useAuthStore((state) => state.login);
  const supabase = createClient();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setView(defaultView === "forgot" ? "forgot" : defaultView);
      setErrorMsg(null);
      setSuccessMsg(null);
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
      setCountdown(0);
    }
  }, [isOpen, defaultView]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const formEmail = formData.get("email") as string;
    const formPassword = formData.get("password") as string;
    const formFullName = formData.get("fullName") as string;
    
    if (formEmail) setEmail(formEmail);

    try {
      if (view === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formEmail,
          password: formPassword,
        });
        if (error) {
          if (error.message === "Email not confirmed") {
            setErrorMsg("Tu correo electrónico aún no ha sido confirmado.");
          } else if (error.message === "Invalid login credentials") {
            setErrorMsg("Correo o contraseña incorrectos.");
          } else {
            setErrorMsg(error.message);
          }
          return;
        }
        if (data.user) {
          login({
            id: data.user.id,
            email: data.user.email || "",
            name: data.user.user_metadata?.full_name || "Usuario",
            avatar: data.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=U&background=1890FF&color=fff`,
          });
        }
        onClose();
        // Tras login: si venía de la landing de marketing (/home), llevarlo al chat (/).
        // Si ya está en / (el chat), no forzar navegación.
        if (pathname === "/home") {
          router.push("/");
        }
      } else if (view === "register") {
        const { error } = await supabase.auth.signUp({
          email: formEmail,
          password: formPassword,
          options: {
            data: {
              full_name: formFullName,
              avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(formFullName)}&background=1890FF&color=fff`,
            },
          },
        });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        // Change view to OTP verification
        setOtpCode("");
        setView("verify-signup");
        setCountdown(300); // 5 minutes
        setSuccessMsg("Código enviado a tu correo. Por favor ingresalo abajo.");
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const formEmail = formData.get("email") as string;

    if (!formEmail) {
      setErrorMsg("Por favor ingresa tu correo electrónico.");
      setLoading(false);
      return;
    }
    
    setEmail(formEmail);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formEmail);

      if (error && error.message.includes("rate")) {
        setErrorMsg("Has enviado demasiadas solicitudes. Intenta de nuevo en unos minutos.");
      } else {
        // Change view to OTP verification for password recovery
        setOtpCode("");
        setView("verify-forgot");
        setCountdown(300); // 5 minutes
        setSuccessMsg("Código de recuperación enviado a tu correo.");
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (view === "verify-signup") {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email
        });
        if (error) throw error;
      } else if (view === "verify-forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
      }
      setCountdown(300); // 5 minutes
      setSuccessMsg("Código reenviado exitosamente.");
    } catch (err: any) {
      if (err?.message?.includes("rate")) {
        setErrorMsg("Demasiados intentos. Por favor espera unos minutos.");
      } else {
        setErrorMsg("Error al reenviar el código. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup'
      });

      if (error) {
        setErrorMsg(error.message === "Token has expired or is invalid" 
          ? "Código inválido o expirado. (Si pediste varios, usa el último que te llegó)" 
          : error.message);
        return;
      }

      if (data.user && data.session) {
        login({
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.user_metadata?.full_name || "Usuario",
          avatar: data.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=U&background=1890FF&color=fff`,
        });
        onClose();
        // Tras registro verificado: si venía de /home, llevarlo al chat (/).
        if (pathname === "/home") {
          router.push("/");
        }
      } else {
        // Sometimes session is not immediately returned depending on settings
        setView("login");
        setSuccessMsg("Cuenta verificada exitosamente. Ahora puedes iniciar sesión.");
      }
    } catch {
      setErrorMsg("Error al verificar el código.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'recovery'
      });

      if (error) {
        setErrorMsg(error.message === "Token has expired or is invalid" 
          ? "Código inválido o expirado. (Si pediste varios, usa el último que te llegó)" 
          : error.message);
        return;
      }

      if (data.session) {
        // OTP valid, user has session, proceed to set new password
        setView("new-password");
        setSuccessMsg("Código verificado correctamente.");
        setNewPassword("");
        setConfirmPassword("");
      } else {
         setErrorMsg("Error de sesión. Intenta iniciar el proceso nuevamente.");
      }
    } catch {
      setErrorMsg("Error al verificar el código.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      // Password updated successfully
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        login({
          id: user.id,
          email: user.email || "",
          name: user.user_metadata?.full_name || "Usuario",
          avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=U&background=1890FF&color=fff`,
        });
      }
      onClose();
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
        queryParams: {
          prompt: 'select_account',
        },
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
            {/* ───── Form Body ───── */}
            <div className="bg-background pt-8 pb-8 px-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, x: (view === "login" || view === "forgot") ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: (view === "login" || view === "forgot") ? 20 : -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* ═══════ FORGOT PASSWORD VIEW ═══════ */}
                  {view === "forgot" && (
                    <div>
                      {/* Title */}
                      <div className="text-center mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                          <KeyRound className="w-7 h-7 text-accent" />
                        </div>
                        <h2 className="font-editorial text-2xl font-bold mb-1.5">
                          Recuperar contraseña
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          Ingresa tu correo y te enviaremos un código para restablecer tu contraseña.
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

                      {/* Email input form */}
                      <form onSubmit={handleForgotPassword} className="space-y-4">
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
                              autoFocus
                            />
                          </div>
                        </div>

                        <motion.div whileTap={{ scale: 0.98 }}>
                          <Button
                            type="submit"
                            className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold text-sm tracking-wide rounded-xl transition-all duration-200 group shadow-lg shadow-accent/20 hover:shadow-accent/30"
                            disabled={loading}
                          >
                            {loading ? (
                              <div className="flex items-center gap-2.5">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Enviando...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Enviar Código de Recuperación
                              </div>
                            )}
                          </Button>
                        </motion.div>
                      </form>

                      {/* Back to login */}
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => { setView("login"); setErrorMsg(null); setSuccessMsg(null); }}
                          className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Volver a Iniciar Sesión
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ═══════ VERIFY OTP VIEWS ═══════ */}
                  {(view === "verify-signup" || view === "verify-forgot") && (
                    <div>
                      {/* Title */}
                      <div className="text-center mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="w-7 h-7 text-accent" />
                        </div>
                        <h2 className="font-editorial text-2xl font-bold mb-1.5">
                          Verifica tu correo
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          Ingresa el código de 6 dígitos que enviamos a<br/>
                          <span className="font-semibold text-foreground">{email}</span>
                        </p>
                      </div>

                      <AnimatePresence>
                        {successMsg && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-xs font-semibold px-4 py-2.5 rounded-lg mb-5 flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                            {successMsg}
                          </motion.div>
                        )}
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

                      <form onSubmit={view === "verify-signup" ? handleVerifySignup : handleVerifyForgot} className="space-y-6">
                        <div className="relative flex justify-center gap-2 sm:gap-3 my-8">
                          {/* Invisible Input for robust mobile support & pasting */}
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                            required
                            autoFocus
                          />
                          
                          {/* 6 Visual Boxes */}
                          {[...Array(6)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-10 h-14 sm:w-12 sm:h-16 flex items-center justify-center text-2xl font-bold font-mono rounded-xl border-2 transition-all duration-200 ${
                                otpCode.length === i 
                                  ? "border-[#1890FF] ring-4 ring-[#1890FF]/20 scale-105 shadow-sm" 
                                  : otpCode[i] 
                                    ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-[#1890FF] dark:text-white scale-100" 
                                    : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-900/50 text-transparent scale-100"
                              }`}
                            >
                              {otpCode[i] || ""}
                              {/* Blinking cursor for the active box */}
                              {otpCode.length === i && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                                  className="w-[2px] h-6 bg-[#1890FF] rounded-full absolute"
                                />
                              )}
                            </div>
                          ))}
                        </div>

                        <motion.div whileTap={{ scale: countdown > 0 || otpCode.length !== 6 ? 1 : 0.98 }}>
                          <Button
                            type="submit"
                            className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold text-sm tracking-wide rounded-xl transition-all duration-200 group shadow-lg shadow-accent/20 hover:shadow-accent/30"
                            disabled={loading || otpCode.length !== 6}
                          >
                            {loading ? (
                              <div className="flex items-center gap-2.5">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Verificando...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                Verificar Código
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            )}
                          </Button>
                        </motion.div>
                      </form>

                      {/* Resend Code Section */}
                      <div className="mt-8 text-center space-y-4">
                        {countdown > 0 ? (
                          <p className="text-sm font-medium text-muted-foreground">
                            Podrás reenviar el código en <span className="font-bold text-foreground">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={loading}
                            className="text-sm font-bold text-accent hover:text-accent/80 transition-colors flex items-center justify-center gap-1.5 mx-auto"
                          >
                            <Mail className="w-4 h-4" />
                            Reenviar código de verificación
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => { setView(view === "verify-signup" ? "register" : "forgot"); setErrorMsg(null); setSuccessMsg(null); setCountdown(0); }}
                          className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto pt-2 border-t border-border/50 w-full justify-center"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Ingresar otro correo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ═══════ NEW PASSWORD VIEW ═══════ */}
                  {view === "new-password" && (
                    <div>
                      <div className="text-center mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                          <Lock className="w-7 h-7 text-accent" />
                        </div>
                        <h2 className="font-editorial text-2xl font-bold mb-1.5">
                          Nueva contraseña
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          Crea una contraseña segura para tu cuenta.
                        </p>
                      </div>

                      <AnimatePresence>
                        {successMsg && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-xs font-semibold px-4 py-2.5 rounded-lg mb-5 flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                            {successMsg}
                          </motion.div>
                        )}
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

                      <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5 ml-0.5">
                            Nueva contraseña
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                              className="h-11 pl-10 pr-10 bg-secondary/30 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/40 focus-visible:ring-accent/30 focus-visible:border-accent/50 transition-colors"
                              required
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5 ml-0.5">
                            Confirmar contraseña
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              className={`h-11 pl-10 pr-10 bg-secondary/30 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/40 focus-visible:ring-accent/30 focus-visible:border-accent/50 transition-colors ${
                                confirmPassword.length > 0
                                  ? newPassword === confirmPassword
                                    ? "border-green-500/50 focus-visible:border-green-500"
                                    : "border-destructive/50 focus-visible:border-destructive"
                                  : ""
                              }`}
                              required
                            />
                          </div>
                        </div>

                        <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
                          <Button
                            type="submit"
                            className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold text-sm tracking-wide rounded-xl transition-all duration-200 group shadow-lg shadow-accent/20 hover:shadow-accent/30"
                            disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                          >
                            {loading ? (
                              <div className="flex items-center gap-2.5">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Actualizando...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                Guardar y Entrar
                              </div>
                            )}
                          </Button>
                        </motion.div>
                      </form>
                    </div>
                  )}

                  {/* ═══════ LOGIN & REGISTER VIEWS ═══════ */}
                  {(view === "login" || view === "register") && (
                  <>
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

                  {/* Success Banner */}
                  <AnimatePresence>
                    {successMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-xs font-semibold px-4 py-2.5 rounded-lg mb-5 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                        {successMsg}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Social Login Buttons */}
                  <div className="mb-5">
                    <Button
                      type="button"
                      onClick={signInWithGoogle}
                      variant="outline"
                      className="w-full h-11 border-border/80 text-[13px] font-semibold gap-2.5 rounded-xl hover:bg-secondary/60 transition-all duration-200 hover:border-border"
                    >
                      <Chrome className="w-4 h-4" />
                      Continuar con Google
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
                            onClick={() => { setView("forgot"); setErrorMsg(null); setSuccessMsg(null); }}
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
                    <Link href="/privacidad" onClick={onClose} className="underline cursor-pointer hover:text-foreground transition-colors">
                      Política de Privacidad
                    </Link>
                  </p>
                  </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
