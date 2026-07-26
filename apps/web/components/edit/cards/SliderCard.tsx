import React from "react";
import type { FieldCardProps } from "./types";


export function SliderCard({ question, mode, value, onChange, getQuestionChoices, getSliderBoundaries, childrenFields }: FieldCardProps) {
  return (

    <div className="flex flex-col gap-6 mt-4 w-full max-w-md animate-fade-in">
      <div className="relative w-full h-12 flex items-center">
        <div className="absolute left-0 right-0 h-1 bg-neutral-800" />
        <div className="absolute left-0 top-0 bottom-0 bg-primary" style={{ width: '50%' }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-primary rotate-45 flex items-center justify-center pointer-events-none" style={{ left: 'calc(50% - 12px)' }} />
      </div>
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-neutral-500">
        <span>{getSliderBoundaries?.(question).min || 0}</span>
        <span className="text-primary text-sm">{(getSliderBoundaries?.(question).max || 100) / 2}</span>
        <span>{getSliderBoundaries?.(question).max || 100}</span>
      </div>
    </div>

  );
}