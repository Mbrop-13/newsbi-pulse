"use client";

import { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingMobileMockup } from "@/components/landing/landing-mobile-mockup";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingUseCases } from "@/components/landing/landing-use-cases";
import { LandingStats } from "@/components/landing/landing-stats";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { LandingCTA } from "@/components/landing/landing-cta";
import { Footer } from "@/components/footer";

export default function HomePage() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track absolute window scroll position relative to the container element
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end center"]
  });

  // Map relative scroll progress: Starts expanding when container starts entering screen (0) and completes near center (0.6).
  const width = useTransform(scrollYProgress, [0.1, 0.65], ["75%", "100%"]);
  const borderRadius = useTransform(scrollYProgress, [0.1, 0.65], ["32px", "0px"]);
  const marginX = useTransform(scrollYProgress, [0.1, 0.65], ["12.5%", "0%"]);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      {/* Hero Section with Anthropic style split column layout */}
      <LandingHero onScrollToFeatures={scrollToFeatures} />
      
      {/* Expanding Dark Container hosting the mobile mockup/video placeholder */}
      <div ref={containerRef} className="w-full bg-white py-4 overflow-hidden">
        <motion.div
          style={{
            width,
            borderRadius,
            marginLeft: marginX,
            marginRight: marginX,
          }}
          className="bg-black border border-black mx-auto overflow-hidden flex justify-center"
        >
          <div className="w-screen min-w-[100vw] flex justify-center shrink-0">
            <LandingMobileMockup />
          </div>
        </motion.div>
      </div>

      {/* Main landing sections (features, pricing, etc.) */}
      <div ref={featuresRef}>
        <LandingFeatures />
      </div>
      <LandingUseCases />
      <LandingStats />
      <LandingPricing />
      <LandingCTA />
      <Footer />
    </div>
  );
}
