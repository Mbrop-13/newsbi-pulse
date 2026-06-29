"use client";

import { useState, forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";

const TEAM_SIZES = [
  { value: "1-5", label: "1–5 personas" },
  { value: "6-20", label: "6–20 personas" },
  { value: "21-100", label: "21–100 personas" },
  { value: "100+", label: "100+ personas" },
];

export const EmpresasCtaContact = forwardRef<HTMLDivElement>(function EmpresasCtaContact(_, ref) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    rut: "",
    team_size: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/empresas/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "No se pudo enviar el formulario");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section ref={ref} id="contacto" className="bg-[#0a0a0f] text-white py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <div>
            <h2 className="text-xs font-bold tracking-widest text-[#1890FF] uppercase mb-3">
              Hablemos
            </h2>
            <p className="text-3xl md:text-4xl font-black tracking-tight mb-5">
              Agenda una demo con nuestro equipo
            </p>
            <p className="text-white/60 text-lg leading-relaxed mb-8">
              Cuéntanos sobre tu organización y te ayudaremos a diseñar la configuración ideal.
              Respondemos en menos de 24 horas hábiles.
            </p>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22ab94]" /> Demo personalizada de 30 minutos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22ab94]" /> Evaluación de tu caso de uso
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22ab94]" /> Plan de implementación sin costo
              </li>
            </ul>
          </div>

          {/* Right form */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <CheckCircle2 className="w-14 h-14 text-[#22ab94] mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">¡Gracias por contactarnos!</h3>
                <p className="text-white/60 text-sm">
                  Hemos recibido tu solicitud. Te escribiremos a {form.email} en menos de 24 horas hábiles.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nombre*" required>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input"
                      placeholder="Juan Pérez"
                    />
                  </Field>
                  <Field label="Email corporativo*" required>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input"
                      placeholder="juan@empresa.cl"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Empresa*" required>
                    <input
                      type="text"
                      required
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="input"
                      placeholder="Acme SpA"
                    />
                  </Field>
                  <Field label="RUT">
                    <input
                      type="text"
                      value={form.rut}
                      onChange={(e) => setForm({ ...form, rut: e.target.value })}
                      className="input"
                      placeholder="12.345.678-9"
                    />
                  </Field>
                </div>
                <Field label="Tamaño del equipo">
                  <select
                    value={form.team_size}
                    onChange={(e) => setForm({ ...form, team_size: e.target.value })}
                    className="input"
                  >
                    <option value="">Selecciona una opción</option>
                    {TEAM_SIZES.map((t) => (
                      <option key={t.value} value={t.value} className="bg-[#0a0a0f]">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Mensaje">
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="input min-h-[90px] resize-y"
                    placeholder="Cuéntanos qué necesitas resolver…"
                  />
                </Field>

                {error && <p className="text-[#f7525f] text-xs">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#1890FF] hover:bg-[#0f7be0] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Enviando…
                    </>
                  ) : (
                    <>
                      Enviar y agendar demo <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 10px 14px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .input:focus {
          border-color: #1890ff;
          background: rgba(24, 144, 255, 0.05);
        }
        .input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </section>
  );
});

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-white/60 mb-1.5">
        {label}
        {required && <span className="text-[#1890FF]"> *</span>}
      </span>
      {children}
    </label>
  );
}