"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Logo } from "@/components/logo";
import { LandingNavbar } from "@/components/landing/landing-navbar";

interface LandingHeroProps {
  onScrollToFeatures: () => void;
}

export function LandingHero({ onScrollToFeatures }: LandingHeroProps) {
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const router = useRouter();

  // Typewriter effect state
  const words = ["inversiones", "decisiones", "oportunidades"];
  const [wordIndex, setWordIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (subIndex === words[wordIndex].length + 1 && !isDeleting) {
      const timeout = setTimeout(() => setIsDeleting(true), 2000); // Pause on full word
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && isDeleting) {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, isDeleting ? 60 : 120); // Faster erasing

    return () => clearTimeout(timeout);
  }, [subIndex, isDeleting, wordIndex]);

  const handleCTA = () => {
    if (isAuthenticated) {
      router.push("/ai");
    } else {
      openModal("register");
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <section className="relative min-h-[80vh] flex flex-col justify-between bg-white text-[#191919] px-6 md:px-12 lg:px-20 pt-28 pb-10 select-none font-sans overflow-hidden">
      {/* Top Floating Navbar */}
      <LandingNavbar />

      {/* Main Content (Split Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center my-auto pt-10">
        
        {/* Left Column: Big Headline - font-bold instead of font-black, and block span for word */}
        <div className="lg:col-span-7">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-[#191919] min-h-[180px] sm:min-h-[220px] md:min-h-[280px]">
            Agentes de{" "}
            <span className="inline-block border-b-[3px] md:border-b-[4px] border-black pb-0.5 md:pb-1 text-black font-bold">
              IA
            </span>{" "}
            que potencian tus
            <span className="block mt-3 border-b-[3px] md:border-b-[4px] border-black pb-0.5 md:pb-1 text-black font-bold max-w-fit">
              {words[wordIndex].substring(0, subIndex)}
              <span className="inline-block w-[3px] h-[32px] md:h-[50px] bg-black ml-1.5 animate-pulse" />
            </span>
          </h1>
        </div>

        {/* Right Column: Paragraph with Anthropic Serif font family and blue button */}
        <div className="lg:col-span-5 flex flex-col items-start justify-center">
          <p 
            className="text-lg md:text-xl font-medium text-[#191919]/90 leading-relaxed mb-8"
          >
            La inteligencia artificial transformará nuestra relación con la información financiera. Mediante un consorcio de agentes autónomos que trabajan en paralelo, auditamos mercados globales en tiempo real y verificamos cada dato para potenciar tu portafolio sin sesgos ni desinformación.
          </p>

          <button
            onClick={handleCTA}
            className="group flex items-center justify-center gap-2 bg-black text-white hover:bg-black/90 font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md shadow-black/25 cursor-pointer"
          >
            {isAuthenticated ? "Abrir Asistente Maverlang AI" : "Comenzar Gratis"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>

      {/* spacer height only, line removed */}
      <div className="w-full h-8" />
    </section>
  );
}
