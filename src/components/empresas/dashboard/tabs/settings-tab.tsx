"use client";

import { useState, useEffect } from "react";
import type { UserOrgMembership } from "@/lib/types";
import { Loader2, Save } from "lucide-react";

interface SettingsTabProps {
  orgId: string;
  membership: UserOrgMembership;
  onUpdated: () => void;
  canAdmin: boolean;
}

export function SettingsTab({ orgId, membership, onUpdated, canAdmin }: SettingsTabProps) {
  const org = membership.org;
  const [name, setName] = useState(org.name);
  const [rut, setRut] = useState(org.rut ?? "");
  const [billingEmail, setBillingEmail] = useState(org.billing_email ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(org.name);
    setRut(org.rut ?? "");
    setBillingEmail(org.billing_email ?? "");
  }, [org]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/empresas/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          rut: rut.trim() || null,
          billing_email: billingEmail.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "No se pudo guardar");
      }
      setSaved(true);
      onUpdated();
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-black">Configuración</h2>

      <form onSubmit={handleSave} className="bg-card rounded-2xl border border-border p-6 space-y-4 max-w-xl">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nombre de la organización</label>
          <input
            type="text"
            required
            value={name}
            disabled={!canAdmin}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-[#1890FF] disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Identificador (slug)</label>
          <input
            type="text"
            value={org.slug}
            disabled
            className="w-full rounded-xl border border-border bg-accent/40 px-3.5 py-2.5 text-sm text-muted-foreground"
          />
          <p className="text-[11px] text-muted-foreground mt-1">El identificador no se puede modificar.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">RUT (facturación)</label>
          <input
            type="text"
            value={rut}
            disabled={!canAdmin}
            onChange={(e) => setRut(e.target.value)}
            placeholder="12.345.678-9"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-[#1890FF] disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email de facturación</label>
          <input
            type="email"
            value={billingEmail}
            disabled={!canAdmin}
            onChange={(e) => setBillingEmail(e.target.value)}
            placeholder="facturacion@empresa.cl"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-[#1890FF] disabled:opacity-60"
          />
        </div>

        {error && <p className="text-[#f7525f] text-xs">{error}</p>}
        {saved && <p className="text-[#22ab94] text-xs">✓ Cambios guardados</p>}

        {canAdmin && (
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 bg-[#1890FF] hover:bg-[#0f7be0] disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>
        )}
      </form>

      {!canAdmin && (
        <p className="text-xs text-muted-foreground bg-accent/40 rounded-xl p-4 max-w-xl">
          Solo el propietario puede editar la configuración de la organización.
        </p>
      )}

      {/* Danger zone */}
      {membership.role === "owner" && (
        <div className="bg-card rounded-2xl border border-red-200 dark:border-red-500/30 p-6 max-w-xl">
          <h3 className="text-sm font-bold text-[#f7525f] mb-2">Zona de peligro</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Para cancelar la organización y todos sus datos, contáctanos desde el email de facturación.
            Esta acción es irreversible.
          </p>
          <a
            href="mailto:ventas@maverlang.cl?subject=Cancelar%20organización"
            className="text-xs font-semibold text-[#f7525f] hover:underline"
          >
            Solicitar cancelación →
          </a>
        </div>
      )}
    </div>
  );
}