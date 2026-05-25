"use client";

import { useState, use, useEffect } from "react";
import { useGetPublicForm } from "~/hooks/api/forms/useGetPublicForm";
import { useSubmitFormResponse } from "~/hooks/api/forms/useSubmitFormResponse";
import { 
  ChevronDown, ChevronRight, Globe as GlobeIcon, Phone as PhoneIcon, 
  Mail, Star, ToggleLeft, CheckSquare, AlignLeft, Type, Hash, Calendar,
  ArrowRight, ArrowLeft, Check, Loader2
} from "lucide-react";

type FieldType =
  | "LONG_TEXT" | "SHORT_TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE"
  | "MULTIPLE_CHOICE" | "YES_NO" | "CHECKBOX" | "DROPDOWN" | "SLIDER"
  | "NUMBER" | "EMAIL" | "CONTACT_INFO" | "ADDRESS" | "PHONE" | "WEBSITE"
  | "RATING" | "DATE" | "WELCOME" | "THANK_YOU" | "INFO";

interface PublicField {
  id: string;
  formId: string | null;
  label: string | null;
  placeholder: string | null;
  fieldType: FieldType;
  isRequired: boolean;
  parentId?: string | null;
  index: number;
}

const getChoices = (field: PublicField): string[] => {
  if (!field.placeholder) return ["Option A", "Option B", "Option C"];
  try {
    const parsed = JSON.parse(field.placeholder);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return ["Option A", "Option B", "Option C"];
};

const getSliderBounds = (field: PublicField) => {
  try {
    const parsed = JSON.parse(field.placeholder ?? "{}");
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      return { min: parsed.min ?? 0, max: parsed.max ?? 100 };
    }
  } catch {}
  return { min: 0, max: 100 };
};

const COUNTRY_CODES_FALLBACK = [
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
];

