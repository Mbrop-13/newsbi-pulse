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

export default function HomePage() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track absolute window scroll position
  const { scrollY } = useScroll();

  // Map window scroll position: Starts expanding at 380px scroll (when title is leaving view) and completes at 680px.
  // Initial width is 75% (20% smaller) and border radius is 32px.
  const width = useTransform(scrollY, [380, 680], ["75%", "100%"]);
  const borderRadius = useTransform(scrollY, [380, 680], ["32px", "0px"]);
  const marginX = useTransform(scrollY, [380, 680], ["12.5%", "0%"]);

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
          className="bg-[#0b0f1d] border border-[#0b0f1d] mx-auto overflow-hidden"
        >
          <LandingMobileMockup />
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
    </div>
  );
}
