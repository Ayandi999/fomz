import React from "react";
import type { FieldCardProps } from "./types";


export function VideoCard({ question, mode, value, onChange, getQuestionChoices, getSliderBoundaries, childrenFields }: FieldCardProps) {
  return (

    <div className="border-2 border-dashed border-neutral-700 p-8 lg:p-12 flex flex-col items-center justify-center gap-4 bg-transparent max-w-xl w-full">
      <div className="w-12 h-12 text-neutral-500 animate-pulse">VID</div>
      <span className="text-sm font-black uppercase tracking-widest text-[#111]">Upload Video Media</span>
    </div>

  );
}