export default function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { formId, fields, isLoading, isError, error } = useGetPublicForm(slug);
  const { submitResponseAsync, isPending: isSubmitting } = useSubmitFormResponse();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [ratingHover, setRatingHover] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState({ code: "US", flag: "🇺🇸", dialCode: "+1" });
  const [phoneSearch, setPhoneSearch] = useState("");
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
  const [countryCodes, setCountryCodes] = useState(COUNTRY_CODES_FALLBACK);

  const topLevelFields = (fields || []).filter((f: PublicField) => !f.parentId);
  const currentField = topLevelFields[stepIndex];
  const totalSteps = topLevelFields.length;
  const progress = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;

  const getChildFields = (parentId: string) =>
    (fields || []).filter((f: PublicField) => f.parentId === parentId);

  const isNonInteractive = (type: FieldType) => ["WELCOME", "INFO"].includes(type);
  const isLastStep = stepIndex === totalSteps - 1;

  useEffect(() => {
    fetch("https://gist.githubusercontent.com/anubhavshrimal/75f6183458db8c453306f93521e93d37/raw/")
      .then(r => r.json())
      .then((data: any[]) => {
        const getFlagEmoji = (code: string) => {
          try { return String.fromCodePoint(...code.toUpperCase().split("").map(c => 127397 + c.charCodeAt(0))); }
          catch { return "🏳️"; }
        };
        const parsed = data
          .filter(c => c.code && c.name && c.dial_code)
          .map(c => ({ code: c.code, name: c.name, flag: getFlagEmoji(c.code), dialCode: c.dial_code.replace(/\s+/g, "") }))
          .sort((a, b) => a.name.localeCompare(b.name));
        if (parsed.length > 0) setCountryCodes(parsed);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    setValidationError("");
    setDropdownOpen(false);
    const q = topLevelFields[stepIndex];
    if (q?.fieldType === "SLIDER") {
      const { min, max } = getSliderBounds(q);
      setSliderValue(Math.floor((min + max) / 2));
    }
  }, [stepIndex]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Loading form…</p>
        </div>
      </main>
    );
  }

  if (isError || !fields || !formId) {
    const msg = (error as any)?.message ?? "This form is unavailable";
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-6">
        <div className="border-2 border-red-500 p-8 max-w-md w-full flex flex-col gap-4 text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight text-red-400">Unavailable</h1>
          <p className="text-sm text-neutral-400 uppercase tracking-wider">{msg}</p>
        </div>
      </main>
    );
  }

  const validateStep = () => {
    if (!currentField) return true;
    if (isNonInteractive(currentField.fieldType)) return true;
    if (!currentField.isRequired) return true;

    const parentId = currentField.id;
    const children = getChildFields(parentId);

    if (children.length > 0) {
      const unanswered = children.filter(c => !answers[c.id]?.trim());
      if (unanswered.length > 0) {
        setValidationError(`Please fill in all required sub-fields.`);
        return false;
      }
    } else if (["CHECKBOX"].includes(currentField.fieldType)) {
      if (!answers[currentField.id] || JSON.parse(answers[currentField.id] || "[]").length === 0) {
        setValidationError(`Please select at least one option.`);
        return false;
      }
    } else if (!answers[currentField.id]?.trim()) {
      setValidationError(`This field is required.`);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setValidationError("");
    if (isLastStep) {
      handleSubmit();
    } else {
      setStepIndex(s => s + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitError("");
    try {
      const payload = fields.map((f: PublicField) => ({
        fieldId: f.id,
        value: answers[f.id] ?? null,
      })).filter(a => a.value !== null && a.value !== undefined);

      await submitResponseAsync({ formId, answers: payload });
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err?.message ?? "Failed to submit. Please try again.");
    }
  };

  const setAnswer = (fieldId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
    setValidationError("");
  };

  const toggleCheckbox = (fieldId: string, option: string) => {
    const current: string[] = JSON.parse(answers[fieldId] || "[]");
    const updated = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option];
    setAnswer(fieldId, JSON.stringify(updated));
  };

  // Thank You / Submission Success Screen
  if (submitted) {
    const thankYouSlide = topLevelFields.find((f: PublicField) => f.fieldType === "THANK_YOU");
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-lg animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center">
            <Check className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-white">
            Thank You!
          </h1>
          {thankYouSlide?.placeholder && (
            <p className="text-neutral-400 text-base leading-relaxed">{thankYouSlide.placeholder}</p>
          )}
          <p className="text-xs text-neutral-600 uppercase tracking-widest mt-4">
            Your response has been recorded.
          </p>
        </div>
      </main>
    );
  }

  if (!currentField) return null;

  const childFields = getChildFields(currentField.id);
  const choices = getChoices(currentField);
  const { min, max } = getSliderBounds(currentField);
  const sliderPercent = max > min ? Math.min(100, Math.max(0, ((sliderValue - min) / (max - min)) * 100)) : 0;

  const filteredCountries = countryCodes.filter(c =>
    c.name.toLowerCase().includes(phoneSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(phoneSearch.toLowerCase()) ||
    c.dialCode.includes(phoneSearch)
  ).slice(0, 40);

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col" onClick={() => { setDropdownOpen(false); setPhoneDropdownOpen(false); }}>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-neutral-800 z-50">
        <div
          className="h-full bg-amber-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="fixed top-4 right-6 z-50">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
          {stepIndex + 1} / {totalSteps}
        </span>
      </div>

      {/* Slide area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 min-h-screen">
        <div className="w-full max-w-2xl flex flex-col gap-8 animate-fade-in" key={stepIndex}>

          {/* WELCOME Slide */}
          {currentField.fieldType === "WELCOME" && (
            <div className="flex flex-col gap-4 items-start">
              {currentField.label && (
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                  {currentField.label}
                </h1>
              )}
              {currentField.placeholder && (
                <p className="text-neutral-400 text-base leading-relaxed max-w-xl">{currentField.placeholder}</p>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="mt-4 flex items-center gap-2 bg-amber-400 text-black font-black uppercase tracking-widest text-sm px-6 py-3 hover:bg-amber-300 transition-colors"
              >
                Start <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* INFO Slide */}
          {currentField.fieldType === "INFO" && (
            <div className="flex flex-col gap-4">
              {currentField.label && (
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                  {currentField.label}
                </h2>
              )}
              {currentField.placeholder && (
                <p className="text-neutral-400 text-base leading-relaxed">{currentField.placeholder}</p>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="mt-4 flex items-center gap-2 border-2 border-neutral-600 text-white font-black uppercase tracking-widest text-sm px-6 py-3 hover:border-amber-400 hover:text-amber-400 transition-colors w-fit"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* THANK_YOU Slide (as an in-flow step before actual submission) */}
          {currentField.fieldType === "THANK_YOU" && (
            <div className="flex flex-col items-center gap-4 text-center py-8">
              <h1 className="text-5xl font-black uppercase tracking-tight text-white">Thank You!</h1>
              {currentField.placeholder && (
                <p className="text-neutral-400 text-base">{currentField.placeholder}</p>
              )}
            </div>
          )}

          {/* Standard question types */}
          {!["WELCOME", "INFO", "THANK_YOU"].includes(currentField.fieldType) && (
            <>
              {/* Question label */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-black uppercase tracking-widest text-amber-400">
                  Question {stepIndex + 1}
                  {currentField.isRequired && <span className="text-red-400 ml-1">*</span>}
                </p>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                  {currentField.label || "Untitled Question"}
                </h2>
                {currentField.placeholder && !["MULTIPLE_CHOICE","CHECKBOX","DROPDOWN","SLIDER","YES_NO","CONTACT_INFO","ADDRESS","RATING"].includes(currentField.fieldType) && (
                  <p className="text-neutral-500 text-sm"></p>
                )}
              </div>

              {/* SHORT_TEXT */}
              {currentField.fieldType === "SHORT_TEXT" && (
                <input
                  type="text"
                  value={answers[currentField.id] ?? ""}
                  onChange={e => setAnswer(currentField.id, e.target.value)}
                  placeholder={currentField.placeholder || "Type your answer here..."}
                  className="bg-transparent border-b-2 border-neutral-700 focus:border-amber-400 text-white text-xl py-3 w-full focus-visible:outline-none transition-colors placeholder:text-neutral-600"
                  autoFocus
                />
              )}

              {/* LONG_TEXT */}
              {currentField.fieldType === "LONG_TEXT" && (
                <textarea
                  value={answers[currentField.id] ?? ""}
                  onChange={e => setAnswer(currentField.id, e.target.value)}
                  placeholder={currentField.placeholder || "Type your answer here..."}
                  rows={4}
                  className="bg-transparent border-b-2 border-neutral-700 focus:border-amber-400 text-white text-lg py-3 w-full focus-visible:outline-none transition-colors placeholder:text-neutral-600 resize-none"
                  autoFocus
                />
              )}

              {/* NUMBER */}
              {currentField.fieldType === "NUMBER" && (
                <input
                  type="number"
                  value={answers[currentField.id] ?? ""}
                  onChange={e => setAnswer(currentField.id, e.target.value)}
                  placeholder={currentField.placeholder || "Enter a number..."}
                  className="bg-transparent border-b-2 border-neutral-700 focus:border-amber-400 text-white text-xl py-3 w-full focus-visible:outline-none transition-colors placeholder:text-neutral-600"
                  autoFocus
                />
              )}

              {/* EMAIL */}
              {currentField.fieldType === "EMAIL" && (
                <div className="flex items-center gap-3 border-b-2 border-neutral-700 focus-within:border-amber-400 transition-colors py-3">
                  <Mail className="w-5 h-5 text-neutral-500 shrink-0" />
                  <input
                    type="email"
                    value={answers[currentField.id] ?? ""}
                    onChange={e => setAnswer(currentField.id, e.target.value)}
                    placeholder={currentField.placeholder || "name@example.com"}
                    className="bg-transparent text-white text-xl w-full focus-visible:outline-none placeholder:text-neutral-600"
                    autoFocus
                  />
                </div>
              )}

              {/* DATE */}
              {currentField.fieldType === "DATE" && (
                <input
                  type="date"
                  value={answers[currentField.id] ?? ""}
                  onChange={e => setAnswer(currentField.id, e.target.value)}
                  className="bg-neutral-900 border-2 border-neutral-700 focus:border-amber-400 text-white text-lg py-3 px-4 w-full focus-visible:outline-none transition-colors"
                />
              )}

              {/* WEBSITE */}
              {currentField.fieldType === "WEBSITE" && (
                <div className="flex items-center gap-2 border-b-2 border-neutral-700 focus-within:border-amber-400 transition-colors py-3">
                  <GlobeIcon className="w-5 h-5 text-neutral-500 shrink-0" />
                  <span className="text-neutral-500 text-lg font-bold">https://</span>
                  <input
                    type="text"
                    value={answers[currentField.id] ?? ""}
                    onChange={e => setAnswer(currentField.id, e.target.value)}
                    placeholder={currentField.placeholder || "yourwebsite.com"}
                    className="bg-transparent text-white text-xl w-full focus-visible:outline-none placeholder:text-neutral-600"
                    autoFocus
                  />
                </div>
              )}

              {/* PHONE */}
              {currentField.fieldType === "PHONE" && (
                <div className="flex items-center gap-3 border-b-2 border-neutral-700 focus-within:border-amber-400 transition-colors py-3 relative">
                  <PhoneIcon className="w-5 h-5 text-neutral-500 shrink-0" />
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPhoneDropdownOpen(o => !o); }}
                      className="flex items-center gap-1.5 border border-neutral-700 px-2 py-1 text-white text-xs font-black uppercase tracking-wider hover:border-amber-400 transition-colors"
                    >
                      {phoneCountry.flag} {phoneCountry.code}
                      <span className="text-neutral-500">{phoneCountry.dialCode}</span>
                    </button>
                    {phoneDropdownOpen && (
                      <div
                        className="absolute top-full left-0 mt-1 z-30 w-64 bg-neutral-900 border border-neutral-700 shadow-2xl p-2 flex flex-col gap-2 max-h-64 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                      >
                        <input
                          autoFocus
                          type="text"
                          value={phoneSearch}
                          onChange={e => setPhoneSearch(e.target.value)}
                          placeholder="Search country..."
                          className="bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-xs text-white focus-visible:outline-none rounded-none w-full"
                        />
                        <div className="flex flex-col gap-0.5 overflow-y-auto max-h-40">
                          {filteredCountries.map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => { setPhoneCountry({ code: c.code, flag: c.flag, dialCode: c.dialCode }); setPhoneDropdownOpen(false); setPhoneSearch(""); }}
                              className="w-full text-left px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700 flex items-center justify-between"
                            >
                              <span>{c.flag} {c.name}</span>
                              <span className="text-neutral-500">{c.dialCode}</span>
                            </button>
                          ))}
                          {filteredCountries.length === 0 && <p className="text-center text-xs text-neutral-600 py-3">No results</p>}
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={answers[currentField.id] ?? ""}
                    onChange={e => setAnswer(currentField.id, e.target.value)}
                    placeholder={currentField.placeholder || "(555) 000-0000"}
                    className="bg-transparent text-white text-xl w-full focus-visible:outline-none placeholder:text-neutral-600"
                    autoFocus
                  />
                </div>
              )}

              {/* YES_NO */}
              {currentField.fieldType === "YES_NO" && (
                <div className="flex gap-4 flex-wrap mt-2">
                  {["YES", "NO"].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswer(currentField.id, opt)}
                      className={`flex items-center gap-3 border-2 px-6 py-4 font-black uppercase tracking-widest text-sm transition-colors ${
                        answers[currentField.id] === opt
                          ? "border-amber-400 bg-amber-400/10 text-amber-400"
                          : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                      }`}
                    >
                      <span className={`w-6 h-6 flex items-center justify-center font-extrabold text-xs border ${
                        answers[currentField.id] === opt ? "bg-amber-400 text-black border-amber-400" : "border-neutral-600 text-neutral-400"
                      }`}>
                        {opt[0]}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* RATING */}
              {currentField.fieldType === "RATING" && (
                <div className="flex gap-3 flex-wrap mt-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setRatingHover(star)}
                      onMouseLeave={() => setRatingHover(0)}
                      onClick={() => setAnswer(currentField.id, String(star))}
                      className="transition-transform hover:scale-125"
                    >
                      <Star className={`w-10 h-10 transition-colors ${
                        star <= (ratingHover || Number(answers[currentField.id] ?? 0))
                          ? "text-amber-400 fill-amber-400"
                          : "text-neutral-600"
                      }`} />
                    </button>
                  ))}
                </div>
              )}

              {/* MULTIPLE_CHOICE */}
              {currentField.fieldType === "MULTIPLE_CHOICE" && (
                <div className="flex flex-col gap-3 mt-2">
                  {choices.map((opt, idx) => (
                    <button
                      key={opt + idx}
                      type="button"
                      onClick={() => setAnswer(currentField.id, opt)}
                      className={`flex items-center gap-4 border-2 px-5 py-4 text-sm font-bold uppercase tracking-wider transition-colors text-left ${
                        answers[currentField.id] === opt
                          ? "border-amber-400 bg-amber-400/10 text-amber-400"
                          : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                      }`}
                    >
                      <span className={`w-6 h-6 flex items-center justify-center text-[10px] font-black shrink-0 border ${
                        answers[currentField.id] === opt ? "bg-amber-400 text-black border-amber-400" : "border-neutral-600 text-neutral-400"
                      }`}>{String.fromCharCode(65 + idx)}</span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* CHECKBOX */}
              {currentField.fieldType === "CHECKBOX" && (
                <div className="flex flex-col gap-3 mt-2">
                  {choices.map((opt, idx) => {
                    const checked = JSON.parse(answers[currentField.id] || "[]").includes(opt);
                    return (
                      <button
                        key={opt + idx}
                        type="button"
                        onClick={() => toggleCheckbox(currentField.id, opt)}
                        className={`flex items-center gap-4 border-2 px-5 py-4 text-sm font-bold uppercase tracking-wider transition-colors text-left ${
                          checked
                            ? "border-amber-400 bg-amber-400/10 text-amber-400"
                            : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                        }`}
                      >
                        <span className={`w-5 h-5 flex items-center justify-center shrink-0 border-2 transition-colors ${
                          checked ? "bg-amber-400 border-amber-400" : "border-neutral-600"
                        }`}>
                          {checked && <Check className="w-3 h-3 text-black" />}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* DROPDOWN */}
              {currentField.fieldType === "DROPDOWN" && (
                <div className="relative max-w-md mt-2">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setDropdownOpen(o => !o); }}
                    className="w-full flex items-center justify-between border-2 border-neutral-700 hover:border-amber-400 px-4 py-3 text-sm font-black uppercase tracking-wider text-left transition-colors"
                  >
                    <span className={answers[currentField.id] ? "text-white" : "text-neutral-500"}>
                      {answers[currentField.id] || "Select an option..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 z-20 w-full bg-neutral-900 border border-neutral-700 shadow-2xl max-h-48 overflow-y-auto" onClick={e => e.stopPropagation()}>
                      {choices.map((opt, idx) => (
                        <button
                          key={opt + idx}
                          type="button"
                          onClick={() => { setAnswer(currentField.id, opt); setDropdownOpen(false); }}
                          className="w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wide hover:bg-amber-400/10 hover:text-amber-400 transition-colors text-neutral-300"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SLIDER */}
              {currentField.fieldType === "SLIDER" && (
                <div className="flex flex-col gap-4 max-w-lg mt-2">
                  <div className="relative w-full h-4 bg-neutral-800 border border-neutral-700">
                    <div className="absolute left-0 top-0 bottom-0 bg-amber-400" style={{ width: `${sliderPercent}%` }} />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-amber-400 rotate-45 border-2 border-black"
                      style={{ left: `calc(${sliderPercent}% - 12px)` }}
                    />
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={sliderValue}
                      onChange={e => { const v = Number(e.target.value); setSliderValue(v); setAnswer(currentField.id, String(v)); }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-neutral-500">
                    <span>{min}</span>
                    <span className="text-amber-400 text-sm">{sliderValue}</span>
                    <span>{max}</span>
                  </div>
                </div>
              )}

              {/* CONTACT_INFO or ADDRESS — render children */}
              {(currentField.fieldType === "CONTACT_INFO" || currentField.fieldType === "ADDRESS") && childFields.length > 0 && (
                <div className="flex flex-col gap-6 mt-2">
                  {childFields.map(child => (
                    <div key={child.id} className="flex flex-col gap-2">
                      <label className="text-xs font-black uppercase tracking-widest text-neutral-400">
                        {child.label}{child.isRequired && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      {child.fieldType === "EMAIL" ? (
                        <div className="flex items-center gap-2 border-b border-neutral-700 focus-within:border-amber-400 transition-colors py-2">
                          <Mail className="w-4 h-4 text-neutral-500 shrink-0" />
                          <input type="email" value={answers[child.id] ?? ""} onChange={e => setAnswer(child.id, e.target.value)} placeholder={child.placeholder || "email@example.com"} className="bg-transparent text-white w-full focus-visible:outline-none placeholder:text-neutral-600 text-base" />
                        </div>
                      ) : child.fieldType === "PHONE" ? (
                        <div className="flex items-center gap-2 border-b border-neutral-700 focus-within:border-amber-400 transition-colors py-2">
                          <PhoneIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                          <input type="tel" value={answers[child.id] ?? ""} onChange={e => setAnswer(child.id, e.target.value)} placeholder={child.placeholder || "(555) 000-0000"} className="bg-transparent text-white w-full focus-visible:outline-none placeholder:text-neutral-600 text-base" />
                        </div>
                      ) : child.fieldType === "WEBSITE" ? (
                        <div className="flex items-center gap-2 border-b border-neutral-700 focus-within:border-amber-400 transition-colors py-2">
                          <GlobeIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                          <span className="text-neutral-500 font-bold">https://</span>
                          <input type="text" value={answers[child.id] ?? ""} onChange={e => setAnswer(child.id, e.target.value)} placeholder={child.placeholder || "yourwebsite.com"} className="bg-transparent text-white w-full focus-visible:outline-none placeholder:text-neutral-600 text-base" />
                        </div>
                      ) : (
                        <input type="text" value={answers[child.id] ?? ""} onChange={e => setAnswer(child.id, e.target.value)} placeholder={child.placeholder || ""} className="bg-transparent border-b border-neutral-700 focus:border-amber-400 text-white py-2 w-full focus-visible:outline-none transition-colors placeholder:text-neutral-600 text-base" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Validation error */}
          {validationError && (
            <p className="text-red-400 text-xs font-bold uppercase tracking-wider">{validationError}</p>
          )}

          {/* Submit error */}
          {submitError && (
            <p className="text-red-400 text-xs font-bold uppercase tracking-wider">{submitError}</p>
          )}

          {/* Navigation */}
          {!["WELCOME", "INFO"].includes(currentField.fieldType) && (
            <div className="flex items-center gap-4 mt-4">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => { setValidationError(""); setStepIndex(s => s - 1); }}
                  className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-amber-400 text-black font-black uppercase tracking-widest text-sm px-6 py-3 hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                ) : isLastStep && currentField.fieldType !== "THANK_YOU" ? (
                  <><Check className="w-4 h-4" /> Submit</>
                ) : (
                  <>Next <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Branding footer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <span className="text-[10px] text-neutral-700 font-black uppercase tracking-widest">
          Powered by Streamyst
        </span>
      </div>
    </main>
  );
}
