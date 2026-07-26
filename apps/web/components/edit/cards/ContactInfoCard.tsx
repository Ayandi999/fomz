import React from "react";
import type { FieldCardProps } from "./types";


export function ContactInfoCard({ question, mode, value, onChange, getQuestionChoices, getSliderBoundaries, childrenFields }: FieldCardProps) {
  return (

    <div className="flex flex-col gap-6 mt-2 w-full max-w-xl animate-fade-in">
      {childrenFields && childrenFields.length > 0 ? (
        childrenFields.map((child) => (
          <div key={child.id || child.clientTempId} className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1">
              {child.label}
              {child.isRequired && <span className="text-red-400 ml-1">*</span>}
            </span>
            <input
              type={child.fieldType === "EMAIL" ? "email" : child.fieldType === "PHONE" ? "tel" : "text"}
              placeholder={child.placeholder || ""}
              readOnly={mode === "builder"}
              className="bg-transparent text-[#111] w-full border-b border-neutral-700 py-2 focus:border-primary focus:outline-none transition-colors text-base"
            />
          </div>
        ))
      ) : (
        <div className="text-neutral-500 text-sm">No sub fields defined.</div>
      )}
    </div>

  );
}