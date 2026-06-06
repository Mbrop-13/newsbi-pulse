"use client";

export function LandingStats() {
  return (
    <section className="pt-2 pb-8 bg-white select-none font-sans">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Recuadro / Boxed Card Container (with borders and margins) */}
        <div className="bg-[#070b19] border border-slate-800/80 rounded-3xl p-8 md:p-16 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/5 blur-3xl rounded-full pointer-events-none" />

          {/* Header Text - Muted slate paragraph layout with bold highlights */}
          <div className="max-w-3xl mb-3 relative z-10">
            <p className="text-xl md:text-2xl font-normal leading-relaxed text-slate-400">
              <span className="text-white font-bold">Toma decisiones de inversión con total confianza.</span>{" "}
              Monitorea millones de indicadores macroeconómicos globales con velocidad y consistencia garantizadas, incluso durante los períodos de mayor volatilidad del mercado.
            </p>
          </div>

          {/* Milky Way Visual - Responsive aspect ratio container to prevent stretching/squishing, edges fade into dark background */}
          <div className="w-full aspect-[16/7] md:aspect-[21/8] relative mb-4 rounded-2xl overflow-hidden bg-[#070b19]">
            <img 
              src="/assets/milky-way.jpeg" 
              alt="Visualización de la Vía Láctea" 
              className="w-full h-full object-cover object-center select-none pointer-events-none rounded-2xl"
            />
            {/* Edge fade overlays — gradients matching #070b19 to dissolve the image edges */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_25%,_#070b19_80%)] pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#070b19] via-[#070b19]/40 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#070b19] via-[#070b19]/40 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#070b19] via-[#070b19]/40 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#070b19] via-[#070b19]/40 to-transparent pointer-events-none" />
          </div>

          {/* Telemetry Metrics Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative z-10">
            
            <div>
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-2">
                10 M o más
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                noticias analizadas por día
              </p>
            </div>

            <div>
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-2">
                15 k o más
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                peticiones de la IA por segundo
              </p>
            </div>

            <div>
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400 mb-2">
                25 o más
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                agentes especializados en paralelo
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
