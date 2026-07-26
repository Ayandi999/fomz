import { Sliders, Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import type { QuestionItem } from "~/app/dashboard/edit/[formId]/page";

interface SettingsSidebarProps {
  activeQuestion: QuestionItem | undefined;
  activeAbsoluteIdx: number;
  updateQuestion: (index: number, updates: Partial<QuestionItem>) => void;
  deleteQuestion: (index: number) => void;
  moveSlide: (index: number, direction: "up" | "down") => void;
}

export function SettingsSidebar({
  activeQuestion,
  activeAbsoluteIdx,
  updateQuestion,
  deleteQuestion,
  moveSlide
}: SettingsSidebarProps) {
  const [minInputStr, setMinInputStr] = useState("0");
  const [maxInputStr, setMaxInputStr] = useState("100");

  const getQuestionChoices = (question: QuestionItem): string[] => {
    if (!question.placeholder) return ["Option A", "Option B", "Option C"];
    try {
      const parsed = JSON.parse(question.placeholder);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      if (question.placeholder.includes(",")) return question.placeholder.split(",").map((s) => s.trim());
    }
    return ["Option A", "Option B", "Option C"];
  };

  const handleUpdateChoice = (choiceIdx: number, newValue: string) => {
    if (!activeQuestion) return;
    const currentChoices = getQuestionChoices(activeQuestion);
    const updatedChoices = [...currentChoices];
    updatedChoices[choiceIdx] = newValue;
    updateQuestion(activeAbsoluteIdx, { placeholder: JSON.stringify(updatedChoices) });
  };

  const handleAddChoice = () => {
    if (!activeQuestion) return;
    const currentChoices = getQuestionChoices(activeQuestion);
    const nextLetter = String.fromCharCode(65 + currentChoices.length);
    const updatedChoices = [...currentChoices, `Option ${nextLetter}`];
    updateQuestion(activeAbsoluteIdx, { placeholder: JSON.stringify(updatedChoices) });
  };

  const handleDeleteChoice = (choiceIdx: number) => {
    if (!activeQuestion) return;
    const currentChoices = getQuestionChoices(activeQuestion);
    if (currentChoices.length <= 2) {
      toast.error("You need at least two choice options.");
      return;
    }
    const updatedChoices = currentChoices.filter((_, i) => i !== choiceIdx);
    updateQuestion(activeAbsoluteIdx, { placeholder: JSON.stringify(updatedChoices) });
  };

  const getSliderBoundaries = (question: QuestionItem | undefined): { min: number; max: number } => {
    if (!question || !question.placeholder) return { min: 0, max: 100 };
    try {
      const parsed = JSON.parse(question.placeholder);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return {
          min: typeof parsed.min === "number" ? parsed.min : 0,
          max: typeof parsed.max === "number" ? parsed.max : 100,
        };
      }
    } catch (e) {}
    return { min: 0, max: 100 };
  };

  const handleUpdateSliderBoundaries = (min: number, max: number) => {
    updateQuestion(activeAbsoluteIdx, { placeholder: JSON.stringify({ min, max }) });
  };

  return (
          <div className="w-80 shrink-0 flex flex-col h-full overflow-y-auto border-l border-black/10 bg-white/40">
            {activeQuestion && (
              <div className={`flex flex-col p-6 gap-6`}>
                <div className="border-b border-black/10 pb-3 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-[#111]">
                    Slide Settings
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Required Answer Toggle Switch (iOS Style) */}
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-semibold text-[#666]">Required field</span>
                    <button
                      type="button"
                      onClick={() => updateQuestion(activeAbsoluteIdx, { isRequired: !activeQuestion.isRequired })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        activeQuestion.isRequired ? "bg-primary" : "bg-black/5"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          activeQuestion.isRequired ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Hairline Divider */}
                  <div className="border-t border-black/10 w-full"></div>

                  {/* Custom Placeholder/Option Editor Fields */}
                  {["MULTIPLE_CHOICE", "CHECKBOX", "DROPDOWN"].includes(activeQuestion.fieldType) ? (
                    <div className="flex flex-col gap-3 border border-black/10 p-3 bg-transparent/50 rounded-none">
                      <div className="border-b border-black/10 pb-1.5 flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                          Configure Options
                        </label>
                        <span className="text-[9px] font-bold text-[#666] bg-black/5 px-1.5 py-0.5 rounded">
                          {getQuestionChoices(activeQuestion).length} Item{getQuestionChoices(activeQuestion).length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-1">
                        {getQuestionChoices(activeQuestion).map((choice, cIdx) => (
                          <div key={cIdx} className="flex gap-2 items-center">
                            <span className="bg-primary text-primary-foreground w-6 h-6 text-[10px] flex items-center justify-center font-black shrink-0 rounded">
                              {String.fromCharCode(65 + cIdx)}
                            </span>
                            <input
                              value={choice}
                              onChange={(e) => handleUpdateChoice(cIdx, e.target.value)}
                              onBlur={(e) => {
                                if (e.target.value.trim() === "") {
                                  handleUpdateChoice(cIdx, `Option ${String.fromCharCode(65 + cIdx)}`);
                                }
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + cIdx)}`}
                              className="flex h-8 w-full rounded-none border border-black/10 bg-transparent px-3 py-1 text-xs text-[#111] placeholder:text-[#888] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteChoice(cIdx)}
                              className="text-error hover:text-error/80 shrink-0 p-1 cursor-pointer hover:scale-105 transition-transform bg-transparent border-none"
                              title="Remove Option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddChoice()}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-none text-[10px] font-bold tracking-wider py-1.5 bg-white/80 text-[#111] border border-black/10 hover:bg-black/5 transition-colors gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary shrink-0" /> Add Option
                      </button>
                    </div>
                  ) : activeQuestion.fieldType === "SLIDER" ? (
                    <div className="flex flex-col gap-3 border border-black/10 p-3 bg-transparent/50 rounded-none">
                      <div className="border-b border-black/10 pb-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                          Range Limits
                        </label>
                      </div>
                      
                      {(() => {
                        return (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase tracking-widest text-[#888]">
                                Min Limit
                              </label>
                              <input
                                type="text"
                                value={minInputStr}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "" || val === "-" || !isNaN(Number(val))) {
                                    setMinInputStr(val);
                                    if (val !== "" && val !== "-") {
                                      const newMin = Number(val);
                                      const currentMax = Number(maxInputStr);
                                      if (!isNaN(currentMax) && newMin >= currentMax) {
                                        toast.error("Minimum limit cannot be greater than or equal to maximum limit.");
                                      } else {
                                        handleUpdateSliderBoundaries(newMin, isNaN(currentMax) ? 100 : currentMax);
                                      }
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  const parsedMin = Number(minInputStr);
                                  const { max } = getSliderBoundaries(activeQuestion);
                                  if (isNaN(parsedMin)) {
                                    setMinInputStr("0");
                                    handleUpdateSliderBoundaries(0, max);
                                  } else if (parsedMin >= max) {
                                    toast.error("Minimum limit cannot be greater than or equal to maximum limit.");
                                    const safeMin = max - 10;
                                    setMinInputStr(safeMin.toString());
                                    handleUpdateSliderBoundaries(safeMin, max);
                                  }
                                }}
                                className="flex h-8 w-full rounded-none border border-black/10 bg-transparent px-3 py-1 text-xs text-[#111] placeholder:text-[#888] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase tracking-widest text-[#888]">
                                Max Limit
                              </label>
                              <input
                                type="text"
                                value={maxInputStr}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "" || val === "-" || !isNaN(Number(val))) {
                                    setMaxInputStr(val);
                                    if (val !== "" && val !== "-") {
                                      const newMax = Number(val);
                                      const currentMin = Number(minInputStr);
                                      if (!isNaN(currentMin) && newMax <= currentMin) {
                                        toast.error("Maximum limit cannot be less than or equal to minimum limit.");
                                      } else {
                                        handleUpdateSliderBoundaries(isNaN(currentMin) ? 0 : currentMin, newMax);
                                      }
                                    }
                                  }
                                }}
                                className="flex h-8 w-full rounded-none border border-black/10 bg-transparent px-3 py-1 text-xs text-[#111] placeholder:text-[#888] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : ["WELCOME", "THANK_YOU", "INFO"].includes(activeQuestion.fieldType) ? null : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#888]">
                        Placeholder Subtext
                      </label>
                      <input
                        value={activeQuestion.placeholder}
                        onChange={(e) => updateQuestion(activeAbsoluteIdx, { placeholder: e.target.value })}
                        placeholder="e.g. Type your response..."
                        className="flex h-9 w-full rounded-none border border-black/10 bg-transparent/50 px-3 py-2 text-xs text-[#111] placeholder:text-[#888] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                      />
                    </div>
                  )}

                  {/* Custom Description Field */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#888]">
                      Question Description
                    </label>
                    <textarea
                      value={activeQuestion.description || ""}
                      onChange={(e) => updateQuestion(activeAbsoluteIdx, { description: e.target.value })}
                      placeholder="e.g. Provide optional context, guidelines or details..."
                      className="flex w-full rounded-none border border-black/10 bg-transparent/50 px-3 py-2 text-xs text-[#111] placeholder:text-[#888] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors min-h-[5rem] resize-none"
                    />
                  </div>

                  {/* Move & Delete controls (Compact Row) */}
                  <div className="flex gap-2 justify-end border-t border-black/10 pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => moveSlide(activeAbsoluteIdx, "up")}
                      disabled={activeAbsoluteIdx === 0}
                      className="h-8 w-8 flex items-center justify-center border border-black/10 bg-white/80 hover:bg-black/5 text-[#666] hover:text-[#111] disabled:opacity-40 transition-colors rounded cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSlide(activeAbsoluteIdx, "down")}
                      disabled={false}
                      className="h-8 w-8 flex items-center justify-center border border-black/10 bg-white/80 hover:bg-black/5 text-[#666] hover:text-[#111] disabled:opacity-40 transition-colors rounded cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQuestion(activeAbsoluteIdx)}
                      className="h-8 w-8 flex items-center justify-center border border-error/40 bg-white/80 hover:bg-error hover:text-[#111] text-error transition-colors rounded cursor-pointer"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
  );
}
