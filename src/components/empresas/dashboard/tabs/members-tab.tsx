"use client";

import { useState } from "react";
import type { OrgRole } from "@/lib/plan-limits";
import { Users, UserPlus, Loader2, Trash2, RefreshCw, Mail, X } from "lucide-react";

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">Miembros</h2>
          <p className="text-sm text-muted-foreground">
            {seatActiveCount} activos · {invitations.length} invitaciones pendientes · {seatCount} asientos contratados
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            disabled={role === "admin"}
            className="inline-flex items-center gap-2 bg-[#1890FF] hover:bg-[#0f7be0] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition"
          >
            <UserPlus className="w-4 h-4" />
            Invitar
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <>
          {/* Active members */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-accent/30">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Miembros activos</p>
            </div>
            <ul className="divide-y divide-border">
              {members.filter((m) => m.status === "active").map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (m.name || m.email || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{m.name || m.email || "Usuario"}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email ?? m.invited_email ?? "—"}</p>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <select
                        value={m.role}
                        disabled={busy || role === "admin"}
                        onChange={(e) => handleChangeRole(m.user_id, e.target.value as OrgRole)}
                        className="text-xs font-bold rounded-lg border border-border bg-background px-2 py-1.5 outline-none focus:border-[#1890FF] disabled:opacity-50"
                      >
                        <option value="owner">Propietario</option>
                        <option value="admin">Administrador</option>
                        <option value="member">Miembro</option>
                      </select>
                      <button
                        onClick={() => handleRemove(m.user_id)}
                        disabled={busy || m.role === "owner" && role !== "owner"}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-[#f7525f] hover:bg-accent disabled:opacity-40"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {!canManage && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent">
                      {m.role === "owner" ? "Owner" : m.role === "admin" ? "Admin" : "Miembro"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-accent/30 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Invitaciones pendientes</p>
                {canManage && (
                  <button
                    onClick={() => { invitations.forEach((inv) => handleRevoke(inv.token, inv.email)); }}
                    disabled={busy}
                    className="text-[11px] text-[#f7525f] font-semibold flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    <X className="w-3 h-3" /> Revocar todas
                  </button>
                )}
              </div>
              <ul className="divide-y divide-border">
                {invitations.map((inv) => (
                  <li key={inv.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Expira {new Date(inv.expires_at).toLocaleDateString("es-CL")} · rol {inv.role}
                      </p>
                    </div>
                    {canManage && (
                      <>
                        <button
                          onClick={() => handleRevoke(inv.token, inv.email)}
                          disabled={busy}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-[#f7525f] hover:bg-accent disabled:opacity-50"
                          title="Revocar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="bg-card rounded-3xl border border-border max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black">Invitar miembro</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email del invitado</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colega@empresa.cl"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-[#1890FF]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Rol</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as OrgRole)}
              disabled={role === "admin"}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-[#1890FF] disabled:opacity-60"
            >
              <option value="member">Miembro</option>
              {role === "owner" && <option value="admin">Administrador</option>}
            </select>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              El invitado recibirá un email con un enlace para unirse. Debes registrarse con ese mismo email.
            </p>
          </div>
          {error && <p className="text-[#f7525f] text-xs">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#1890FF] hover:bg-[#0f7be0] disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {busy ? "Enviando…" : "Enviar invitación"}
          </button>
        </div>
      </form>
    </div>
  );
}