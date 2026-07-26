import React from "react";
import type { FieldCardProps } from "./types";


export function LongTextCard({ question, mode, value, onChange, getQuestionChoices, getSliderBoundaries, childrenFields }: FieldCardProps) {
  return (

    <div className="flex flex-col gap-2 relative max-w-md animate-fade-in w-full">
      <div className="relative">
        <textarea
          placeholder={question.placeholder || "Type your answer here..."}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={mode === "builder"}
          className="w-full border-b border-neutral-700 bg-transparent py-3 text-lg sm:text-2xl font-light text-[#111] placeholder:text-neutral-400 focus:border-primary focus:outline-none transition-colors min-h-[100px] resize-none overflow-hidden"
        />
      </div>
    </div>

  );
}