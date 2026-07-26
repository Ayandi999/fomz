import React from "react";
import type { FieldCardProps } from "./types";


export function WelcomeCard({ question, mode, value, onChange, getQuestionChoices, getSliderBoundaries, childrenFields }: FieldCardProps) {
  return (

    <div className="flex flex-col gap-4 mt-8 animate-fade-in">
      <button 
        type="button"
        className="self-start px-8 py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform"
      >
        {question.placeholder || "Start"}
      </button>
    </div>

  );
}