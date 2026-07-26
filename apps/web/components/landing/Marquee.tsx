import React from "react";
import { SketchyButtonGroup, SketchyDivider, HeavyPencilCircle } from "./SketchyUI";

export function Marquee() {
  const row1 = ["Product Feedback", "User Research", "Event Registration", "Lead Generation", "UX Survey", "Sign-up forms", "Quick Polls", "Course Quiz", "Contact Details"];
  const row2 = ["Employee Feedback", "RSVP Form", "Job Application", "Waitlist Signups", "NPS Survey", "Product Feedback", "Quiz Builder", "Bug Report", "Customer Support Form"];

  return (
    <section className="bg-transparent py-14 overflow-hidden relative">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Top (2) */}
        <path d="M -5,1 L 105,3" stroke="#111" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M -5,3 L 105,1" stroke="#111" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" opacity="0.8" />
        {/* Bottom (2) */}
        <path d="M -5,99 L 105,97" stroke="#111" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M -5,97 L 105,99" stroke="#111" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" opacity="0.8" />
      </svg>
      <div className="flex flex-col gap-8 relative z-10">
        
        {/* Row 1: Left drift */}
        <div className="flex whitespace-nowrap gap-6 animate-marquee-left w-max">
          {Array(3).fill(row1).flat().map((usecase, idx) => (
            <SketchyButtonGroup key={`row1-${idx}`} className="py-1">
              <span className="relative group inline-flex items-center justify-center font-bold px-8 py-4 transition-all duration-300 text-black text-[10px] uppercase tracking-widest hover:bg-black/5">
                ✦ {usecase}
                <HeavyPencilCircle />
              </span>
            </SketchyButtonGroup>
          ))}
        </div>

        {/* Row 2: Right drift */}
        <div className="flex whitespace-nowrap gap-6 animate-marquee-right w-max">
          {Array(3).fill(row2).flat().map((usecase, idx) => (
            <SketchyButtonGroup key={`row2-${idx}`} className="py-1">
              <span className="relative group inline-flex items-center justify-center font-bold px-8 py-4 transition-all duration-300 text-black text-[10px] uppercase tracking-widest hover:bg-black/5">
                ✦ {usecase}
                <HeavyPencilCircle />
              </span>
            </SketchyButtonGroup>
          ))}
        </div>

      </div>
    </section>
  );
}
