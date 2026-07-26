import React from "react";
import type { FieldCardProps } from "./types";


export function EmailCard({ question, mode, value, onChange, getQuestionChoices, getSliderBoundaries, childrenFields }: FieldCardProps) {
  return (

    <div className="flex flex-col gap-2 relative max-w-md animate-fade-in w-full">
      <div className="relative">
        <input
          type="email"
          placeholder={question.placeholder || "name@example.com"}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={mode === "builder"}
          className="w-full border-b border-neutral-700 bg-transparent py-3 text-lg sm:text-2xl lg:text-3xl font-light text-[#111] placeholder:text-neutral-400 focus:border-primary focus:outline-none transition-colors"
        />
      </div>
    </div>

  );
}