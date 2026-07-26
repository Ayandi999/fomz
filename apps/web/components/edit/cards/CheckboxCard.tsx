import React from "react";
import type { FieldCardProps } from "./types";


export function CheckboxCard({ question, mode, value, onChange, getQuestionChoices, getSliderBoundaries, childrenFields }: FieldCardProps) {
  return (

    <div className="flex flex-col gap-3 mt-2">
      {getQuestionChoices?.(question).map((opt, oIdx) => (
        <div
          key={opt + "_" + oIdx}
          className="border border-neutral-700/50 p-3 font-bold uppercase tracking-wide flex items-center gap-3 text-xs bg-transparent max-w-md animate-fade-in hover:border-primary transition-colors cursor-pointer"
        >
          <span className="border border-neutral-500 w-5 h-5 text-[9px] flex items-center justify-center font-black shrink-0">
            {String.fromCharCode(65 + oIdx)}
          </span>
          {opt}
        </div>
      ))}
    </div>

  );
}