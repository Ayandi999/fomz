import { ArrowLeft, Save, Sparkles, Download, ArrowUp, User as UserIcon, LogOut, Eye, ChevronDown, CheckSquare, Plus, Trash2, ListIcon, ImageIcon, VideoIcon, FileIcon, FileText, Upload, Mic as AudioIcon, Star, Mail, Calendar, Globe as GlobeIcon, Phone as PhoneIcon, Type, Sliders } from "lucide-react";
import type { QuestionItem } from "~/app/dashboard/edit/[formId]/page";
import { buttonPrimaryClass, cardClass, buttonSecondaryClass, inputClass } from "~/app/dashboard/edit/[formId]/page";

interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

interface LivePreviewProps {
  activeQuestion: QuestionItem | undefined;
  activeIdx: number;
  topLevelQuestions: QuestionItem[];
  getQuestionChoices: (q: QuestionItem) => string[];
  previewSliderValue: number;
  setPreviewSliderValue: (val: number) => void;
  isDropdownPreviewOpen: boolean;
  setIsDropdownPreviewOpen: (val: boolean) => void;
  selectedDropdownValue: string;
  setSelectedDropdownValue: (val: string) => void;
  activeAbsoluteIdx: number;
  isDirty: boolean;
  updateQuestion: (idx: number, updates: Partial<QuestionItem>) => void;
  getSliderBoundaries: (q: QuestionItem) => { min: number; max: number };
  saveStatus: string;
  saveErrorMessage: string;
  setShowAddContent: (val: boolean) => void;
  countryCodes: Country[];
  isPhoneDropdownOpen: boolean;
  setIsPhoneDropdownOpen: (val: boolean) => void;
  selectedPhoneCountry: any;
  setSelectedPhoneCountry: (val: any) => void;
  phoneSearchQuery: string;
  setPhoneSearchQuery: (val: string) => void;
  activeChildren: QuestionItem[];
  questions: QuestionItem[];
  deleteQuestion: (idx: number) => void;
  handleAddSubQuestion: any;
  setQuestions: (qs: any) => void;
  setIsDirty: (val: boolean) => void;
  isDirtyRef: any;
}

