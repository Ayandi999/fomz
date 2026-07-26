import React from "react";

const strokeProps = {
  fill: "none",
  stroke: "#111",
  strokeWidth: "2.5",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  vectorEffect: "non-scaling-stroke",
};

export const SketchyStar = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`}>
    <path d="M 50,10 L 60,40 L 95,40 L 65,60 L 75,95 L 50,75 L 25,95 L 35,60 L 5,40 L 40,40 Z" {...strokeProps} />
  </svg>
);

export const SketchyArrow = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`}>
    <path d="M 10,80 Q 40,50 80,20" {...strokeProps} />
    <path d="M 60,15 L 85,15 L 75,40" {...strokeProps} />
  </svg>
);

export const SketchyCrown = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`}>
    <path d="M 10,80 L 15,30 L 40,50 L 50,20 L 60,50 L 85,30 L 90,80 Z" {...strokeProps} />
  </svg>
);

export const SketchyHeart = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`}>
    <path d="M 50,30 C 50,10 20,10 10,30 C 0,55 50,90 50,90 C 50,90 100,55 90,30 C 80,10 50,10 50,30" {...strokeProps} />
  </svg>
);

export const SketchySwirl = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`}>
    <path d="M 50,50 C 40,40 30,60 50,70 C 80,80 90,30 50,20 C 0,10 -10,90 60,95" {...strokeProps} />
  </svg>
);

export const SketchySparkle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`}>
    <path d="M 50,10 C 50,40 40,50 10,50 C 40,50 50,60 50,90 C 50,60 60,50 90,50 C 60,50 50,40 50,10" {...strokeProps} />
  </svg>
);

export const SketchyCloud = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`}>
    <path d="M 30,60 C 20,60 10,50 15,35 C 20,20 40,15 50,25 C 60,10 85,15 90,35 C 95,50 80,60 70,60 Z" {...strokeProps} />
  </svg>
);

export const SketchyQuestionMark = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`}>
    <path d="M 30,35 C 30,10 70,10 70,35 C 70,55 50,60 50,75" {...strokeProps} />
    <circle cx="50" cy="90" r="5" fill="#111" />
  </svg>
);

export const SketchyExclamation = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`}>
    <path d="M 50,10 L 45,70 L 55,70 Z" {...strokeProps} fill="#111" />
    <circle cx="50" cy="90" r="6" fill="#111" />
  </svg>
);

export const SketchyDiamond = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`}>
    <path d="M 50,10 L 90,40 L 50,90 L 10,40 Z" {...strokeProps} />
    <path d="M 10,40 L 90,40" {...strokeProps} />
    <path d="M 30,25 L 50,90 L 70,25" {...strokeProps} />
  </svg>
);
