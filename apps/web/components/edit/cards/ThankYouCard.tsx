import React from "react";
import type { FieldCardProps } from "./types";


export function ThankYouCard({ question, mode, value, onChange, getQuestionChoices, getSliderBoundaries, childrenFields }: FieldCardProps) {
  return (

    <div className="flex flex-col gap-4 mt-8 animate-fade-in">
      <div className="self-start px-8 py-4 border-2 border-primary text-primary font-black uppercase tracking-widest text-sm">
        Form Complete
      </div>
    </div>

  );
}