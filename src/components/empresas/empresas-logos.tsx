"use client";

const LOGOS = [
  { name: "Asset Management", init: "AM" },
  { name: "Corretaje", init: "CB" },
  { name: "Estudio Jurídico", init: "EJ" },
  { name: "Universidad", init: "UN" },
  { name: "Family Office", init: "FO" },
  { name: "Fintech", init: "FT" },
];

export function EmpresasLogos() {
  return (
    <section className="bg-[#0a0a0f] border-t border-white/5 py-14">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-white/30 mb-8">
          Equipos que confían en Maverlang
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {LOGOS.map((l) => (
            <div
              key={l.name}
              className="flex items-center justify-center gap-2.5 grayscale opacity-50 hover:opacity-100 hover:grayscale-0 transition-all duration-300"
              title={l.name}
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-black text-white/70">
                {l.init}
              </div>
              <span className="text-sm font-bold text-white/60">{l.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}