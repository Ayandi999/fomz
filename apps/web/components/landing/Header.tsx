import Link from "next/link";
import { useState } from "react";
import { SketchyButtonGroup, SketchyDivider, HeavyPencilCircle } from "./SketchyUI";

export function Header() {
  const [cursorHovered, setCursorHovered] = useState(false);

  return (
    <header className="relative w-full px-8 h-24 grid grid-cols-3 items-center z-40">
      {/* Column 1: Logo */}
      <div className="flex justify-start col-span-1">
        <Link href="/" className="flex items-center shrink-0">
          <img src="/som.svg" alt="Fomz App Logo" className="h-10 w-10 object-contain" />
        </Link>
      </div>
      
      {/* Column 2: Empty Space */}
      <div className="col-span-1"></div>

      {/* Column 3: Action Buttons & Nav */}
      <div className="flex items-center justify-end col-span-1">
        <SketchyButtonGroup className="scale-90 origin-right">
          <Link 
            href="/#pricing" 
            onMouseEnter={() => setCursorHovered(true)}
            onMouseLeave={() => setCursorHovered(false)}
            className="relative group inline-flex items-center justify-center font-bold px-6 py-3 transition-all duration-300 text-black text-[10px] uppercase tracking-widest gap-2"
          >
            Pricing <HeavyPencilCircle />
          </Link>
          <SketchyDivider />
          <Link 
            href="/sign-in" 
            onMouseEnter={() => setCursorHovered(true)}
            onMouseLeave={() => setCursorHovered(false)}
            className="relative group inline-flex items-center justify-center font-bold px-6 py-3 transition-all duration-300 text-black text-[10px] uppercase tracking-widest gap-2"
          >
            Login <HeavyPencilCircle />
          </Link>
          <SketchyDivider />
          <Link 
            href="/sign-up" 
            onMouseEnter={() => setCursorHovered(true)}
            onMouseLeave={() => setCursorHovered(false)}
            className="relative group inline-flex items-center justify-center font-bold px-6 py-3 transition-all duration-300 text-black text-[10px] uppercase tracking-widest gap-2"
          >
            Sign Up <HeavyPencilCircle />
          </Link>
        </SketchyButtonGroup>
      </div>
    </header>
  );
}
