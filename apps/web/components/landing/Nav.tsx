import Link from "next/link";
import { useState } from "react";

const PencilCircle = () => (
  <svg 
    className="absolute inset-0 pointer-events-none pencil-circle" 
    style={{ 
      width: 'calc(100% + 20px)', 
      height: 'calc(100% + 16px)', 
      left: '-10px', 
      top: '-8px' 
    }}
    viewBox="0 0 100 100" 
    preserveAspectRatio="none"
  >
    <path 
      d="M 20 80 C 45 105, 85 95, 95 70 C 110 35, 75 -5, 45 5 C 10 15, -10 50, 5 75 C 15 95, 35 90, 45 80"
      fill="none" 
      stroke="#36454F" 
      strokeWidth="2.5"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      className="opacity-0 group-hover:opacity-100"
    />
  </svg>
);

export function Nav() {
  const [cursorHovered, setCursorHovered] = useState(false);

  return (
    <nav className="hidden md:flex items-center gap-6 lg:gap-8">
      <a 
        href="#pricing" 
        onMouseEnter={() => setCursorHovered(true)}
        onMouseLeave={() => setCursorHovered(false)}
        className="whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:text-black transition-colors relative group"
      >
        Pricing
        <PencilCircle />
      </a>
    </nav>
  );
}
