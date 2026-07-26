"use client";

import React from "react";

export const SketchyDivider = () => (
  <div className="relative w-6 h-auto shrink-0 flex items-center justify-center">
    <svg className="absolute w-full h-[140%] -top-[20%] pointer-events-none overflow-visible" viewBox="0 0 10 100" preserveAspectRatio="none">
      <path d="M 5,10 Q 4,50 6,90" stroke="#111" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
      <path d="M 6,15 Q 5,50 4,85" stroke="#111" strokeWidth="1" fill="none" opacity="0.6" vectorEffect="non-scaling-stroke" />
      <path d="M 3,90 Q 5,100 7,85" stroke="#111" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  </div>
);

export const SketchyButtonGroup = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`relative inline-flex items-stretch justify-center ${className}`}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Top lines */}
        <path d="M -5,2 Q 50,-2 105,3" stroke="#111" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M -2,6 Q 50,2 102,7" stroke="#111" strokeWidth="1" fill="none" opacity="0.6" vectorEffect="non-scaling-stroke" />
        
        {/* Bottom lines */}
        <path d="M -5,100 Q 50,102 105,100" stroke="#111" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M -2,96 Q 50,98 102,97" stroke="#111" strokeWidth="1" fill="none" opacity="0.6" vectorEffect="non-scaling-stroke" />

        {/* Left lines */}
        <path d="M 0,-15 L 0.5,115" stroke="#111" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M 0.2,-5 L 0.8,105" stroke="#111" strokeWidth="1" fill="none" opacity="0.6" vectorEffect="non-scaling-stroke" />

        {/* Right lines */}
        <path d="M 100,-10 L 99.5,110" stroke="#111" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M 99.8,-5 L 99.2,105" stroke="#111" strokeWidth="1" fill="none" opacity="0.6" vectorEffect="non-scaling-stroke" />
      </svg>
      
      <div className="relative z-10 flex items-stretch justify-center">
        {children}
      </div>
    </div>
  );
};

export const HeavyPencilCircle = () => (
  <svg 
    className="absolute inset-0 pointer-events-none heavy-pencil-circle -rotate-2" 
    style={{ 
      width: 'calc(100% + 24px)', 
      height: 'calc(100% + 16px)', 
      left: '-12px', 
      top: '-8px' 
    }}
    viewBox="0 0 100 100" 
    preserveAspectRatio="none"
  >
    <style>{`
      .heavy-pencil-circle path {
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        transition: stroke-dashoffset 0.6s cubic-bezier(0.3, 0, 0, 1), opacity 0.2s ease;
      }
      .group:hover .heavy-pencil-circle path {
        stroke-dashoffset: 0;
      }
    `}</style>
    <path 
      d="M 15 90 C 50 100, 85 95, 90 70 C 95 40, 90 5, 50 10 C 15 15, 5 40, 10 70 C 15 95, 50 105, 85 85 C 105 50, 95 0, 50 5 C 5 10, -5 50, 15 80"
      fill="none" 
      stroke="#111" 
      strokeWidth="2.5"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      className="opacity-0 group-hover:opacity-100"
    />
  </svg>
);
