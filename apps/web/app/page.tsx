"use client";

import { useState } from "react";
import { Hero } from "../components/landing/Hero";
import { Header } from "../components/landing/Header";
import { Marquee } from "../components/landing/Marquee";
import { ProblemSection } from "../components/landing/ProblemSection";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { InteractiveDemo } from "../components/landing/InteractiveDemo";
import { PricingSection } from "../components/landing/PricingSection";
import { Footer } from "../components/landing/Footer";
import { VideoModal } from "../components/landing/VideoModal";
import { LandingClientLogic } from "../components/landing/LandingClientLogic";

export default function Home() {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <div className="min-h-screen w-full paper-texture text-[#111] antialiased select-none overflow-x-hidden relative" style={{ fontFamily: 'var(--fredrika-font)' }}>
      {/* Dot Grid Background Layer */}
      <div className="fixed inset-0 pointer-events-none dot-grid-bg z-[0]" />
      
      {/* Paper Grain Texture Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-[1]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.06,
          mixBlendMode: 'multiply'
        }} 
      />
      
      <LandingClientLogic />
      
      {/* Scope Keyframes and animations */}
      <style>{`
        /* Smooth scrolling */
        html { scroll-behavior: smooth; }

        /* Dot grid background */
        .dot-grid-bg {
          background-image: radial-gradient(circle, #000 1.5px, transparent 1.5px);
          background-size: 28px 28px;
          opacity: 0.15;
          mask-image: radial-gradient(ellipse at center, black 40%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 100%);
        }

        /* Depth shadows for sections */
        .inner-depth-shadow {
          box-shadow: inset 0 -40px 60px -20px rgba(0,0,0,0.5);
        }

        @keyframes infinite-marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        @keyframes infinite-marquee-right {
          0% { transform: translateX(-33.33%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-left {
          animation: infinite-marquee-left 32s linear infinite;
        }
        .animate-marquee-right {
          animation: infinite-marquee-right 32s linear infinite;
        }
        .animate-marquee-left:hover, .animate-marquee-right:hover {
          animation-play-state: paused;
        }
        .text-difference {
          mix-blend-mode: difference;
        }
      `}</style>

      {/* 1. HERO SECTION & TOP BAR */}
      <div className="relative w-full overflow-hidden pb-24 border-b border-black/10">
        
        {/* Global Navigation Header */}
        <Header />

        {/* Hero Central Layout */}
        <Hero />

      </div>

      {/* 2. DOUBLE ROW INFINITE USE-CASE MARQUEE */}
      <Marquee />

      {/* 5. DYNAMIC FULL-BLEED DEMO */}
      <InteractiveDemo />

      {/* 3. PROBLEM SECTION */}
      <ProblemSection />

      {/* 4. SOLUTION SECTION */}
      <FeaturesSection />

      <PricingSection />

      {/* 8. FOOTER */}
      <Footer />

      {/* 9. DETAILED VIDEO MODAL PLAYER */}
      <VideoModal videoOpen={videoOpen} setVideoOpen={setVideoOpen} />

    </div>
  );
}
