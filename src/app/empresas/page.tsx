"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { EmpresasHero } from "@/components/empresas/empresas-hero";
import { EmpresasLogos } from "@/components/empresas/empresas-logos";
import { EmpresasBenefits } from "@/components/empresas/empresas-benefits";
import { EmpresasPricing } from "@/components/empresas/empresas-pricing";
import { EmpresasCases } from "@/components/empresas/empresas-cases";
import { EmpresasTrust } from "@/components/empresas/empresas-trust";
import { EmpresasFaq } from "@/components/empresas/empresas-faq";
import { EmpresasCtaContact } from "@/components/empresas/empresas-cta-contact";
import type { EnterprisePlan, BillingCycle } from "@/lib/plan-limits";

export default function EmpresasPage() {
  const plansRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToPlans = () =>
    plansRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToContact = () =>
    contactRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSelectPlan = (plan: EnterprisePlan, _seats: number, _cycle: BillingCycle) => {
    if (plan === "enterprise") {
      scrollToContact();
      return;
    }
    // Para Team/Business: ir al dashboard/login; si está logueado se crea la org desde allí.
    router.push(`/empresas/dashboard?plan=${plan}&seats=${_seats}&cycle=${_cycle}`);
  };

  return (
    <main className="bg-white overflow-x-hidden">
      <EmpresasHero onScrollToPlans={scrollToPlans} onScrollToContact={scrollToContact} />
      <EmpresasLogos />
      <div ref={plansRef}>
        <EmpresasPricing onSelectPlan={handleSelectPlan} />
      </div>
      <EmpresasBenefits />
      <EmpresasCases />
      <EmpresasTrust />
      <EmpresasFaq />
      <EmpresasCtaContact ref={contactRef} />

      {/* Footer minimal */}
      <footer className="bg-[#0a0a0f] text-white/40 py-10 px-6 text-center text-xs">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-white">Maverlang</span>
            <span className="text-[10px] font-bold bg-[#1890FF] text-white px-1.5 py-0.5 rounded">Empresas</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/home" className="hover:text-white transition">Inicio</a>
            <a href="/empresas" className="hover:text-white transition">Empresas</a>
            <a href="/suscripcion" className="hover:text-white transition">Planes individuales</a>
            <a href="/terminos" className="hover:text-white transition">Términos</a>
            <a href="/privacidad" className="hover:text-white transition">Privacidad</a>
          </div>
          <p>© {new Date().getFullYear()} Maverlang — Inteligencia Artificial Financiera</p>
        </div>
      </footer>
    </main>
  );
}