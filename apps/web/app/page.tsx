"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "../hooks/api/auth/useUser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Play, Sliders, Layout, ArrowRight, Check, Activity, X, HelpCircle, AlertTriangle, Sparkles, Send, Laptop
} from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  const [isYearly, setIsYearly] = useState(false);

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (user && user.id) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // Accessibility check for reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Section Ref observers for elegant viewport fade-in transitions
  const problemRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const pricingPlaceholderRef = useRef<HTMLDivElement>(null);
  const finalCtaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-16");
          }
        });
      },
      { threshold: 0.05 }
    );

    const targets = [problemRef.current, solutionRef.current, demoRef.current, pricingPlaceholderRef.current, finalCtaRef.current];
    targets.forEach((target) => {
      if (target) {
        const rect = target.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        if (!isInViewport) {
          target.classList.add("opacity-0", "translate-y-16");
        } else {
          target.classList.add("opacity-100", "translate-y-0");
        }
        observer.observe(target);
      }
    });

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  // Custom text-scramble/hacker decode component hook
  const ScrambleWord = ({ text, delay = 0 }: { text: string; delay?: number }) => {
    const [displayText, setDisplayText] = useState("");
    const chars = "FORMZ!@#$-_+=%&*?0123456789";

    useEffect(() => {
      if (prefersReducedMotion) {
        setDisplayText(text);
        return;
      }

      let timeout: NodeJS.Timeout;
      let interval: NodeJS.Timeout;

      timeout = setTimeout(() => {
        let iterations = 0;
        interval = setInterval(() => {
          setDisplayText(
            text
              .split("")
              .map((char, index) => {
                if (index < iterations) {
                  return text[index];
                }
                if (char === " ") return " ";
                return chars[Math.floor(Math.random() * chars.length)];
              })
              .join("")
          );

          if (iterations >= text.length) {
            clearInterval(interval);
          }
          iterations += 1 / 3;
        }, 25);
      }, delay);

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }, [text, delay]);

    return <span>{displayText}</span>;
  };

  // Cursor position and trailing lag state
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [trailPos, setTrailPos] = useState({ x: -100, y: -100 });
  const [cursorHovered, setCursorHovered] = useState(false);
  const [magnetPos, setMagnetPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (prefersReducedMotion || typeof window === "undefined") return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrame: number;
    const updateTrail = () => {
      setTrailPos((prev) => {
        const dx = mousePos.x - prev.x;
        const dy = mousePos.y - prev.y;
        // High performance lerp to avoid CPU lag
        return {
          x: prev.x + dx * 0.12,
          y: prev.y + dy * 0.12,
        };
      });
      animationFrame = requestAnimationFrame(updateTrail);
    };
    animationFrame = requestAnimationFrame(updateTrail);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, [mousePos, prefersReducedMotion]);

  // 3D Perspective Rotation for Hero Live Card
  const [rotate3d, setRotate3d] = useState({ x: 0, y: 0 });
  const handle3DCardMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Cap tilt angles to avoid extreme distortion
    setRotate3d({
      x: Math.max(-10, Math.min(10, -y / 15)),
      y: Math.max(-10, Math.min(10, x / 15)),
    });
  };
  const reset3DCard = () => {
    setRotate3d({ x: 0, y: 0 });
  };

  // Interactive Live Form Demo (3-Step Custom Conversational Experience)
  const [demoStep, setDemoStep] = useState(0);
  const [demoEmail, setDemoEmail] = useState("");
  const [demoFeedback, setDemoFeedback] = useState("");
  const [demoPainPoint, setDemoPainPoint] = useState("");
  const [demoFinished, setDemoFinished] = useState(false);
  const [responseCounter, setResponseCounter] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleDemoNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (demoStep === 0) {
      if (!demoEmail.trim() || !demoEmail.includes("@")) {
        toast.error("Please enter a valid email address.");
        return;
      }
      setDemoStep(1);
    } else if (demoStep === 1) {
      if (!demoFeedback.trim()) {
        toast.error("Please select or describe a feature.");
        return;
      }
      setDemoStep(2);
    } else {
      if (!demoPainPoint.trim()) {
        toast.error("Please let us know your biggest pain point.");
        return;
      }
      setDemoFinished(true);
      setResponseCounter((prev) => prev + 1);
      setShowConfetti(true);
      toast.success("Response recorded beautifully!");
      setTimeout(() => setShowConfetti(false), 4000);
    }
  };

  const resetDemo = () => {
    setDemoStep(0);
    setDemoEmail("");
    setDemoFeedback("");
    setDemoPainPoint("");
    setDemoFinished(false);
    setShowConfetti(false);
  };

  // YouTube / Video Modal Placeholder Logic
  const [videoOpen, setVideoOpen] = useState(false);

  // Background Drifting Particles Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (prefersReducedMotion || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const maxParticles = 150; 
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      offset: number; // random offset for sine wave
    }> = [];

    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height, // distribute randomly at start
        vx: (Math.random() - 0.5) * 1.0,
        vy: -(Math.random() * 1.0 + 0.5), // Drifting upwards slowly
        radius: Math.random() * 1.5 + 0.5,
        offset: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const time = Date.now() / 1000;

      // Safely determine scroll depth (0.0 at top, 1.0 at bottom)
      const scrollY = window.scrollY || 0;
      const docHeight = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const scrollPercent = Math.max(0, Math.min(scrollY / docHeight, 1));
      
      // Scale intensity based on scroll depth
      const activeParticleCount = Math.floor(40 + (maxParticles - 40) * scrollPercent);
      const coreOpacity = 0.5 + (scrollPercent * 0.5); // 0.5 to 1.0

      for (let i = 0; i < activeParticleCount; i++) {
        const p = particles[i]!;
        p.y += p.vy;
        // smooth horizontal drift
        p.x += Math.sin(time + p.offset) * 0.5;

        // Reset if it goes off top
        if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
          p.vy = -(Math.random() * 1.0 + 0.5);
        }
        
        // Wrap horizontally
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        // Fade in near bottom so they don't pop into existence abruptly
        let opacity = 1;
        if (p.y > height - 100) {
          opacity = Math.max(0, (height - p.y) / 100);
        }

        // Core ember
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 107, 53, ${opacity * coreOpacity})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [prefersReducedMotion, canvasRef.current]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-[#050505] text-white font-sans">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#FF6B35] border-t-transparent animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest text-[#666] animate-pulse">
            Loading Formz Experience...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white antialiased font-sans select-none overflow-x-hidden relative">
      
      {/* Scope Keyframes and animations */}
      <style>{`
        @keyframes morph-blob {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.08); }
        }
        .morphing-blob-1 {
          animation: morph-blob 12s ease-in-out infinite;
        }
        .morphing-blob-2 {
          animation: morph-blob 16s ease-in-out infinite alternate;
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
        .inner-depth-shadow {
          box-shadow: inset 0 0 40px rgba(0,0,0,0.8);
        }
      `}</style>

      {/* Background drifting stars canvas */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-70"
      />

      {/* Global Background Ambient Blobs for subtle orange hue */}
      {!prefersReducedMotion && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 mix-blend-screen">
          <div className="absolute top-[20%] -left-64 w-[500px] h-[500px] bg-[#FF6B35]/[0.03] rounded-full blur-[130px] morphing-blob-1" />
          <div className="absolute top-[60%] -right-64 w-[600px] h-[600px] bg-[#FF6B35]/[0.02] rounded-full blur-[160px] morphing-blob-2" />
          <div className="absolute bottom-[-10%] left-[30%] w-[800px] h-[400px] bg-[#FF6B35]/[0.02] rounded-full blur-[150px] morphing-blob-1" />
        </div>
      )}


      {/* 1. HERO SECTION & TOP BAR */}
      <div className="relative w-full overflow-hidden bg-[#050505] pb-24 border-b border-[#111111] inner-depth-shadow">
        
        {/* Animated ambient morphing gradient mesh blobs */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-48 left-1/4 w-[450px] h-[450px] bg-[#FF6B35]/8 rounded-full blur-[120px] morphing-blob-1" />
            <div className="absolute top-48 right-1/4 w-[400px] h-[400px] bg-[#FF6B35]/4 rounded-full blur-[140px] morphing-blob-2" />
          </div>
        )}

        {/* Global Navigation Header */}
        <header className="relative max-w-7xl mx-auto px-6 h-24 grid grid-cols-3 items-center z-40">
          {/* Column 1: Logo */}
          <div className="flex justify-start">
            <Link href="/" className="flex items-center shrink-0">
              <img src="/som.svg" alt="Fomz App Logo" className="h-14 w-14 object-contain" />
            </Link>
          </div>

          {/* Column 2: Navigation Links (Centered) */}
          <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-10">
            <a 
              href="#problem" 
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
              className="text-xs font-bold uppercase tracking-widest text-[#A1A1A1] hover:text-white transition-colors relative group"
            >
              The Problem
              <span className="absolute -bottom-1.5 left-0 w-full h-[1.5px] bg-[#FF6B35] scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300"></span>
            </a>
            <a 
              href="#features" 
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
              className="text-xs font-bold uppercase tracking-widest text-[#A1A1A1] hover:text-white transition-colors relative group"
            >
              Conversational Flow
              <span className="absolute -bottom-1.5 left-0 w-full h-[1.5px] bg-[#FF6B35] scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300"></span>
            </a>
            <a 
              href="#demo" 
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
              className="text-xs font-bold uppercase tracking-widest text-[#A1A1A1] hover:text-white transition-colors relative group"
            >
              Live Demo
              <span className="absolute -bottom-1.5 left-0 w-full h-[1.5px] bg-[#FF6B35] scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300"></span>
            </a>
            <a 
              href="#pricing" 
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
              className="text-xs font-bold uppercase tracking-widest text-[#A1A1A1] hover:text-white transition-colors relative group"
            >
              Pricing
              <span className="absolute -bottom-1.5 left-0 w-full h-[1.5px] bg-[#FF6B35] scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300"></span>
            </a>
            <Link 
              href="/explore" 
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
              className="text-xs font-bold uppercase tracking-widest text-[#A1A1A1] hover:text-white transition-colors relative group"
            >
              Explore
              <span className="absolute -bottom-1.5 left-0 w-full h-[1.5px] bg-[#FF6B35] scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300"></span>
            </Link>
          </nav>
          
          {/* Column 3: Action Buttons */}
          <div className="flex items-center justify-end gap-4 lg:gap-6">
            <Link 
              href="/sign-in" 
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
              className="text-xs font-bold uppercase tracking-widest text-[#A1A1A1] hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/sign-up" 
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
              className="bg-[#FF6B35] text-white text-xs font-bold px-6 py-3 rounded-full hover:bg-[#FF6B35]/90 transition-all duration-300 shadow-[0_4px_20px_rgba(255,107,53,0.15)] hover:scale-105"
            >
              Start Free
            </Link>
          </div>
        </header>

        {/* Hero Central Layout */}
        <div className="relative max-w-7xl mx-auto px-6 pt-16 flex flex-col items-center text-center z-20">
          
          {/* Micro-Interaction Tag */}
          <div className="inline-flex items-center gap-2 bg-[#111111] border border-[#222222] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#FF6B35] mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Conversational Forms
          </div>

          <h1 className="text-4xl sm:text-7xl font-black tracking-tighter text-white leading-[1.05] max-w-4xl">
            <ScrambleWord text="Forms that feel like a conversation" />
          </h1>
          
          <p className="mt-8 text-[#A1A1A1] text-lg sm:text-xl max-w-[600px] leading-relaxed font-medium">
            Build beautiful, highly interactive, one-question-at-a-time forms. Elevate conversion rates and delight respondents instantly.
          </p>

          {/* Interactive CTAs */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link 
              href="/sign-up" 
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
              className="bg-[#FF6B35] text-white font-bold px-8 py-4 rounded-full hover:bg-[#FF6B35]/90 transition-all duration-300 flex items-center gap-2 text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(255,107,53,0.2)] hover:scale-105"
            >
              Start Building Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/explore"
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
              className="inline-flex items-center justify-center font-bold px-8 py-4 rounded-full border border-[#222222] bg-[#111] hover:bg-[#161616] text-[#A1A1A1] hover:text-white transition-all duration-300 text-xs uppercase tracking-widest gap-2 hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" /> Explore Public Forms
            </Link>
            <button 
              onClick={() => setVideoOpen(true)}
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
              className="inline-flex items-center justify-center font-bold px-8 py-4 rounded-full border border-[#222222] bg-[#111] hover:bg-[#161616] text-[#A1A1A1] hover:text-white transition-all duration-300 text-xs uppercase tracking-widest gap-2 hover:scale-105"
            >
              <Play className="w-3.5 h-3.5 text-[#FF6B35]" /> See How It Works
            </button>
          </div>

          {/* 3D-Tilted Interactive Glassmorphism Form Card */}
          <div 
            onMouseMove={handle3DCardMove}
            onMouseLeave={reset3DCard}
            style={{
              transform: prefersReducedMotion ? "none" : `perspective(1000px) rotateX(${rotate3d.x}deg) rotateY(${rotate3d.y}deg)`,
              transition: "transform 150ms ease-out"
            }}
            className="mt-20 w-full max-w-lg bg-white/[0.02] backdrop-blur-2xl p-8 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 text-left relative overflow-hidden"
          >
            
            {showConfetti && (
              <div className="absolute inset-0 bg-[#FF6B35]/5 pointer-events-none flex items-center justify-center animate-pulse">
                <div className="text-[#FF6B35] text-xs font-black tracking-widest uppercase">🎉 Response Confetti!</div>
              </div>
            )}

            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B35] flex items-center gap-1.5">
                <Activity className="w-3 h-3 animate-pulse" />
                {demoFinished ? "DEMO SUBMITTED" : `PREVIEW QUESTION ${demoStep + 1} OF 3`}
              </span>
              <span className="text-[10px] font-bold text-[#666]">3D Glassmorphic Interface</span>
            </div>

            {!demoFinished ? (
              <form onSubmit={handleDemoNext} className="flex flex-col gap-6">
                
                {demoStep === 0 && (
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-bold text-white tracking-wide">
                      What is your work email address?
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@company.com"
                      value={demoEmail}
                      onChange={(e) => setDemoEmail(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 px-4 py-3.5 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B35] transition-colors placeholder:text-[#444]"
                    />
                  </div>
                )}

                {demoStep === 1 && (
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-bold text-white tracking-wide">
                      What form builder feature matters most to you?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Conversational UX", "Smart Branching Logic", "Custom Branding", "Real-time Analytics"].map((feat) => (
                        <button
                          key={feat}
                          type="button"
                          onClick={() => setDemoFeedback(feat)}
                          className={`p-3 text-xs font-semibold rounded-xl text-left border transition-all ${
                            demoFeedback === feat 
                              ? "bg-[#FF6B35]/15 border-[#FF6B35] text-white" 
                              : "bg-black/30 border-white/5 text-[#A1A1A1] hover:border-white/15"
                          }`}
                        >
                          {feat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {demoStep === 2 && (
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-bold text-white tracking-wide">
                      What is your biggest pain point with traditional forms?
                    </label>
                    <textarea
                      required
                      placeholder="e.g. low completion rates, confusing layouts..."
                      value={demoPainPoint}
                      onChange={(e) => setDemoPainPoint(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 px-4 py-3.5 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B35] transition-colors h-24 resize-none placeholder:text-[#444]"
                      autoFocus
                    />
                  </div>
                )}

                <button
                  type="submit"
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                  className="w-full py-4 bg-[#FF6B35] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#FF6B35]/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B35]/10"
                >
                  {demoStep === 2 ? "Finish & Submit" : "Next Question"} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center text-center py-6 gap-5">
                <div className="w-14 h-14 rounded-full bg-[#FF6B35]/15 flex items-center justify-center">
                  <Check className="w-6 h-6 text-[#FF6B35]" />
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="text-lg font-bold text-white">Thank you!</h4>
                  <p className="text-xs text-[#A1A1A1] max-w-sm leading-relaxed">
                    That is exactly what your form respondents will experience — sleek, simple, and satisfying.
                  </p>
                </div>
                <div className="flex gap-2 w-full mt-4">
                  <button
                    onClick={resetDemo}
                    className="flex-1 py-3 bg-black/40 hover:bg-black/60 border border-white/10 text-[#A1A1A1] hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                  >
                    Test Again
                  </button>
                  <Link
                    href="/sign-up"
                    className="flex-1 py-3 bg-[#FF6B35] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#FF6B35]/90 text-center transition-all shadow-md"
                  >
                    Build Form Now
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 2. DOUBLE ROW INFINITE USE-CASE MARQUEE */}
      <section className="bg-[#0A0A0A] py-10 border-b border-[#111] overflow-hidden relative">
        <div className="flex flex-col gap-4">
          
          {/* Row 1: Left drift */}
          <div className="flex whitespace-nowrap gap-6 animate-marquee-left">
            {Array(3).fill(["Product Feedback", "User Research", "Event Registration", "Lead Generation", "UX Survey", "Sign-up forms", "Quick Polls", "Course Quiz", "Contact Details"]).flat().map((usecase, idx) => (
              <span 
                key={idx} 
                className="text-[10px] font-black uppercase tracking-widest text-[#666] hover:text-[#FF6B35] hover:border-[#FF6B35]/30 transition-all duration-300 px-6 py-3 bg-[#111] border border-white/5 rounded-full"
              >
                ✦ {usecase}
              </span>
            ))}
          </div>

          {/* Row 2: Right drift */}
          <div className="flex whitespace-nowrap gap-6 animate-marquee-right">
            {Array(3).fill(["Employee Feedback", "RSVP Form", "Job Application", "Waitlist Signups", "NPS Survey", "Product Feedback", "Quiz Builder", "Bug Report", "Customer Support Form"]).flat().map((usecase, idx) => (
              <span 
                key={idx} 
                className="text-[10px] font-black uppercase tracking-widest text-[#666] hover:text-[#FF6B35] hover:border-[#FF6B35]/30 transition-all duration-300 px-6 py-3 bg-[#111] border border-white/5 rounded-full"
              >
                ✦ {usecase}
              </span>
            ))}
          </div>

        </div>
      </section>

      {/* 3. PROBLEM SECTION */}
      <section 
        id="problem" 
        ref={problemRef} 
        className="py-32 max-w-7xl mx-auto px-6 flex flex-col gap-16 transition-all duration-1000 transform"
      >
        <div className="max-w-2xl flex flex-col gap-3">
          <span className="text-xs uppercase tracking-widest text-[#FF6B35] font-black">
            The standard form friction
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
            Why standard forms fail to perform.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <AlertTriangle className="w-6 h-6 text-[#FF6B35]" />,
              title: "Visual Overwhelm",
              desc: "Throwing 20 fields at a visitor immediately spikes bounce rates. Attention is a rare commodity."
            },
            {
              icon: <HelpCircle className="w-6 h-6 text-[#FF6B35]" />,
              title: "The abandonment wall",
              desc: "Without conditional pathings, users fill out irrelevant questions. They feel ignored, then they close the tab."
            },
            {
              icon: <Laptop className="w-6 h-6 text-[#FF6B35]" />,
              title: "Dull and unengaging",
              desc: "Static fields, standard checkmarks, and simple buttons feel like filling out spreadsheet rows. It lacks personality."
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="bg-[#111111] p-8 rounded-2xl flex flex-col gap-5 border border-white/5 hover:border-[#FF6B35]/20 hover:-translate-y-1.5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center border border-white/5">
                {item.icon}
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-lg font-bold text-white tracking-wide">{item.title}</h4>
                <p className="text-xs text-[#A1A1A1] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SOLUTION SECTION */}
      <section 
        id="features" 
        ref={solutionRef} 
        className="py-32 bg-[#0A0A0A] border-y border-[#111] transition-all duration-1000 transform"
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-16">
          <div className="max-w-2xl flex flex-col gap-3">
            <span className="text-xs uppercase tracking-widest text-[#FF6B35] font-black">
              The Formz advantage
            </span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
              Engineered for natural interaction.
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* Main horizontal flow display */}
            <div className="bg-[#111111] p-8 sm:p-12 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-12 border border-white/5">
              <div className="max-w-md flex flex-col gap-5">
                <h3 className="text-2xl font-bold text-white tracking-wide">Conversational Focus</h3>
                <p className="text-xs text-[#A1A1A1] leading-relaxed">
                  By collapsing long forms down to a sequence of elegant one-field panels, respondents focus completely on one detail at a time. The result is higher engagement, minimal drop-offs, and incredibly clean data.
                </p>
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#FF6B35] bg-[#FF6B35]/5 px-3 py-1.5 rounded-lg self-start mt-2">
                  <span>✦ 60%+ average conversion improvement</span>
                </div>
              </div>
              <div className="w-full lg:w-96 aspect-video bg-[#050505] border border-white/5 rounded-2xl flex items-center justify-center p-6 relative overflow-hidden">
                <div className="w-full flex flex-col gap-3">
                  <span className="text-[9px] text-[#FF6B35] font-black uppercase tracking-wider">Step 2: Experience</span>
                  <div className="h-[2px] bg-[#FF6B35] w-2/3 rounded-full mb-1" />
                  <span className="text-xs font-bold text-white">What type of form is this?</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-[#111] border border-[#FF6B35]/30 p-2 rounded text-[10px] text-center text-white font-semibold">Conversational</div>
                    <div className="bg-[#111] border border-white/5 p-2 rounded text-[10px] text-center text-[#666]">Traditional</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid of features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-[#111] p-8 rounded-2xl flex flex-col gap-4 border border-white/5 hover:border-[#FF6B35]/20 hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-black border border-white/5 flex items-center justify-center">
                  <Sliders className="w-5 h-5 text-[#FF6B35]" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">Smart Conditional Logic</h3>
                <p className="text-xs text-[#A1A1A1] leading-relaxed">
                  Route respondents dynamically along customized question paths based on prior answers. Deliver custom experiences for every visitor.
                </p>
              </div>

              <div className="bg-[#111] p-8 rounded-2xl flex flex-col gap-4 border border-white/5 hover:border-[#FF6B35]/20 hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-black border border-white/5 flex items-center justify-center">
                  <Layout className="w-5 h-5 text-[#FF6B35]" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">Dynamic Style Customizer</h3>
                <p className="text-xs text-[#A1A1A1] leading-relaxed">
                  Control everything from active glows, alignment, spacing, gradients, and custom brand logos. Match your web application's identity completely.
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 5. DYNAMIC FULL-BLEED DEMO */}
      <section 
        id="demo" 
        ref={demoRef} 
        className="py-32 max-w-7xl mx-auto px-6 flex flex-col items-center gap-16 transition-all duration-1000 transform"
      >
        <div className="text-center max-w-xl flex flex-col gap-3">
          <span className="text-xs uppercase tracking-widest text-[#FF6B35] font-black">
            Test the interface
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">
            Interact with the Formz experience.
          </h2>
        </div>

        {/* Embedded Dynamic Mock Conversational Demo Card */}
        <div className="w-full max-w-2xl bg-[#111111] border border-white/5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden relative">
          
          <div className="absolute top-5 right-5 bg-[#FF6B35]/15 text-[#FF6B35] text-[9px] font-black tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#FF6B35] animate-pulse" /> Active Sessions: {responseCounter}
          </div>

          <div className="h-2 w-full bg-black/60">
            <div 
              className="h-full bg-[#FF6B35] transition-all duration-500" 
              style={{ width: demoFinished ? "100%" : `${((demoStep + 1) / 3) * 100}%` }}
            />
          </div>

          <div className="p-8 sm:p-14 min-h-[340px] flex flex-col justify-between">
            {!demoFinished ? (
              <div className="flex flex-col gap-6">
                <span className="text-xs font-black text-[#FF6B35] uppercase tracking-widest">
                  Question {demoStep + 1} of 3
                </span>
                
                {demoStep === 0 && (
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      First, what is your email?
                    </h3>
                    <input
                      type="email"
                      value={demoEmail}
                      onChange={(e) => setDemoEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="bg-transparent border-b-2 border-white/5 focus:border-[#FF6B35] text-lg sm:text-2xl py-3 focus:outline-none text-white transition-colors placeholder:text-[#444]"
                    />
                  </div>
                )}

                {demoStep === 1 && (
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      What form feature do you value most?
                    </h3>
                    <input
                      type="text"
                      value={demoFeedback}
                      onChange={(e) => setDemoFeedback(e.target.value)}
                      placeholder="e.g. conversational flow, analytics, or layouts"
                      className="bg-transparent border-b-2 border-white/5 focus:border-[#FF6B35] text-lg sm:text-2xl py-3 focus:outline-none text-white transition-colors placeholder:text-[#444]"
                      autoFocus
                    />
                  </div>
                )}

                {demoStep === 2 && (
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      Lastly, what is your biggest form pain point?
                    </h3>
                    <input
                      type="text"
                      value={demoPainPoint}
                      onChange={(e) => setDemoPainPoint(e.target.value)}
                      placeholder="e.g. drop-offs, visual clutter, zero insights"
                      className="bg-transparent border-b-2 border-white/5 focus:border-[#FF6B35] text-lg sm:text-2xl py-3 focus:outline-none text-white transition-colors placeholder:text-[#444]"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-6 py-8">
                <div className="w-16 h-16 rounded-full bg-[#FF6B35]/15 flex items-center justify-center">
                  <Check className="w-8 h-8 text-[#FF6B35]" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-black text-white tracking-tight">Response recorded successfully!</h3>
                  <p className="text-xs text-[#A1A1A1] max-w-sm leading-relaxed">
                    This interactive workflow shows how natural form-filling can feel. Ready to build yours?
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 border-t border-white/5 pt-6 mt-8">
              {!demoFinished ? (
                <>
                  {demoStep > 0 && (
                    <button
                      type="button"
                      onClick={() => setDemoStep((s) => s - 1)}
                      className="text-xs font-bold uppercase tracking-widest text-[#666] hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDemoNext}
                    onMouseEnter={() => setCursorHovered(true)}
                    onMouseLeave={() => setCursorHovered(false)}
                    className="bg-[#FF6B35] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#FF6B35]/90 transition-colors text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <button
                    onClick={resetDemo}
                    className="px-6 py-3 border border-white/5 bg-black/40 hover:bg-black/80 text-[#A1A1A1] font-bold text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                  >
                    Try Again
                  </button>
                  <Link
                    href="/sign-up"
                    className="px-6 py-3 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-bold text-xs uppercase tracking-widest rounded-xl text-center transition-colors shadow-md"
                  >
                    Create Free Account
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      <section 
        id="pricing" 
        ref={pricingPlaceholderRef} 
        className="pt-20 pb-12 bg-[#0A0A0A] border-y border-[#111] transition-all duration-1000 transform relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center relative z-10">
          
          <h2 className="text-[40px] font-bold text-white text-center">
            Simple pricing. No surprises.
          </h2>
          <p className="text-[18px] text-[#A1A1A1] text-center max-w-[480px] mt-4">
            Start free. Upgrade when you're ready.
          </p>

          {/* Toggle */}
          <div className="mt-8 mb-12 flex items-center gap-2 bg-[#161616] p-1 rounded-full border border-[#1F1F1F]">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${!isYearly ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-transparent text-[#666] hover:text-[#A1A1A1]'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${isYearly ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-transparent text-[#666] hover:text-[#A1A1A1]'}`}
            >
              Yearly
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${isYearly ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-400'}`}>Save 20%</span>
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full text-left">
            
            {/* Starter */}
            <div className={`bg-[#161616] rounded-[20px] p-8 border border-[#1F1F1F] flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-300 ${prefersReducedMotion ? '' : 'hover:border-[#2A2A2A] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]'}`}>
              <h3 className="text-[24px] font-bold text-white">Starter</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-[36px] font-bold text-white">$0</span>
                <span className="text-[16px] text-[#666]">/mo</span>
              </div>
              <p className="text-[14px] text-[#666] mt-1 mb-6 border-b border-[#1F1F1F] pb-6">Free forever</p>
              <ul className="flex-1 flex flex-col gap-3">
                {['3 forms', '100 responses/mo', 'Basic analytics', 'Formz branding'].map((feat, i) => (
                  <li key={i} className="flex items-center text-[15px] text-[#A1A1A1] leading-[2.2]">
                    <Check className="w-4 h-4 text-[#22C55E] mr-3 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <button className="w-full mt-8 py-3 px-6 rounded-xl border border-[#2A2A2A] bg-transparent text-white font-bold transition-colors cursor-pointer hover:bg-[#1A1A1A] hover:border-[#3A3A3A] focus:ring-2 focus:ring-white/20 outline-none">
                Get Started
              </button>
            </div>

            {/* Pro */}
            <div className={`order-first lg:order-none relative bg-[#161616] rounded-[20px] p-8 border-x border-b border-t-[3px] border-x-[#1F1F1F] border-b-[#1F1F1F] border-t-[#FF6B35] flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-300 ${prefersReducedMotion ? '' : 'hover:scale-[1.02] hover:-translate-y-1'}`}
                 style={!prefersReducedMotion ? { boxShadow: "0 0 40px rgba(255,107,53,0.08)" } : {}}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B35] text-white text-[12px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                ★ Most Popular
              </div>
              <h3 className="text-[24px] font-bold text-white mt-2">Pro</h3>
              <div className="mt-2 flex items-baseline gap-1 relative overflow-hidden h-12">
                <div className={`transition-transform duration-300 absolute inset-0 flex items-baseline gap-1 ${isYearly ? '-translate-y-full' : 'translate-y-0'}`}>
                  <span className="text-[36px] font-bold text-white">$12</span>
                  <span className="text-[16px] text-[#666]">/mo</span>
                </div>
                <div className={`transition-transform duration-300 absolute inset-0 flex items-baseline gap-1 ${isYearly ? 'translate-y-0' : 'translate-y-full'}`}>
                  <span className="text-[36px] font-bold text-white">$9</span>
                  <span className="text-[16px] text-[#666]">/mo</span>
                </div>
              </div>
              <p className="text-[14px] text-[#666] mt-1 mb-6 border-b border-[#1F1F1F] pb-6">Billed {isYearly ? 'yearly' : 'monthly'}</p>
              <ul className="flex-1 flex flex-col gap-3">
                {['Unlimited forms', 'Unlimited responses', 'Advanced analytics', 'Custom branding', 'Logic & branching', 'File uploads', 'API access', 'Webhooks'].map((feat, i) => (
                  <li key={i} className="flex items-center text-[15px] text-[#A1A1A1] leading-[2.2]">
                    <Check className="w-4 h-4 text-[#22C55E] mr-3 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <button className="w-full mt-8 py-3 px-6 rounded-xl bg-[#FF6B35] text-white text-[14px] font-bold transition-all cursor-pointer hover:brightness-110 hover:shadow-[0_4px_20px_rgba(255,107,53,0.3)] focus:ring-2 focus:ring-[#FF6B35]/50 outline-none">
                Start Free Trial →
              </button>
            </div>

            {/* Team */}
            <div className={`md:col-span-2 lg:col-span-1 bg-[#161616] rounded-[20px] p-8 border border-[#1F1F1F] flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-300 ${prefersReducedMotion ? '' : 'hover:border-[#2A2A2A] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]'}`}>
              <h3 className="text-[24px] font-bold text-white">Team</h3>
              <div className="mt-2 flex items-baseline gap-1 relative overflow-hidden h-12">
                <div className={`transition-transform duration-300 absolute inset-0 flex items-baseline gap-1 ${isYearly ? '-translate-y-full' : 'translate-y-0'}`}>
                  <span className="text-[36px] font-bold text-white">$39</span>
                  <span className="text-[16px] text-[#666]">/mo</span>
                </div>
                <div className={`transition-transform duration-300 absolute inset-0 flex items-baseline gap-1 ${isYearly ? 'translate-y-0' : 'translate-y-full'}`}>
                  <span className="text-[36px] font-bold text-white">$31</span>
                  <span className="text-[16px] text-[#666]">/mo</span>
                </div>
              </div>
              <p className="text-[14px] text-[#666] mt-1 mb-6 border-b border-[#1F1F1F] pb-6">Billed {isYearly ? 'yearly' : 'monthly'}</p>
              <ul className="flex-1 flex flex-col gap-3">
                {['Everything in Pro', '5 team members', 'SSO & SAML', 'Priority support', 'Dedicated onboarding'].map((feat, i) => (
                  <li key={i} className="flex items-center text-[15px] text-[#A1A1A1] leading-[2.2]">
                    <Check className="w-4 h-4 text-[#22C55E] mr-3 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <button className="w-full mt-8 py-3 px-6 rounded-xl border border-[#2A2A2A] bg-transparent text-white font-bold transition-colors cursor-pointer hover:bg-[#1A1A1A] hover:border-[#3A3A3A] focus:ring-2 focus:ring-white/20 outline-none">
                Contact Sales
              </button>
            </div>

          </div>
          
          <p className="mt-12 text-center text-[#666] text-[11px] uppercase tracking-wider font-bold max-w-2xl border border-[#1F1F1F] bg-[#161616] px-6 py-4 rounded-xl shadow-md">
            * By decree of Lord Gwyn-first lord of cinder and king of Anor Londo:<br/> These features are all available for free to all common non-hollow folks of Anor Londo. Use all features to your heart's content.
          </p>
        </div>
      </section>

      {/* {<section 
        ref={finalCtaRef} 
        className="relative py-36 bg-[#050505] overflow-hidden text-center transition-all duration-1000 transform"
      >
        <div className="relative max-w-2xl mx-auto px-6 flex flex-col items-center gap-6 z-20">
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Build forms that feel like a conversation.
          </h2>
          
          <p className="text-xs text-[#666] uppercase tracking-widest font-black max-w-md mt-2">
            Questions, integrations, or support? hello@formz.io — we reply instantly.
          </p>

          <div className="flex flex-col items-center gap-4 mt-6">
            <Link 
              href="/sign-up" 
              onMouseEnter={() => setCursorHovered(true)}
              onMouseLeave={() => setCursorHovered(false)}
              className="bg-[#FF6B35] text-white font-bold px-10 py-4.5 rounded-full hover:bg-[#FF6B35]/90 transition-all duration-300 flex items-center gap-2 tracking-widest cursor-pointer shadow-[0_10px_35px_rgba(255,107,53,0.25)] text-xs uppercase hover:scale-105"
            >
              Get Started Instantly <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>} */}

      {/* 8. FOOTER */}
      <footer className="bg-transparent py-20 text-[#A1A1A1] border-t border-[#111]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-12">
          
          <div className="col-span-2 flex flex-col gap-4">
            <img src="/som.svg" alt="Formz App Logo" className="h-9 w-auto self-start" />
            <p className="text-xs leading-relaxed text-[#555] max-w-xs font-semibold">
              By legal decree of the Knights of Catarina & Solaire of Astora, this grossly incandescent property is licensed to all Hollows and Tarnished folk. \[T]/
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B35]">Product</span>
            <a href="#problem" className="text-xs text-[#555] hover:text-white transition-colors">The Problem</a>
            <a href="#features" className="text-xs text-[#555] hover:text-white transition-colors">Conversational Flow</a>
            <a href="#demo" className="text-xs text-[#555] hover:text-white transition-colors">Interactive Demo</a>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B35]">Developer</span>
            <span className="text-xs text-[#555] hover:text-white transition-colors cursor-pointer">Documentation</span>
            <span className="text-xs text-[#555] hover:text-white transition-colors cursor-pointer">Guides & APIs</span>
            <span className="text-xs text-[#555] hover:text-white transition-colors cursor-pointer">Status Updates</span>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B35]">Legal</span>
            <span className="text-xs text-[#555] hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span className="text-xs text-[#555] hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            <span className="text-xs text-[#555] hover:text-white transition-colors cursor-pointer">Data Compliance</span>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-[#111] mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[10px] uppercase tracking-wider text-[#444] font-black">
            &copy; {new Date().getFullYear()} Formz. All rights reserved.
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#444] font-black">
            Formz Conversational Technologies Inc.
          </span>
        </div>
      </footer>

      {/* 9. DETAILED VIDEO MODAL PLAYER */}
      {videoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
          <div className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 bg-black/40 border-b border-white/5">
              <span className="text-xs font-black uppercase tracking-widest text-[#FF6B35]">Formz Product Tour</span>
              <button 
                onClick={() => setVideoOpen(false)}
                className="p-1 rounded-full bg-white/5 text-[#A1A1A1] hover:text-white transition-colors hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-md flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#FF6B35]/10 flex items-center justify-center border border-[#FF6B35]/20">
                  <Play className="w-8 h-8 text-[#FF6B35]" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">YouTube Tour Video Placeholder</h3>
                <p className="text-xs text-[#A1A1A1] leading-relaxed">
                  We will link your live high-resolution YouTube product walkthrough video asset right here as soon as you upload it.
                </p>
                <button
                  onClick={() => setVideoOpen(false)}
                  className="mt-2 bg-[#FF6B35] text-white font-bold px-6 py-2.5 rounded-full hover:bg-[#FF6B35]/90 transition-all text-xs uppercase tracking-widest"
                >
                  Close Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lava Glow at Absolute Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[1000px] pointer-events-none z-0 bg-gradient-to-t from-[#FF6B35]/40 via-[#FF6B35]/10 to-transparent blur-[160px] mix-blend-screen" />
      <div className="absolute bottom-0 left-0 right-0 h-[250px] pointer-events-none z-0 bg-[#FF6B35]/60 blur-[120px] mix-blend-screen" />

      {/* Dark Souls Bonfire Image at Bottom Right */}
      <div className="absolute bottom-0 right-0 z-10 pointer-events-none">
        <img 
          src="/dark-souls-bonfire.png" 
          alt="Character at bonfire" 
          className="w-64 md:w-96 h-auto opacity-90 object-contain drop-shadow-2xl"
        />
      </div>

    </div>
  );
}
