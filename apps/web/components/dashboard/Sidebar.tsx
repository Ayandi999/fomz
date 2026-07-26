"use client";

import { useState } from "react";
import { Plus, Sparkles, Settings, BarChart2, Archive, Menu, X } from "lucide-react";
import Link from "next/link";

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { label: "Create Form", icon: <Plus className="w-5 h-5" />, href: "#" },
    { label: "AI", icon: <Sparkles className="w-5 h-5" />, href: "#" },
    { label: "Analytics", icon: <BarChart2 className="w-5 h-5" />, href: "#" },
    { label: "Archived", icon: <Archive className="w-5 h-5" />, href: "#" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, href: "#" },
  ];

  return (
    <aside 
      className={`relative border-r border-black/10 bg-transparent transition-all duration-300 ease-in-out flex flex-col pt-4 pb-4 ${
        isExpanded ? "w-64" : "w-[72px]"
      } shrink-0 hidden lg:flex overflow-hidden`}
    >
      <div className="px-3 mb-6 flex items-center w-full h-[40px]">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`hover:bg-black/5 rounded-none text-[#666] hover:text-[#111] transition-all duration-300 border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0 h-10 w-[48px]`}
        >
          {isExpanded ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex flex-col gap-2 px-3">
        {navItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            title={!isExpanded ? item.label : undefined}
            className="flex items-center rounded-none text-[#666] hover:text-[#111] hover:bg-black/5 transition-colors duration-200 border-none no-underline group overflow-hidden h-[44px]"
          >
            <div className="flex items-center justify-center w-[48px] shrink-0 group-hover:text-[#2563EB] transition-colors">
              {item.icon}
            </div>
            <span className={`font-semibold text-[13px] whitespace-nowrap transition-all duration-300 ${isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
