"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Play } from "lucide-react";

import { SketchyButtonGroup, SketchyDivider, HeavyPencilCircle } from "./SketchyUI";

const SketchyYoutubeIcon = ({ className = "w-7 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 130 100" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    {/* Outer Rounded Rectangle (Elongated) */}
    <path d="M 20,15 Q 65,10 110,15 Q 120,15 120,25 Q 125,50 120,80 Q 120,90 110,90 Q 65,95 20,90 Q 10,90 10,80 Q 5,50 10,20 Q 10,10 20,15" strokeWidth="6" />
    {/* Inner Play Triangle (Centered and overshooting) */}
    <path d="M 55,25 L 57,75" strokeWidth="6" /> 
    <path d="M 52,32 L 90,50" strokeWidth="6" /> 
    <path d="M 52,68 L 90,50" strokeWidth="6" /> 
  </svg>
);

export function Hero() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);
  const [cursorHovered, setCursorHovered] = useState(false); // Kept for event handlers

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6 pt-16 flex flex-col items-center text-center z-20">
        <h1 className="relative text-5xl sm:text-7xl lg:text-8xl font-normal tracking-tighter text-[#111] leading-[1.05] max-w-5xl z-10" style={{ fontFamily: 'var(--fredrika-font)' }}>
          <span className="relative inline-block px-4 -ml-4">
            <span className="relative z-10">Forms</span>
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Top (2) */}
              <path d="M -5,0 L 105,2" stroke="#111" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
              <path d="M -5,3 L 105,0" stroke="#111" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
              
              {/* Right (2) */}
              <path d="M 100,-5 L 102,105" stroke="#111" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
              <path d="M 103,-5 L 99,105" stroke="#111" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
              
              {/* Left (2) */}
              <path d="M 0,-5 L -2,105" stroke="#111" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
              <path d="M -3,-5 L 1,105" stroke="#111" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
              
              {/* Bottom (2) */}
              <path d="M -5,100 L 105,98" stroke="#111" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
              <path d="M -5,97 L 105,101" stroke="#111" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
            </svg>
          </span>
          {" "}that{" "}
          <span className="relative inline-block px-1">
            <span className="relative z-10">feel</span>
            <svg className="absolute -bottom-1 sm:-bottom-3 left-0 w-full h-3 sm:h-5 pointer-events-none overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M -10,2 Q 50,8 110,1" stroke="#111" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
              <path d="M -5,7 Q 50,1 105,8" stroke="#111" strokeWidth="1.5" fill="none" opacity="0.7" vectorEffect="non-scaling-stroke" />
            </svg>
          </span>
          {" "}like
          <br />
          a{" "}
          <span className="relative inline-block px-8 py-2 mt-2">
            <span className="relative z-10">conversation</span>
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible rotate-1" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 15 90 C 50 105, 90 95, 95 65 C 100 30, 90 0, 50 5 C 10 10, -5 40, 5 70 C 15 95, 50 105, 85 85 C 105 60, 95 10, 50 15" stroke="#111" strokeWidth="4" fill="none" vectorEffect="non-scaling-stroke" />
            </svg>
          </span>
        </h1>
        
        <p className="mt-8 text-gray-600 text-xl sm:text-3xl max-w-3xl leading-relaxed ">
          Build beautiful and highly interactive forms. 
        </p>

        {/* Interactive CTAs */}
        <SketchyButtonGroup className="mt-12 mb-8 mx-4">
          <Link 
            href="/sign-up" 
            onMouseEnter={() => setCursorHovered(true)}
            onMouseLeave={() => setCursorHovered(false)}
            className="relative group inline-flex items-center justify-center font-bold px-8 py-5 transition-all duration-300 text-black text-xs uppercase tracking-widest gap-2"
          >
            Create Form <ArrowRight className="w-4 h-4" />
            <HeavyPencilCircle />
          </Link>
          <SketchyDivider />
          <Link 
            href="/explore"
            onMouseEnter={() => setCursorHovered(true)}
            onMouseLeave={() => setCursorHovered(false)}
            className="relative group inline-flex items-center justify-center font-bold px-8 py-5 transition-all duration-300 text-black text-xs uppercase tracking-widest gap-2"
          >
            Explore Public Forms
            <HeavyPencilCircle />
          </Link>
          <SketchyDivider />
          <a 
            href="https://www.youtube.com/watch?v=tIEnePoe-ns"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setCursorHovered(true)}
            onMouseLeave={() => setCursorHovered(false)}
            className="relative group inline-flex items-center justify-center font-bold px-8 py-5 transition-all duration-300 text-black text-xs uppercase tracking-widest gap-2"
          >
            <SketchyYoutubeIcon className="w-5 h-5 text-black" /> See How It Works
            <HeavyPencilCircle />
          </a>
        </SketchyButtonGroup>

      </div>
    </section>
  );
}
