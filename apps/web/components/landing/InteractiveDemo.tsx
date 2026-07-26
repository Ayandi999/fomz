"use client";
import { useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Check } from "lucide-react";

export function InteractiveDemo() {
  const [demoStep, setDemoStep] = useState(0);
  const [demoEmail, setDemoEmail] = useState("");
  const [demoFeedback, setDemoFeedback] = useState("");
  const [demoPainPoint, setDemoPainPoint] = useState("");
  const [demoFinished, setDemoFinished] = useState(false);
  const [responseCounter, setResponseCounter] = useState(1234);
  const [cursorHovered, setCursorHovered] = useState(false);

  const handleDemoNext = () => {
    if (demoStep < 2) {
      setDemoStep(s => s + 1);
    } else {
      setDemoFinished(true);
      setResponseCounter(prev => prev + 1);
    }
  };

  const resetDemo = () => {
    setDemoStep(0);
    setDemoEmail("");
    setDemoFeedback("");
    setDemoPainPoint("");
    setDemoFinished(false);
  };

  return (
    <section 
      id="demo" 
      className="relative animate-on-scroll opacity-0 translate-y-16 py-32 w-full px-6 flex flex-col items-center gap-16 transition-all duration-1000 transform overflow-hidden"
    >
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-center px-4">
        Experience Fromz for yourself
      </h2>

      {/* Embedded Dynamic Mock Conversational Demo Card */}
      <div className="w-[95%] max-w-7xl mx-auto bg-white/60 border border-black/5 rounded-none shadow-xl overflow-hidden relative min-h-[400px] font-sans">
        
        <div className="h-2 w-full bg-black/10">
          <div 
            className="h-full bg-[#1E3A8A] transition-all duration-500" 
            style={{ width: demoFinished ? "100%" : `${((demoStep + 1) / 3) * 100}%` }}
          />
        </div>

        <div className="p-8 sm:p-14 min-h-[200px] flex flex-col justify-between">
          {!demoFinished ? (
            <div className="flex flex-col gap-6">
              <span className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">
                Question {demoStep + 1} of 3
              </span>
              
              {demoStep === 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl sm:text-3xl font-black text-[#111] tracking-tight leading-tight">
                    First, what is your email?
                  </h3>
                  <input
                    type="email"
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="bg-transparent border-b-2 border-black/5 focus:border-[#1E3A8A] text-lg sm:text-2xl py-3 focus:outline-none text-[#111] transition-colors placeholder:text-gray-400"
                  />
                </div>
              )}

              {demoStep === 1 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl sm:text-3xl font-black text-[#111] tracking-tight leading-tight">
                    What form feature do you value most?
                  </h3>
                  <input
                    type="text"
                    value={demoFeedback}
                    onChange={(e) => setDemoFeedback(e.target.value)}
                    placeholder="e.g. conversational flow, analytics, or layouts"
                    className="bg-transparent border-b-2 border-black/5 focus:border-[#1E3A8A] text-lg sm:text-2xl py-3 focus:outline-none text-[#111] transition-colors placeholder:text-gray-400"
                    autoFocus
                  />
                </div>
              )}

              {demoStep === 2 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl sm:text-3xl font-black text-[#111] tracking-tight leading-tight">
                    Lastly, what is your biggest form pain point?
                  </h3>
                  <input
                    type="text"
                    value={demoPainPoint}
                    onChange={(e) => setDemoPainPoint(e.target.value)}
                    placeholder="e.g. drop-offs, visual clutter, zero insights"
                    className="bg-transparent border-b-2 border-black/5 focus:border-[#1E3A8A] text-lg sm:text-2xl py-3 focus:outline-none text-[#111] transition-colors placeholder:text-gray-400"
                    autoFocus
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-6 py-8">
              <div className="w-16 h-16 rounded-full bg-[#1E3A8A]/15 flex items-center justify-center">
                <Check className="w-8 h-8 text-[#1E3A8A]" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-black text-[#111] tracking-tight">Response recorded successfully!</h3>
                <p className="text-xs text-gray-600 max-w-sm leading-relaxed">
                  This interactive workflow shows how natural form-filling can feel. Ready to build yours?
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 border-t border-black/5 pt-6 mt-8">
            {!demoFinished ? (
              <>
                {demoStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setDemoStep((s) => s - 1)}
                    className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors cursor-pointer bg-transparent border-none"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDemoNext}
                  onMouseEnter={() => setCursorHovered(true)}
                  onMouseLeave={() => setCursorHovered(false)}
                  className="bg-[#1E3A8A] text-white font-bold px-8 py-3.5 rounded-none hover:bg-[#1E3A8A]/90 transition-colors text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-md"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <button
                  onClick={resetDemo}
                  className="px-6 py-3 border border-black/5 bg-white/60 hover:bg-white/80 text-gray-600 font-bold text-xs uppercase tracking-widest rounded-none transition-colors cursor-pointer"
                >
                  Try Again
                </button>
                <Link
                  href="/sign-up"
                  className="px-6 py-3 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold text-xs uppercase tracking-widest rounded-none text-center transition-colors shadow-md"
                >
                  Create Free Account
                </Link>
              </div>
            )}
          </div>

      </div>
      </div>

      {/* Bottom sketchy line */}
      <svg className="absolute bottom-0 left-0 w-full h-4 pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M -5,50 L 105,40" stroke="#111" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M -5,40 L 105,50" stroke="#111" strokeWidth="1.5" fill="none" opacity="0.8" vectorEffect="non-scaling-stroke" />
      </svg>
    </section>
  );
}
