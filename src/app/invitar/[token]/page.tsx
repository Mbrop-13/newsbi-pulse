"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { Loader2, CheckCircle2, XCircle, Mail, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function InvitarTokenPage() {
  const params = useParams();
  const router = useRouter();
  const token = (params?.token as string) ?? "";
  const { isAuthenticated, isLoaded, user } = useAuthStore();
  const openModal = useAuthModalStore((s) => s.openModal);

  const [invitation, setInvitation] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "expired" | "accepted">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [emailMismatch, setEmailMismatch] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`/api/empresas/invitations/${token}`, { cache: "no-store" });
        const data = await res.json();
        if (!data.valid) {
          setStatus("invalid");
          setErrorMsg(data.error || "Invitación no válida");
          return;
        }
        setInvitation(data.invitation);
        setOrg(data.organization);
        // Estado inicial basado en respuesta
        if (!data.valid) {
          setStatus("expired");
          setErrorMsg(data.error);
        } else if (data.invitation?.expires_at && new Date(data.invitation.expires_at) < new Date()) {
          setStatus("expired");
          setErrorMsg(data.error || "Esta invitación ha expirado");
        } else {
          setStatus("valid");
        }
      } catch (err) {
        setStatus("invalid");
        setErrorMsg("No se pudo validar la invitación");
      }
    })();
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      openModal("login");
      return;
    }
    setBusy(true);
    setAcceptError(null);
    setEmailMismatch(null);
    try {
      const res = await fetch("/api/empresas/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.expected_email) setEmailMismatch(data.expected_email);
        throw new Error(data.error || "No se pudo aceptar");
      }
      setStatus("accepted");
      if (data.org_id) {
        setTimeout(() => router.push("/empresas/dashboard"), 1500);
      }
    } catch (err: any) {
      setAcceptError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Header */}
      <header className="h-20 flex items-center px-6 md:px-12">
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tighter italic">Maverlang</span>
          <span className="text-[10px] font-extrabold uppercase bg-[#1890FF] text-white px-2 py-0.5 rounded">Empresas</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4 text-white/60">
              <Loader2 className="w-8 h-8 text-[#1890FF] animate-spin" />
              <p className="text-sm">Validando invitación…</p>
            </div>
          )}

          {status === "invalid" && (
            <>
              <XCircle className="w-14 h-14 text-[#f7525f] mx-auto mb-4" />
              <h1 className="text-2xl font-black mb-2">Invitación no válida</h1>
              <p className="text-white/50 text-sm mb-6">{errorMsg}</p>
              <Link href="/home" className="text-sm font-semibold text-[#1890FF] hover:underline">
                Volver al inicio →
              </Link>
            </>
          )}

          {status === "expired" && (
            <>
              <XCircle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-black mb-2">Invitación expirada</h1>
              <p className="text-white/50 text-sm mb-6">
                {errorMsg || "Esta invitación ha expirado."}
                <br />Solicita al propietario de la organización una nueva invitación.
              </p>
              <Link href="/home" className="text-sm font-semibold text-[#1890FF] hover:underline">
                Volver al inicio →
              </Link>
            </>
          )}

          {status === "valid" && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-[#1890FF]/15 flex items-center justify-center mx-auto mb-5">
                {org?.logo_url ? (
                  <img src={org.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <span className="text-2xl font-black text-[#1890FF]">
                    {(org?.name || "?").charAt(0)}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                ¡Te invitaron a unirte!
              </h1>
              <p className="text-white/60 text-lg mb-1">{org?.name || "una organización"}</p>
              <p className="text-white/40 text-sm mb-1">
                Rol: <span className="font-semibold capitalize">
                  {invitation?.role === "owner" ? "Propietario" : invitation?.role === "admin" ? "Administrador" : "Miembro"}
                </span>
              </p>
              <p className="text-white/40 text-sm mb-7 flex items-center justify-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {invitation?.email}
              </p>

              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => openModal("register")}
                    className="w-full bg-[#1890FF] hover:bg-[#0f7be0] text-white font-bold py-3.5 rounded-xl mb-2 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Crear cuenta y aceptar
                  </button>
                  <p className="text-xs text-white/40">
                    ¿Ya tienes cuenta?{" "}
                    <button onClick={() => openModal("login")} className="text-[#1890FF] font-semibold hover:underline">
                      Inicia sesión
                    </button>
                  </p>
                </>
              ) : (
                <>
                  {user?.email && invitation?.email &&
                    user.email.toLowerCase() !== invitation.email.toLowerCase() && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-xs text-amber-300">
                        Estás conectado como <strong>{user.email}</strong>, pero la invitación es para{" "}
                        <strong>{invitation.email}</strong>. Cierra sesión y conéctate con el correo correcto.
                      </div>
                    )}
                  {emailMismatch && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-xs text-red-300">
                      Esta invitación es para <strong>{emailMismatch}</strong>. Inicia sesión con ese correo.
                    </div>
                  )}
                  {acceptError && !emailMismatch && (
                    <p className="text-[#f7525f] text-xs mb-4">{acceptError}</p>
                  )}
                  <button
                    onClick={handleAccept}
                    disabled={busy}
                    className="w-full bg-[#1890FF] hover:bg-[#0f7be0] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {busy ? "Aceptando…" : "Aceptar invitación"}
                  </button>
                </>
              )}
            </>
          )}

          {status === "accepted" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-[#22ab94] mx-auto mb-4" />
              <h1 className="text-2xl font-black mb-2">¡Bienvenido al equipo!</h1>
              <p className="text-white/60 text-sm mb-6">
                Ya eres miembro de {org?.name}. Redirigiéndote al panel…
              </p>
              <Loader2 className="w-6 h-6 text-[#1890FF] animate-spin mx-auto" />
            </>
          )}
        </div>
      </div>
    </main>
  );
}