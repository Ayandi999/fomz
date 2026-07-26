import React from "react";
import type { FieldCardProps } from "./types";


export function MultipleChoiceCard({ question, mode, value, onChange, getQuestionChoices, getSliderBoundaries, childrenFields }: FieldCardProps) {
  return (

    <div className="flex flex-col gap-3 mt-2">
      {getQuestionChoices?.(question).map((opt, oIdx) => (
        <div
          key={opt + "_" + oIdx}
          className="border border-neutral-700/50 p-3 lg:p-4 hover:border-primary hover:bg-neutral-800/20 transition-colors cursor-pointer group flex items-center gap-3 text-sm lg:text-base bg-transparent max-w-md animate-fade-in"
        >
          <span className="border border-neutral-600 w-6 h-6 text-[10px] flex items-center justify-center font-black shrink-0 group-hover:border-primary group-hover:text-primary transition-colors">
            {String.fromCharCode(65 + oIdx)}
          </span>
          <span className="font-light text-neutral-200">{opt}</span>
        </div>
      ))}
    </div>

  );
}