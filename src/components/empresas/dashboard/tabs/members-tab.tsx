"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { OrgRole } from "@/lib/plan-limits";
import { UserPlus, Loader2, Trash2, Mail, X } from "lucide-react";

interface MembersTabProps {
  orgId: string;
  role: OrgRole;
  members: any[];
  invitations: any[];
  loading: boolean;
  seatActiveCount: number;
  seatCount: number;
  onChange: () => void;
}

export function MembersTab({
  orgId,
  role,
  members,
  invitations,
  loading,
  seatActiveCount,
  seatCount,
  onChange,
}: MembersTabProps) {
  const [showInvite, setShowInvite] = useState(false);
  const [busy, setBusy] = useState(false);
  const canManage = role === "owner" || role === "admin";

  const handleChangeRole = async (userId: string, newRole: OrgRole) => {
    setBusy(true);
    try {
      await fetch(`/api/empresas/${orgId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("¿Quitar a este miembro de la organización?")) return;
    setBusy(true);
    try {
      await fetch(`/api/empresas/${orgId}/members/${userId}`, { method: "DELETE" });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (token?: string, email?: string) => {
    const qs = token ? `token=${token}` : email ? `email=${encodeURIComponent(email)}` : "";
    setBusy(true);
    try {
      await fetch(`/api/empresas/${orgId}/invite?${qs}`, { method: "DELETE" });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Miembros</h2>
          <p className="text-sm text-neutral-500 dark:text-zinc-400 mt-1">
            {seatActiveCount} activos · {invitations.length} pendientes · {seatCount} asientos contratados
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            disabled={role === "admin"}
            className="inline-flex items-center gap-2 bg-neutral-950 dark:bg-white text-white dark:text-black text-sm font-bold px-5 py-2.5 rounded-full transition-all hover:gap-3 disabled:opacity-40 disabled:hover:gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invitar
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-neutral-400 dark:text-zinc-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Active members */}
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 rounded-[32px] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-zinc-800">
              <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500 dark:text-zinc-400">Miembros activos</p>
            </div>
            <ul className="divide-y divide-neutral-100 dark:divide-zinc-800">
              {members.filter((m) => m.status === "active").map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-6 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-black overflow-hidden shrink-0">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (m.name || m.email || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{m.name || m.email || "Usuario"}</p>
                    <p className="text-xs text-neutral-500 dark:text-zinc-400 truncate">{m.email ?? m.invited_email ?? "—"}</p>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <select
                        value={m.role}
                        disabled={busy || role === "admin"}
                        onChange={(e) => handleChangeRole(m.user_id, e.target.value as OrgRole)}
                        className="text-xs font-bold rounded-full border border-neutral-200 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800 px-3 py-1.5 outline-none focus:border-neutral-900 dark:focus:border-white disabled:opacity-50"
                      >
                        <option value="owner">Propietario</option>
                        <option value="admin">Administrador</option>
                        <option value="member">Miembro</option>
                      </select>
                      <button
                        onClick={() => handleRemove(m.user_id)}
                        disabled={busy || m.role === "owner" && role !== "owner"}
                        className="p-1.5 rounded-full text-neutral-400 hover:text-[#f7525f] hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {!canManage && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-300 uppercase tracking-wide">
                      {m.role === "owner" ? "Owner" : m.role === "admin" ? "Admin" : "Miembro"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 rounded-[32px] overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-zinc-800 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500 dark:text-zinc-400">Invitaciones pendientes</p>
                {canManage && (
                  <button
                    onClick={() => { invitations.forEach((inv) => handleRevoke(inv.token, inv.email)); }}
                    disabled={busy}
                    className="text-[11px] text-[#f7525f] font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    <X className="w-3 h-3" /> Revocar todas
                  </button>
                )}
              </div>
              <ul className="divide-y divide-neutral-100 dark:divide-zinc-800">
                {invitations.map((inv) => (
                  <li key={inv.id} className="flex items-center gap-3 px-6 py-3.5">
                    <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-neutral-400 dark:text-zinc-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{inv.email}</p>
                      <p className="text-xs text-neutral-500 dark:text-zinc-400">
                        Expira {new Date(inv.expires_at).toLocaleDateString("es-CL")} · rol {inv.role}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => handleRevoke(inv.token, inv.email)}
                        disabled={busy}
                        className="p-1.5 rounded-full text-neutral-400 hover:text-[#f7525f] hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                        title="Revocar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {showInvite && (
        <InviteModal orgId={orgId} onClose={() => setShowInvite(false)} onInvited={() => { setShowInvite(false); onChange(); }} role={role} />
      )}
    </div>
  );
}

function InviteModal({
  orgId,
  onClose,
  onInvited,
  role,
}: { orgId: string; onClose: () => void; onInvited: () => void; role: OrgRole }) {
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/empresas/${orgId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo invitar");
      onInvited();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.form
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-[32px] max-w-md w-full p-8 shadow-2xl text-neutral-900 dark:text-neutral-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">Invitar miembro</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Email del invitado</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colega@empresa.cl"
              className="w-full rounded-2xl border border-neutral-200 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800/60 px-4 py-3 text-sm outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Rol</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as OrgRole)}
              disabled={role === "admin"}
              className="w-full rounded-2xl border border-neutral-200 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800/60 px-4 py-3 text-sm outline-none focus:border-neutral-900 dark:focus:border-white transition-colors disabled:opacity-60"
            >
              <option value="member">Miembro</option>
              {role === "owner" && <option value="admin">Administrador</option>}
            </select>
            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-2">
              El invitado recibirá un email con un enlace para unirse. Debe registrarse con ese mismo email.
            </p>
          </div>
          {error && <p className="text-[#f7525f] text-xs">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-neutral-950 dark:bg-white text-white dark:text-black font-bold py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {busy ? "Enviando…" : "Enviar invitación"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
