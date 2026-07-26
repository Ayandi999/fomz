import React from "react";
import type { FieldCardProps } from "./types";


export function DropdownCard({ question, mode, value, onChange, getQuestionChoices, getSliderBoundaries, childrenFields }: FieldCardProps) {
  return (

    <div className="flex flex-col gap-2 relative max-w-md animate-fade-in w-full">
      <div className="w-full flex items-center justify-between border-b border-neutral-700 py-3 text-lg sm:text-2xl font-light bg-transparent hover:border-primary transition-colors cursor-pointer text-left text-neutral-400">
        <span>Select an option...</span>
        <div className="w-4 h-4 text-neutral-500 shrink-0 border-r-2 border-b-2 border-current transform rotate-45 mr-1" />
      </div>
    </div>

  );
}