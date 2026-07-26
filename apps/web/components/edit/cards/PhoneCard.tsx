import React from "react";
import type { FieldCardProps } from "./types";


export function PhoneCard({ question, mode, value, onChange, getQuestionChoices, getSliderBoundaries, childrenFields }: FieldCardProps) {
  return (

    <div className="flex flex-col gap-2 relative max-w-md animate-fade-in w-full">
      <div className="relative flex items-center">
        <span className="text-neutral-500 font-bold mr-2">+1</span>
        <input
          type="tel"
          placeholder={question.placeholder || "(555) 000-0000"}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={mode === "builder"}
          className="w-full border-b border-neutral-700 bg-transparent py-3 text-lg sm:text-2xl lg:text-3xl font-light text-[#111] placeholder:text-neutral-400 focus:border-primary focus:outline-none transition-colors"
        />
      </div>
    </div>

  );
}