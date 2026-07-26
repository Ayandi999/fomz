import React from "react";
import type { FieldCardProps } from "./types";


export function RatingCard({ question, mode, value, onChange, getQuestionChoices, getSliderBoundaries, childrenFields }: FieldCardProps) {
  return (

    <div className="flex items-center gap-2 lg:gap-4 mt-2 max-w-md flex-wrap animate-fade-in">
      {[1, 2, 3, 4, 5].map((star) => (
        <div key={star} className="text-neutral-700 hover:text-yellow-500 hover:scale-110 transition-all cursor-pointer">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
      ))}
    </div>

  );
}