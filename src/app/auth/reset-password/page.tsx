"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      // Supabase automatically exchanges the token from the URL hash
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsValidSession(true);
      } else {
        // Listen for auth state changes (the token exchange happens asynchronously)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (event === "PASSWORD_RECOVERY") {
              setIsValidSession(true);
            } else if (session) {
              setIsValidSession(true);
            }
          }
        );
        
        // Give it a moment to process the hash
        setTimeout(() => {
          setIsValidSession((prev) => (prev === null ? false : prev));
        }, 3000);

        return () => subscription.unsubscribe();
      }
    };

    checkSession();
  }, [supabase]);

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isStrongEnough = hasMinLength && hasUppercase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isStrongEnough) {
      setError("La contraseña no cumple con los requisitos mínimos de seguridad.");
      return;
    }

    if (!passwordsMatch) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        if (updateError.message.includes("same")) {
          setError("La nueva contraseña debe ser diferente a la anterior.");
        } else {
          setError(updateError.message);
        }
      } else {
        setSuccess(true);
        // Redirect to home after 3 seconds
        setTimeout(() => router.push("/"), 3000);
      }
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Invalid/expired link
  if (isValidSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-editorial text-2xl font-bold mb-3">Enlace expirado o inválido</h1>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            El enlace de recuperación de contraseña ha expirado o ya fue utilizado. 
            Solicita uno nuevo desde la pantalla de inicio de sesión.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl px-8 py-3 shadow-lg shadow-accent/20"
          >
            Volver al Inicio
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[460px]"
      >
        <div className="bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <AnimatePresence mode="wait">
              {success ? (
                /* ─── SUCCESS STATE ─── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="font-editorial text-2xl font-bold mb-2">
                    ¡Contraseña actualizada!
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio en unos segundos.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-green-500 text-sm font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    Cuenta asegurada
                  </div>
                </motion.div>
              ) : (
                /* ─── RESET FORM ─── */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                      <KeyRound className="w-7 h-7 text-accent" />
                    </div>
                    <h2 className="font-editorial text-2xl font-bold mb-1.5">
                      Nueva contraseña
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Crea una contraseña segura para proteger tu cuenta.
                    </p>
                  </div>

                  {/* Error Banner */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold px-4 py-2.5 rounded-lg mb-5 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5 ml-0.5">
                        Nueva contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
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

                    {/* Password Requirements */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                        hasMinLength 
                          ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                          : "bg-secondary/30 border-border/50 text-muted-foreground/60"
                      }`}>
                        {hasMinLength ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current" />}
                        8+ chars
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                        hasUppercase
                          ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                          : "bg-secondary/30 border-border/50 text-muted-foreground/60"
                      }`}>
                        {hasUppercase ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current" />}
                        Mayúscula
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                        hasNumber
                          ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                          : "bg-secondary/30 border-border/50 text-muted-foreground/60"
                      }`}>
                        {hasNumber ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current" />}
                        Número
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5 ml-0.5">
                        Confirmar contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        <Input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`h-11 pl-10 pr-10 bg-secondary/30 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/40 focus-visible:ring-accent/30 focus-visible:border-accent/50 transition-colors ${
                            confirmPassword.length > 0
                              ? passwordsMatch
                                ? "border-green-500/50 focus-visible:border-green-500"
                                : "border-destructive/50 focus-visible:border-destructive"
                              : ""
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && !passwordsMatch && (
                        <p className="text-[10px] text-destructive font-semibold mt-1.5 ml-0.5">
                          Las contraseñas no coinciden
                        </p>
                      )}
                    </div>

                    {/* Submit */}
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold text-sm tracking-wide rounded-xl transition-all duration-200 mt-2 group shadow-lg shadow-accent/20 hover:shadow-accent/30"
                        disabled={loading || !isStrongEnough || !passwordsMatch}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Actualizando...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            Actualizar Contraseña
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Security note */}
        <p className="text-[10px] text-muted-foreground/50 text-center mt-4 leading-relaxed">
          🔒 Conexión segura • Tu contraseña está protegida con cifrado de última generación.
        </p>
      </motion.div>
    </div>
  );
}
