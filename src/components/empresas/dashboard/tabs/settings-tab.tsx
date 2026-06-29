"use client";

import { useState, useEffect } from "react";
import type { UserOrgMembership } from "@/lib/types";
import { Loader2, Save, Check, AlertOctagon } from "lucide-react";

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
      <h2 className="text-2xl font-black tracking-tight">Configuración</h2>

      <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 rounded-[32px] p-7 shadow-sm space-y-5 max-w-xl">
        <div>
          <label className="block text-[11px] font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Nombre de la organización</label>
          <input
            type="text"
            required
            value={name}
            disabled={!canAdmin}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800/60 px-4 py-3 text-sm outline-none focus:border-neutral-900 dark:focus:border-white transition-colors disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-[11px] font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Identificador (slug)</label>
          <input
            type="text"
            value={org.slug}
            disabled
            className="w-full rounded-2xl border border-neutral-200 dark:border-zinc-700 bg-neutral-100 dark:bg-zinc-800/40 px-4 py-3 text-sm text-neutral-500 dark:text-zinc-400 font-mono"
          />
          <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-2">El identificador no se puede modificar.</p>
        </div>

        <div>
          <label className="block text-[11px] font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wide mb-2">RUT (facturación)</label>
          <input
            type="text"
            value={rut}
            disabled={!canAdmin}
            onChange={(e) => setRut(e.target.value)}
            placeholder="12.345.678-9"
            className="w-full rounded-2xl border border-neutral-200 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800/60 px-4 py-3 text-sm outline-none focus:border-neutral-900 dark:focus:border-white transition-colors disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-[11px] font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Email de facturación</label>
          <input
            type="email"
            value={billingEmail}
            disabled={!canAdmin}
            onChange={(e) => setBillingEmail(e.target.value)}
            placeholder="facturacion@empresa.cl"
            className="w-full rounded-2xl border border-neutral-200 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800/60 px-4 py-3 text-sm outline-none focus:border-neutral-900 dark:focus:border-white transition-colors disabled:opacity-60"
          />
        </div>

        {error && <p className="text-[#f7525f] text-xs">{error}</p>}
        {saved && (
          <p className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Cambios guardados
          </p>
        )}

        {canAdmin && (
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold px-6 py-3 rounded-full text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>
        )}
      </form>

      {!canAdmin && (
        <p className="text-xs text-neutral-500 dark:text-zinc-400 bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200/50 dark:border-zinc-700/50 rounded-2xl p-4 max-w-xl">
          Solo el propietario puede editar la configuración de la organización.
        </p>
      )}

      {/* Danger zone */}
      {membership.role === "owner" && (
        <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-500/30 rounded-[32px] p-7 max-w-xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
              <AlertOctagon className="w-3.5 h-3.5 text-[#f7525f]" />
            </div>
            <h3 className="text-sm font-black text-[#f7525f]">Zona de peligro</h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-zinc-400 mb-4 leading-relaxed">
            Para cancelar la organización y todos sus datos, contáctanos desde el email de facturación.
            Esta acción es irreversible.
          </p>
          <a
            href="mailto:ventas@maverlang.cl?subject=Cancelar%20organización"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#f7525f] px-4 py-2 rounded-full border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            Solicitar cancelación <span aria-hidden>→</span>
          </a>
        </div>
      )}
    </div>
  );
}