export function LivePreview({ activeQuestion, activeIdx, topLevelQuestions, getQuestionChoices, previewSliderValue, setPreviewSliderValue, isDropdownPreviewOpen, setIsDropdownPreviewOpen, selectedDropdownValue, setSelectedDropdownValue, activeAbsoluteIdx, isDirty, updateQuestion, getSliderBoundaries, saveStatus, saveErrorMessage, setShowAddContent, countryCodes, isPhoneDropdownOpen, setIsPhoneDropdownOpen, selectedPhoneCountry, setSelectedPhoneCountry, phoneSearchQuery, setPhoneSearchQuery, activeChildren, questions, deleteQuestion, handleAddSubQuestion, setQuestions, setIsDirty, isDirtyRef }: LivePreviewProps) {
  return (
          <div className="flex-1 flex flex-col h-full overflow-y-auto bg-transparent relative">

            {saveStatus === "saved" && (
              <div className="bg-emerald-100  border-2 border-emerald-500 text-emerald-800  p-3 text-xs font-bold uppercase tracking-wider text-center">
                Changes saved successfully as draft!
              </div>
            )}

            {saveStatus === "error" && (
              <div className="bg-red-100  border-2 border-red-500 text-red-800  p-3 text-xs font-bold uppercase tracking-wider text-center">
                {saveErrorMessage}
              </div>
            )}

            {/* Conversational Live Slide Preview */}
            {topLevelQuestions.length === 0 ? (
              <div className="border-2 border-dashed border-neutral-300  py-20 px-6 flex flex-col items-center justify-center gap-4 text-center bg-neutral-50/20 ">
                <p className="text-sm font-black uppercase tracking-widest text-[#666]">
                  Your form is empty
                </p>
                <p className="text-xs text-[#666] max-w-sm uppercase tracking-wider -mt-2">
                  Click the "+ Add Content" button above to add a dynamic conversational question to your flow.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddContent(true)}
                  className={`${buttonPrimaryClass} mt-2`}
                >
                  Add First Slide
                </button>
              </div>
            ) : (
              activeQuestion && (
              <div className="flex flex-col gap-4">
                <div className={`${cardClass} transition-all duration-200`}>
                  {/* Slide Header */}
                  <div className="flex items-center justify-between border-b border-black/10 pb-4 mb-6">
                    <span className="text-[12px] font-medium text-[#888] uppercase tracking-wider">
                      Slide {activeIdx + 1} of {topLevelQuestions.length}
                    </span>
                    <span className="text-xs font-bold text-[#666] uppercase tracking-wider flex items-center gap-1.5">
                      {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping inline-block" />}
                      {activeQuestion.fieldType.replace("_", " ").toLowerCase()}
                    </span>
                  </div>

                  {/* Typeform Live Slide Preview Canvas */}
                  <div className="preview-container flex-1 flex flex-col gap-6 py-10 px-10 justify-center relative">
                    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
                      
                      {/* Live editable question title & description */}
                      {activeQuestion.fieldType === "THANK_YOU" ? (
                        <div className="flex flex-col items-center justify-center text-center py-8 w-full animate-fade-in">
                          <h1 className="text-[32px] font-bold text-[#111] leading-tight uppercase">
                            Thank You!
                          </h1>
                          {activeQuestion.description && (
                            <p className="text-[16px] font-normal text-[#666] leading-relaxed whitespace-pre-wrap mt-4 max-w-lg">
                              {activeQuestion.description}
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Live editable question title */}
                          <div className="flex flex-col gap-1 items-start w-full group relative">
                            <span className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none select-none">
                              <Sliders className="w-3 h-3" /> Edit question label
                            </span>
                            <div className="relative inline-block w-full max-w-full">
                              {/* Invisible mirror span to measure text width & height for wrapping */}
                              <span className="invisible whitespace-pre-wrap break-words text-[32px] font-bold px-1 select-none pointer-events-none block min-h-[3.5rem] pb-2 w-full leading-tight">
                                {activeQuestion.label || "Enter question title..."}
                              </span>
                              <textarea
                                value={activeQuestion.label}
                                onChange={(e) => updateQuestion(activeAbsoluteIdx, { label: e.target.value })}
                                className="absolute inset-0 text-[32px] font-bold bg-transparent border-b border-transparent hover:border-black/10-active focus:border-primary transition-colors w-full focus-visible:outline-none py-1 leading-tight text-[#111] pr-8 resize-none overflow-hidden"
                                placeholder="Enter question title..."
                              />
                              {activeQuestion.isRequired && (
                                <span className="absolute -top-1 -right-2.5 text-error font-extrabold text-2xl select-none" title="Required Field">
                                  *
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Live question description preview */}
                          {activeQuestion.description && (
                            <p className="text-[16px] font-normal text-[#666] leading-relaxed max-w-2xl animate-fade-in whitespace-pre-wrap mt-2">
                              {activeQuestion.description}
                            </p>
                          )}
                        </>
                      )}

                      {/* Render the appropriate live input placeholder type */}
                      <div className="mt-8">
                        
                        {/* 1. SHORT_TEXT */}
                        {activeQuestion.fieldType === "SHORT_TEXT" && (
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              placeholder={activeQuestion.placeholder || "Type your answer here..."}
                              className="text-lg bg-transparent border-b-2 border-neutral-300  focus:border-neutral-900  py-3 w-full focus-visible:outline-none transition-colors"
                              disabled
                            />
                            <span className="text-[10px] font-bold text-[#666] uppercase tracking-widest mt-1">
                              Press Enter ↵
                            </span>
                          </div>
                        )}

                        {/* 2. LONG_TEXT */}
                        {activeQuestion.fieldType === "LONG_TEXT" && (
                          <div className="flex flex-col gap-2">
                            <div className="border border-black/10 rounded-none p-4 bg-transparent/50 w-full min-h-24">
                              <p className="text-sm text-[#888] select-none">
                                {activeQuestion.placeholder || "Type your long response here..."}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider mt-1.5">
                              shift + enter for new line
                            </span>
                          </div>
                        )}

                        {/* 3. NUMBER */}
                        {activeQuestion.fieldType === "NUMBER" && (
                          <div className="flex flex-col gap-2">
                            <input
                              type="number"
                              placeholder={activeQuestion.placeholder || "Enter a number..."}
                              className="text-lg bg-transparent border-b-2 border-neutral-300  focus:border-neutral-900  py-3 w-full focus-visible:outline-none transition-colors"
                              disabled
                            />
                          </div>
                        )}

                        {/* 4. EMAIL */}
                        {activeQuestion.fieldType === "EMAIL" && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 border-b-2 border-neutral-300  py-3">
                              <Mail className="w-5 h-5 text-[#666]" />
                              <input
                                type="email"
                                placeholder={activeQuestion.placeholder || "name@example.com"}
                                className="text-lg bg-transparent w-full focus-visible:outline-none"
                                disabled
                              />
                            </div>
                          </div>
                        )}

                        {/* 5. DATE */}
                        {activeQuestion.fieldType === "DATE" && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 border-b-2 border-neutral-300  py-3">
                              <Calendar className="w-5 h-5 text-[#666]" />
                              <input
                                type="text"
                                placeholder={activeQuestion.placeholder || "Select a date..."}
                                className="text-lg bg-transparent w-full focus-visible:outline-none"
                                disabled
                              />
                            </div>
                          </div>
                        )}

                        {/* 6. YES_NO */}
                        {activeQuestion.fieldType === "YES_NO" && (
                          <div className="flex flex-wrap gap-4 mt-2">
                            <button
                              type="button"
                              className="border border-black/10 px-6 py-3 font-bold uppercase tracking-widest hover:bg-neutral-100  transition-colors flex items-center gap-3 text-sm cursor-default bg-transparent"
                            >
                              <span className="bg-neutral-950 text-[#111]   w-5 h-5 text-[10px] flex items-center justify-center font-extrabold">Y</span> Yes
                            </button>
                            <button
                              type="button"
                              className="border border-black/10 px-6 py-3 font-bold uppercase tracking-widest hover:bg-neutral-100  transition-colors flex items-center gap-3 text-sm cursor-default bg-transparent"
                            >
                              <span className="bg-neutral-950 text-[#111]   w-5 h-5 text-[10px] flex items-center justify-center font-extrabold">N</span> No
                            </button>
                          </div>
                        )}

                        {/* 7. RATING */}
                        {activeQuestion.fieldType === "RATING" && (
                          <div className="flex gap-2 items-center mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className="w-8 h-8 text-neutral-300  cursor-default"
                              />
                            ))}
                          </div>
                        )}

                        {/* 8. WEBSITE */}
                        {activeQuestion.fieldType === "WEBSITE" && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 border-b-2 border-neutral-300  py-3">
                              <GlobeIcon className="w-5 h-5 text-[#666]" />
                              <span className="text-lg font-bold text-[#666]">https://</span>
                              <input
                                type="text"
                                placeholder={activeQuestion.placeholder || "yourwebsite.com"}
                                className="text-lg bg-transparent w-full focus-visible:outline-none"
                                disabled
                              />
                            </div>
                          </div>
                        )}

                        {/* 9. PHONE */}
                        {activeQuestion.fieldType === "PHONE" && (
                          <div className="flex flex-col gap-2 animate-fade-in">
                            <div className="flex items-center gap-2 border-b-2 border-neutral-300  py-3 relative">
                              <PhoneIcon className="w-5 h-5 text-[#666] animate-pulse" />
                              
                              {/* Custom Searchable Country Popover Trigger */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setIsPhoneDropdownOpen(!isPhoneDropdownOpen)}
                                  className="text-xs font-black px-2.5 py-1.5 border border-black/10 text-neutral-900  tracking-widest bg-transparent rounded-none flex items-center gap-1.5 hover:bg-neutral-100  cursor-pointer min-w-[95px] justify-between uppercase transition-colors"
                                >
                                  {(() => {
                                    const c = countryCodes.find((ct) => ct.code === selectedPhoneCountry);
                                    return (
                                      <>
                                        <span>{c?.flag} {c?.code}</span>
                                        <span className="text-[10px] text-neutral-500  font-bold">{c?.dialCode}</span>
                                      </>
                                    );
                                  })()}
                                </button>

                                {/* Search Popover Menu */}
                                {isPhoneDropdownOpen && (
                                  <div 
                                    className="absolute top-full left-0 mt-1.5 z-30 w-64 border border-black/10 bg-transparent shadow-2xl p-2.5 flex flex-col gap-2 animate-fade-in max-h-64"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="text"
                                      autoFocus
                                      value={phoneSearchQuery}
                                      onChange={(e) => setPhoneSearchQuery(e.target.value)}
                                      placeholder="Type country name or code..."
                                      className="w-full text-xs border border-black/10 px-2 py-1.5 focus-visible:outline-none rounded-none bg-transparent text-neutral-900  font-bold"
                                    />
                                    
                                    <div className="flex flex-col gap-0.5 overflow-y-auto max-h-40 pr-1 border-t border-neutral-200  pt-1.5">
                                      {countryCodes
                                        .filter((c) => 
                                          c.name.toLowerCase().includes(phoneSearchQuery.toLowerCase()) || 
                                          c.code.toLowerCase().includes(phoneSearchQuery.toLowerCase()) || 
                                          c.dialCode.includes(phoneSearchQuery)
                                        )
                                        .slice(0, 40) // Responsive cap to prevent rendering bottlenecks
                                        .map((c) => (
                                          <button
                                            key={c.code}
                                            type="button"
                                            onClick={() => {
                                              setSelectedPhoneCountry({
                                                code: c.code,
                                                flag: c.flag,
                                                dialCode: c.dialCode
                                              });
                                              setIsPhoneDropdownOpen(false);
                                              setPhoneSearchQuery("");
                                            }}
                                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-neutral-900 hover:text-[#111]   flex items-center justify-between transition-colors rounded-none cursor-pointer bg-transparent border-none text-neutral-900 "
                                          >
                                            <span className="font-bold uppercase tracking-tight truncate max-w-[130px]">
                                              {c.flag} {c.name}
                                            </span>
                                            <span className="text-[9px] text-neutral-500  font-black">
                                              ({c.code}) {c.dialCode}
                                            </span>
                                          </button>
                                        ))
                                      }
                                      
                                      {countryCodes.filter((c: any) => 
                                        c.name.toLowerCase().includes(phoneSearchQuery.toLowerCase()) || 
                                        c.code.toLowerCase().includes(phoneSearchQuery.toLowerCase()) || 
                                        c.dialCode.includes(phoneSearchQuery)
                                      ).length === 0 && (
                                        <p className="text-[10px] text-center text-[#666] uppercase py-4 font-bold tracking-wider">No results</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <input
                                type="text"
                                placeholder={activeQuestion.placeholder || "(555) 000-0000"}
                                className="text-lg bg-transparent w-full focus-visible:outline-none font-bold placeholder:text-neutral-400"
                                disabled
                              />
                            </div>
                          </div>
                        )}

                        {/* 10. MULTIPLE_CHOICE */}
                        {activeQuestion.fieldType === "MULTIPLE_CHOICE" && (
                          <div className="flex flex-col gap-3 mt-2">
                            {getQuestionChoices(activeQuestion).map((opt: any, oIdx: number) => (
                              <div
                                key={opt + "_" + oIdx}
                                className="border border-black/10 p-3 font-bold uppercase tracking-wide flex items-center gap-3 text-xs bg-transparent max-w-md animate-fade-in"
                              >
                                <span className="bg-neutral-950 text-[#111]   w-5 h-5 text-[9px] flex items-center justify-center font-black shrink-0">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 11. CHECKBOX */}
                        {activeQuestion.fieldType === "CHECKBOX" && (
                          <div className="flex flex-col gap-3 mt-2">
                            {getQuestionChoices(activeQuestion).map((opt: any, oIdx: number) => (
                              <div
                                key={opt + "_" + oIdx}
                                className="border-2 border-neutral-200  p-3 font-bold uppercase tracking-wide flex items-center gap-3 text-xs bg-transparent max-w-md animate-fade-in"
                              >
                                <span className="border border-neutral-400 w-5 h-5 text-[9px] flex items-center justify-center font-black shrink-0">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 12. DROPDOWN */}
                        {activeQuestion.fieldType === "DROPDOWN" && (
                          <div className="flex flex-col gap-2 relative max-w-md animate-fade-in w-full">
                            {/* Dropdown Trigger */}
                            <button
                              type="button"
                              onClick={() => setIsDropdownPreviewOpen(!isDropdownPreviewOpen)}
                              className="w-full flex items-center justify-between border border-black/10 p-3 text-xs font-black uppercase tracking-widest bg-transparent hover:bg-neutral-100  transition-colors cursor-pointer rounded-none text-left text-neutral-900 "
                            >
                              <span>
                                {selectedDropdownValue || "Select an option..."}
                              </span>
                              <ChevronDown className="w-4 h-4 text-neutral-900  shrink-0" />
                            </button>

                            {/* Dropdown Options Popover Menu */}
                            {isDropdownPreviewOpen && (
                              <div 
                                className="absolute top-full left-0 mt-1 z-20 w-full border border-black/10 bg-transparent shadow-2xl p-1 flex flex-col gap-0.5 max-h-48 overflow-y-auto animate-fade-in"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {getQuestionChoices(activeQuestion).map((opt: any, oIdx: number) => (
                                  <button
                                    key={opt + "_" + oIdx}
                                    type="button"
                                    onClick={() => {
                                      setSelectedDropdownValue(opt);
                                      setIsDropdownPreviewOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-neutral-900 hover:text-[#111]   transition-colors rounded-none cursor-pointer bg-transparent border-none text-neutral-900 "
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 13. SLIDER */}
                        {activeQuestion.fieldType === "SLIDER" && (() => {
                          const { min, max } = getSliderBoundaries(activeQuestion);
                          const percent = max > min ? Math.min(100, Math.max(0, ((previewSliderValue - min) / (max - min)) * 100)) : 0;
                          return (
                            <div className="flex flex-col gap-4 mt-6 max-w-md w-full animate-fade-in">
                              <div className="relative w-full h-4 border border-black/10 bg-neutral-100  select-none">
                                {/* Filled progress bar */}
                                <div 
                                  className="absolute left-0 top-0 bottom-0 bg-primary  border-r-2 border-neutral-900 " 
                                  style={{ width: `${percent}%` }}
                                />
                                {/* Custom Rotated Diamond Thumb */}
                                <div 
                                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 border border-black/10 bg-neutral-900  rotate-45 shadow-md flex items-center justify-center pointer-events-none"
                                  style={{ left: `calc(${percent}% - 12px)` }}
                                >
                                  {/* Tiny inner dot/diamond */}
                                  <div className="w-1.5 h-1.5 bg-transparent  rotate-45" />
                                </div>
                                
                                {/* Invisible Interactive Native Range Input covering the whole custom track */}
                                <input
                                  type="range"
                                  min={min}
                                  max={max}
                                  value={previewSliderValue}
                                  onChange={(e) => setPreviewSliderValue(Number(e.target.value))}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                              </div>

                              {/* Custom slider labels */}
                              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-neutral-700 ">
                                <span className="border border-neutral-300  px-2 py-0.5 bg-neutral-50 ">
                                  {min} (Min)
                                </span>
                                <span className="text-xs text-blue-700  font-extrabold bg-neutral-900 text-[#111]   px-2.5 py-0.5 rounded-none border border-neutral-900 ">
                                  Value: {previewSliderValue}
                                </span>
                                <span className="border border-neutral-300  px-2 py-0.5 bg-neutral-50 ">
                                  {max} (Max)
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 14. CONTACT_INFO & 15. ADDRESS (Dynamic nested sub-questions layout configuration) */}
                        {(activeQuestion.fieldType === "CONTACT_INFO" || activeQuestion.fieldType === "ADDRESS") && (
                          <div className="flex flex-col gap-6 w-full">
                            <div className="flex flex-col gap-4 border border-black/10 p-5 bg-transparent">
                              <h4 className="text-xs font-black uppercase tracking-wider text-blue-700  border-b pb-2 mb-2">
                                Sub Fields Configuration
                              </h4>
                              {activeChildren.length === 0 ? (
                                <p className="text-[10px] text-[#666] uppercase text-center py-4 font-bold">No sub fields defined.</p>
                              ) : (
                                <div className="flex flex-col gap-4">
                                  {activeChildren.map((child: any) => {
                                    const childAbsIdx = questions.findIndex((item: any) => 
                                      (child?.id && item.id === child?.id) || 
                                      (child.clientTempId && item.clientTempId === child.clientTempId)
                                    );
                                    return (
                                      <div key={child?.id || child.clientTempId} className="border-2 border-neutral-200  p-4 flex flex-col gap-3 relative bg-neutral-50/50  text-neutral-900 ">
                                        <div className="flex justify-between items-center border-b border-neutral-200  pb-2">
                                          <span className="text-[10px] font-black uppercase tracking-widest text-[#666] flex items-center gap-1.5">
                                            {child.fieldType === "EMAIL" && <Mail className="w-3.5 h-3.5 text-blue-600" />}
                                            {child.fieldType === "PHONE" && <PhoneIcon className="w-3.5 h-3.5 text-blue-600" />}
                                            {child.fieldType === "SHORT_TEXT" && <Type className="w-3.5 h-3.5 text-blue-600" />}
                                            {child.fieldType === "WEBSITE" && <GlobeIcon className="w-3.5 h-3.5 text-blue-600" />}
                                            {child.fieldType}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => deleteQuestion(childAbsIdx)}
                                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition-transform hover:scale-110 bg-transparent border-none"
                                            title="Delete Sub Field"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[#666]">Field Label</label>
                                            <input
                                              type="text"
                                              value={child.label}
                                              onChange={(e) => updateQuestion(childAbsIdx, { label: e.target.value })}
                                              className={`${inputClass} h-8 text-xs py-1`}
                                              placeholder="e.g. Full Name"
                                            />
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[#666]">Placeholder text</label>
                                            <input
                                              type="text"
                                              value={child.placeholder}
                                              onChange={(e) => updateQuestion(childAbsIdx, { placeholder: e.target.value })}
                                              className={`${inputClass} h-8 text-xs py-1`}
                                              placeholder="e.g. John Doe"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              <div className="flex flex-wrap gap-2 mt-2 pt-4 border-t border-neutral-250">
                                <button
                                  type="button"
                                  onClick={() => handleAddSubQuestion(activeAbsoluteIdx === -1 ? "" : (activeQuestion.id || activeQuestion.clientTempId || ""), activeChildren.length)}
                                  className={`${buttonSecondaryClass} h-8 text-[10px] tracking-wider py-1 font-extrabold flex items-center justify-center gap-1.5`}
                                >
                                  <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Add Text Sub-Field
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const parentId = activeQuestion.id || activeQuestion.clientTempId;
                                    if (!parentId) return;
                                    const childTempId = `temp_${Date.now()}`;
                                    const newChild: QuestionItem = {
                                      clientTempId: childTempId,
                                      label: `New Email Field`,
                                      placeholder: "email@example.com",
                                      description: "",
                                      fieldType: "EMAIL",
                                      isRequired: false,
                                      index: activeQuestion.index + (activeChildren.length + 1) * 0.01,
                                      labelKey: `email_${Math.random().toString(36).substring(2, 6)}`,
                                      parentId: parentId,
                                    };
                                    setQuestions([...questions, newChild]);
                                    setIsDirty(true);
                                    isDirtyRef.current = true;
                                  }}
                                  className={`${buttonSecondaryClass} h-8 text-[10px] tracking-wider py-1 font-extrabold flex items-center justify-center gap-1.5`}
                                >
                                  <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Add Email Sub-Field
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const parentId = activeQuestion.id || activeQuestion.clientTempId;
                                    if (!parentId) return;
                                    const childTempId = `temp_${Date.now()}`;
                                    const newChild: QuestionItem = {
                                      clientTempId: childTempId,
                                      label: `New Phone Field`,
                                      placeholder: "(555) 000-0000",
                                      description: "",
                                      fieldType: "PHONE",
                                      isRequired: false,
                                      index: activeQuestion.index + (activeChildren.length + 1) * 0.01,
                                      labelKey: `phone_${Math.random().toString(36).substring(2, 6)}`,
                                      parentId: parentId,
                                    };
                                    setQuestions([...questions, newChild]);
                                    setIsDirty(true);
                                    isDirtyRef.current = true;
                                  }}
                                  className={`${buttonSecondaryClass} h-8 text-[10px] tracking-wider py-1 font-extrabold flex items-center justify-center gap-1.5`}
                                >
                                  <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Add Phone Sub-Field
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const parentId = activeQuestion.id || activeQuestion.clientTempId;
                                    if (!parentId) return;
                                    const childTempId = `temp_${Date.now()}`;
                                    const newChild: QuestionItem = {
                                      clientTempId: childTempId,
                                      label: `New Website Field`,
                                      placeholder: "example.com",
                                      description: "",
                                      fieldType: "WEBSITE",
                                      isRequired: false,
                                      index: activeQuestion.index + (activeChildren.length + 1) * 0.01,
                                      labelKey: `website_${Math.random().toString(36).substring(2, 6)}`,
                                      parentId: parentId,
                                    };
                                    setQuestions([...questions, newChild]);
                                    setIsDirty(true);
                                    isDirtyRef.current = true;
                                  }}
                                  className={`${buttonSecondaryClass} h-8 text-[10px] tracking-wider py-1 font-extrabold flex items-center justify-center gap-1.5`}
                                >
                                  <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Add Website Sub-Field
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 16. IMAGE */}
                        {activeQuestion.fieldType === "IMAGE" && (
                          <div className="border-2 border-dashed border-neutral-300  p-8 flex flex-col items-center justify-center gap-2 bg-neutral-100/50  max-w-md">
                            <ImageIcon className="w-8 h-8 text-neutral-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-900 ">Upload Image File</span>
                            <span className="text-[9px] text-[#666] uppercase tracking-wider">Drag and drop or browse files</span>
                          </div>
                        )}

                        {/* 17. VIDEO */}
                        {activeQuestion.fieldType === "VIDEO" && (
                          <div className="border-2 border-dashed border-neutral-300  p-8 flex flex-col items-center justify-center gap-2 bg-neutral-100/50  max-w-md">
                            <VideoIcon className="w-8 h-8 text-neutral-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-900 ">Upload Video Attachment</span>
                            <span className="text-[9px] text-[#666] uppercase tracking-wider">Supports MP4, WebM up to 10MB</span>
                          </div>
                        )}

                        {/* 18. AUDIO */}
                        {activeQuestion.fieldType === "AUDIO" && (
                          <div className="border-2 border-dashed border-neutral-300  p-8 flex flex-col items-center justify-center gap-2 bg-neutral-100/50  max-w-md">
                            <AudioIcon className="w-8 h-8 text-neutral-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-900 ">Record Live or Upload sound</span>
                            <span className="text-[9px] text-[#666] uppercase tracking-wider">Supports MP3, WAV, WebM up to 10MB</span>
                          </div>
                        )}

                        {/* 19. FILE */}
                        {activeQuestion.fieldType === "FILE" && (
                          <div className="border-2 border-dashed border-neutral-300  p-8 flex flex-col items-center justify-center gap-2 bg-neutral-100/50  max-w-md">
                            <FileIcon className="w-8 h-8 text-neutral-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-900 ">Upload Document attachment</span>
                            <span className="text-[9px] text-[#666] uppercase tracking-wider">Supports PDF up to 200KB</span>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-2 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setShowAddContent(true)}
                    className="py-2.5 px-6 border border-dashed border-black/10 hover:border-primary/50 text-[10px] font-black uppercase tracking-widest text-[#666] hover:text-primary transition-all duration-200 rounded-none flex items-center justify-center gap-1.5 bg-transparent cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Content
                  </button>
                </div>
              </div>
            )
            )}
          </div>

  );
}