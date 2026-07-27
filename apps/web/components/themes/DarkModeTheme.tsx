"use client";

import { useState, use, useEffect, useRef, useTransition } from "react";
import { useGetPublicForm } from "~/hooks/api/forms/useGetPublicForm";
import { useSubmitFormResponse } from "~/hooks/api/forms/useSubmitFormResponse";
import { useRouter } from "next/navigation";
import type { ThemeField, ThemeProps } from "./types";
import { 
  ChevronDown, Globe as GlobeIcon, Phone as PhoneIcon, 
  Mail, Star, CheckSquare, AlignLeft, Type, Hash, Calendar,
  ArrowRight, ArrowLeft, Check, Loader2, Upload, Music,
  RefreshCw, AlertCircle, FileText, Image as ImageIcon, Video as VideoIcon,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const getChoices = (field: ThemeField): string[] => {
  if (!field.placeholder) return ["Option A", "Option B", "Option C"];
  try {
    const parsed = JSON.parse(field.placeholder);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return ["Option A", "Option B", "Option C"];
};

const getSliderBounds = (field: ThemeField) => {
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

export function DarkModeTheme(props: ThemeProps) {
  const {
    mode, fields, answers, setAnswer: propSetAnswer, stepIndex, setStepIndex,
    handleSubmit, submitted, submitError, validationError,
    isUploading: isUploadingProp, shouldReduceMotion: shouldReduceMotionProp,
    isNavigating: isNavigatingProp, isCardShaking: isCardShakingProp,
    isSubmitting
  } = props;
  
  // Create local wrappers for setValidationError and setIsCardShaking since they are handled externally or can be local
  const [localValidationError, setLocalValidationError] = useState(validationError || "");
  const [localIsCardShaking, setLocalIsCardShaking] = useState(isCardShakingProp || false);
  const [localIsNavigating, setLocalIsNavigating] = useState(isNavigatingProp || false);

  useEffect(() => {
    if (validationError !== undefined) setLocalValidationError(validationError);
  }, [validationError]);

  const [ratingHover, setRatingHover] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState({ code: "US", flag: "🇺🇸", dialCode: "+1" });
  const [phoneSearch, setPhoneSearch] = useState("");
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
  const [countryCodes, setCountryCodes] = useState(COUNTRY_CODES_FALLBACK);

  // File uploading and Audio media recorder states
  const [isUploadingInternal, setIsUploadingInternal] = useState(false);
  const isUploading = isUploadingProp ?? isUploadingInternal;
  const [uploadProgress, setUploadProgress] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

  // Animation states & accessibility
  const shouldReduceMotionInternal = useReducedMotion();
  const shouldReduceMotion = shouldReduceMotionProp ?? shouldReduceMotionInternal;
  const isCardShaking = isCardShakingProp ?? localIsCardShaking;
  const isNavigating = isNavigatingProp ?? localIsNavigating;
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Normalize fields so that 'id' always exists (fallback to clientTempId for unsaved fields in preview)
  const normalizedFields = (fields || []).map(f => ({
    ...f,
    id: f.id || f.clientTempId || `fallback-${Math.random().toString(36).substring(2, 9)}`
  }));

  const topLevelFields = normalizedFields.filter((f: ThemeField) => !f.parentId);
  const currentField = topLevelFields[stepIndex];
  const totalSteps = topLevelFields.length;

  const getChildFields = (parentId: string) => normalizedFields.filter((f: ThemeField) => f.parentId === parentId);

  const isNonInteractive = (type: string) => ["WELCOME", "INFO"].includes(type);
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

  // Sync Slider Bounds & Reset ValidationError
  useEffect(() => {
    setLocalValidationError("");
    setDropdownOpen(false);
    const q = topLevelFields[stepIndex];
    if (q?.fieldType === "SLIDER") {
      const { min, max } = getSliderBounds(q);
      setSliderValue(Math.floor((min + max) / 2));
    }
    // Auto-focus new question input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 150);
  }, [stepIndex]);

  

  const validateStep = () => {
    if (!currentField) return true;
    if (isNonInteractive(currentField.fieldType)) return true;

    const val = answers[currentField.id] || "";
    const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (currentField.isRequired) {
      const parentId = currentField.id;
      const children = getChildFields(parentId);

      if (children.length > 0) {
        const unanswered = children.filter(c => !answers[c.id]?.trim());
        if (unanswered.length > 0) {
          triggerError(`Please fill in all required fields.`);
          return false;
        }
      } else if (["CHECKBOX"].includes(currentField.fieldType)) {
        if (!answers[currentField.id] || JSON.parse(answers[currentField.id] || "[]").length === 0) {
          triggerError(`Please select at least one option.`);
          return false;
        }
      } else if (!val.trim()) {
        triggerError(`This field is required.`);
        return false;
      }
    }

    if (val.trim()) {
      if (currentField.fieldType === "EMAIL" && !isEmailValid(val)) {
        triggerError("Please enter a valid email address.");
        return false;
      }
      if (currentField.fieldType === "PHONE" && val.length < 7) {
        triggerError("Please enter a valid phone number (at least 7 digits).");
        return false;
      }
    }

    const children = getChildFields(currentField.id);
    for (const child of children) {
      const childVal = answers[child.id] || "";
      if (childVal.trim()) {
        if (child.fieldType === "EMAIL" && !isEmailValid(childVal)) {
          triggerError(`Please enter a valid email address for "${child.label}".`);
          return false;
        }
        if (child.fieldType === "PHONE" && childVal.length < 7) {
          triggerError(`Please enter a valid phone number (at least 7 digits) for "${child.label}".`);
          return false;
        }
      }
    }

    return true;
  };

  const triggerError = (msg: string) => {
    setLocalValidationError(msg);
    setLocalIsCardShaking(true);
    setTimeout(() => setLocalIsCardShaking(false), 400);
  };

  const handleNext = () => {
    if (isUploading) {
      triggerError("Please wait until your file upload completes.");
      return;
    }
    if (!validateStep()) return;
    setLocalValidationError("");
    if (isLastStep) {
      handleSubmit();
    } else {
      setLocalIsNavigating(true);
      setTimeout(() => {
        setStepIndex(s => s + 1);
        setLocalIsNavigating(false);
      }, 250);
    }
  };

  

  const handleBack = () => {
    if (stepIndex > 0) {
      setLocalValidationError("");
      setLocalIsNavigating(true);
      setTimeout(() => {
        setStepIndex(s => s - 1);
        setLocalIsNavigating(false);
      }, 250);
    }
  };

  const setAnswer = (fieldId: string, value: string) => {
    propSetAnswer(fieldId, value);
    setLocalValidationError("");
  };

  const toggleCheckbox = (fieldId: string, option: string) => {
    const current: string[] = JSON.parse(answers[fieldId] || "[]");
    const updated = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option];
    setAnswer(fieldId, JSON.stringify(updated));
  };

  // Keyboard Submission / Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Don't auto-submit for standard buttons or textareas where Shift is not pressed
      if ((e.target as HTMLElement).tagName !== "TEXTAREA") {
        e.preventDefault();
        handleNext();
      }
    }
  };

  // Auto-expand height helper
  const adjustHeight = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(300, el.scrollHeight)}px`;
  };

  // Ambient checkmark animation
  const checkmarkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeInOut" as any }
    }
  };

  // Render thank you page
  if (submitted) {
    const thankYouSlide = topLevelFields.find((f: ThemeField) => f.fieldType === "THANK_YOU");
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white p-6 relative overflow-hidden select-none">
        {/* Ambient floating particles */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * 200 - 100 + (typeof window !== "undefined" ? window.innerWidth / 2 : 300), 
                y: typeof window !== "undefined" ? window.innerHeight : 600, 
                opacity: 0.2, 
                scale: Math.random() * 0.5 + 0.5 
              }}
              animate={shouldReduceMotion ? {} : {
                y: [typeof window !== "undefined" ? window.innerHeight : 600, -50],
                x: [null, Math.random() * 100 - 50 + (typeof window !== "undefined" ? window.innerWidth / 2 : 300)],
                opacity: [0.2, 0.4, 0]
              }}
              transition={shouldReduceMotion ? {} : {
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: i * 0.4
              }}
              className="absolute w-2 h-2 rounded-full bg-[#c084fc]"
            />
          ))}
        </div>

        <div className="w-full max-w-[720px] bg-[#1e293b] rounded-[24px] border border-slate-700/40 p-12 md:shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-center relative z-10 flex flex-col items-center justify-center min-h-[360px]">
          <svg className="w-20 h-20 mb-8" viewBox="0 0 52 52">
            <motion.circle 
              cx="26" 
              cy="26" 
              r="25" 
              fill="none" 
              stroke="#c084fc" 
              strokeWidth="2" 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
            <motion.path 
              fill="none" 
              stroke="#c084fc" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M14 27l8 8 16-16" 
              variants={checkmarkVariants}
              initial="hidden"
              animate="visible"
            />
          </svg>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2"
          >
            Your response has been recorded
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4, delay: 0.25 }}
            className="text-[#94a3b8] text-base mb-8"
          >
            {thankYouSlide?.placeholder || "Thank you for your time."}
          </motion.p>

          <motion.a
            href="/"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="px-6 py-3 border border-[#c084fc] text-[#c084fc] font-bold rounded-xl text-sm transition-all hover:bg-[#c084fc]/10 active:scale-95 duration-200"
          >
            Create your own form →
          </motion.a>
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

  // Check required state logic for disabled continue button
  const currentAnswerVal = answers[currentField.id] || "";
  const isRequiredEmpty = currentField.isRequired && (
    ["CHECKBOX"].includes(currentField.fieldType) 
      ? (!answers[currentField.id] || JSON.parse(answers[currentField.id] || "[]").length === 0)
      : !currentAnswerVal.trim()
  );

  // Check length character threshold for valid green checkmark indicators (e.g. min 3 characters for short/long text, or valid email)
  const isInputValid = (() => {
    if (currentField.fieldType === "EMAIL") {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentAnswerVal);
    }
    if (["SHORT_TEXT", "LONG_TEXT"].includes(currentField.fieldType)) {
      return currentAnswerVal.trim().length >= 3;
    }
    if (currentField.fieldType === "PHONE") {
      return currentAnswerVal.trim().length >= 7;
    }
    return currentAnswerVal.trim().length > 0;
  })();

  return (
    <main 
      className="preview-container min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-0 md:p-6" 
      onClick={() => { setDropdownOpen(false); setPhoneDropdownOpen(false); }}
      onKeyDown={handleKeyDown}
    >
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 400ms ease-in-out;
        }
      `}</style>

      {/* Center Container Card */}
      <motion.div
        ref={containerRef}
        animate={shouldReduceMotion ? {} : {
          scale: isNavigating ? 0.98 : 1,
          x: isCardShaking ? [-4, 4, -4, 4, 0] : 0
        }}
        transition={{ duration: 0.2 }}
        className={`w-full max-w-[720px] bg-[#1e293b] rounded-xl md:rounded-3xl p-6 md:p-12 border border-slate-700/50 shadow-[0_0_50px_-12px_rgba(192,132,252,0.1)] border-slate-700/40 md:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col justify-between min-h-screen md:min-h-[480px] relative`}
      >
        {/* Header section */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8 text-slate-400 h-6">
          <div className="w-1/4">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="text-[13px] text-[#64748b] hover:text-[#94a3b8] transition-colors focus:outline-none focus:underline"
              >
                ← Back
              </button>
            )}
          </div>
          <div className="w-2/4 text-center">
            <span className="text-[12px] uppercase tracking-wider font-medium text-[#64748b]">
              Question {stepIndex + 1} of {totalSteps}
            </span>
          </div>
          <div className="w-1/4 text-right">
            {currentField.isRequired && (
              <span className="text-[12px] font-bold text-[#c084fc]">Required *</span>
            )}
          </div>
        </div>

        {/* Question & Input Area Content */}
        <div className="flex-1 flex flex-col justify-center py-4" aria-live="polite" id="question-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -30 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              {/* Question text block */}
              <div>
                <h2 className="text-2xl md:text-[32px] font-bold text-white leading-[1.2] mb-3">
                  {currentField.label || "Untitled Question"}
                </h2>
                {currentField.placeholder && !["MULTIPLE_CHOICE","CHECKBOX","DROPDOWN","SLIDER","YES_NO","CONTACT_INFO","ADDRESS","RATING","LONG_TEXT","SHORT_TEXT"].includes(currentField.fieldType) && (
                  <p className="text-[#94a3b8] text-base leading-relaxed mb-6">{currentField.placeholder}</p>
                )}
              </div>

              {/* Input Area Router */}
              <div className="relative w-full">
                {/* SHORT_TEXT */}
                {currentField.fieldType === "SHORT_TEXT" && (
                  <div className="relative flex items-center w-full">
                    <input
                      ref={inputRef as any}
                      type="text"
                      value={answers[currentField.id] ?? ""}
                      onChange={e => setAnswer(currentField.id, e.target.value)}
                      placeholder={currentField.placeholder || "Type your answer here..."}
                      className="bg-transparent text-white text-xl py-3 pr-8 w-full border-b border-slate-700 focus:outline-none placeholder-[#475569] transition-colors focus-within:shadow-[inset_0_-1px_0_0_#c084fc]"
                    />
                    {/* Bottom growing border */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#c084fc] origin-center scale-x-0 transition-transform duration-300 pointer-events-none focus-within:scale-x-100" />
                    
                    {/* Green checkmark valid indicator */}
                    {isInputValid && (
                      <Check className="absolute right-2 w-4 h-4 text-[#34d399] animate-fade-in" />
                    )}
                  </div>
                )}

                {/* LONG_TEXT */}
                {currentField.fieldType === "LONG_TEXT" && (
                  <div className="relative flex flex-col w-full">
                    <div className="relative flex items-end">
                      <textarea
                        ref={inputRef as any}
                        value={answers[currentField.id] ?? ""}
                        onChange={e => {
                          setAnswer(currentField.id, e.target.value);
                          adjustHeight(e.target);
                        }}
                        placeholder={currentField.placeholder || "Type your answer here..."}
                        rows={1}
                        className="bg-transparent text-white text-lg py-3 pr-8 w-full border-b border-slate-700 focus:outline-none placeholder-[#475569] resize-none overflow-y-auto max-h-[300px]"
                        style={{ height: "auto" }}
                      />
                      {/* Bottom growing border */}
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#c084fc] origin-center scale-x-0 transition-transform duration-300 pointer-events-none focus-within:scale-x-100" />

                      {/* Green checkmark valid indicator */}
                      {isInputValid && (
                        <Check className="absolute right-2 bottom-4 w-4 h-4 text-[#34d399] animate-fade-in" />
                      )}
                    </div>
                  </div>
                )}

                {/* NUMBER */}
                {currentField.fieldType === "NUMBER" && (
                  <div className="relative flex items-center w-full">
                    <input
                      ref={inputRef as any}
                      type="number"
                      value={answers[currentField.id] ?? ""}
                      onChange={e => setAnswer(currentField.id, e.target.value)}
                      placeholder={currentField.placeholder || "Enter a number..."}
                      className="bg-transparent text-white text-xl py-3 pr-8 w-full border-b border-slate-700 focus:outline-none placeholder-[#475569]"
                    />
                    {isInputValid && (
                      <Check className="absolute right-2 w-4 h-4 text-[#34d399]" />
                    )}
                  </div>
                )}

                {/* EMAIL */}
                {currentField.fieldType === "EMAIL" && (
                  <div className="relative flex items-center w-full border-b border-slate-700 py-3">
                    <Mail className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
                    <input
                      ref={inputRef as any}
                      type="email"
                      value={answers[currentField.id] ?? ""}
                      onChange={e => setAnswer(currentField.id, e.target.value)}
                      placeholder={currentField.placeholder || "name@example.com"}
                      className="bg-transparent text-white text-xl w-full focus:outline-none placeholder-[#475569]"
                    />
                    {isInputValid && (
                      <Check className="absolute right-2 w-4 h-4 text-[#34d399]" />
                    )}
                  </div>
                )}

                {/* DATE */}
                {currentField.fieldType === "DATE" && (
                  <input
                    type="date"
                    value={answers[currentField.id] ?? ""}
                    onChange={e => setAnswer(currentField.id, e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="bg-[#0f172a] border border-slate-700 rounded-xl text-white text-lg py-3 px-4 w-full focus:outline-none focus:border-[#c084fc] transition-colors"
                  />
                )}

                {/* WEBSITE */}
                {currentField.fieldType === "WEBSITE" && (
                  <div className="relative flex items-center w-full border-b border-slate-700 py-3">
                    <GlobeIcon className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
                    <span className="text-slate-400 text-lg font-bold mr-1">https://</span>
                    <input
                      ref={inputRef as any}
                      type="text"
                      value={answers[currentField.id] ?? ""}
                      onChange={e => setAnswer(currentField.id, e.target.value)}
                      placeholder={currentField.placeholder || "yourwebsite.com"}
                      className="bg-transparent text-white text-xl w-full focus:outline-none placeholder-[#475569]"
                    />
                    {isInputValid && (
                      <Check className="absolute right-2 w-4 h-4 text-[#34d399]" />
                    )}
                  </div>
                )}

                {/* PHONE */}
                {currentField.fieldType === "PHONE" && (
                  <div className="relative flex items-center w-full border-b border-slate-700 py-3">
                    <PhoneIcon className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
                    <div className="relative shrink-0 mr-2">
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setPhoneDropdownOpen(o => !o); }}
                        className="flex items-center gap-1.5 border border-slate-700 px-2 py-1 text-white text-xs font-bold uppercase rounded-xl hover:border-[#c084fc] transition-colors"
                      >
                        {phoneCountry.flag} {phoneCountry.code}
                        <span className="text-slate-400">{phoneCountry.dialCode}</span>
                      </button>
                      {phoneDropdownOpen && (
                        <div
                          className="absolute bottom-full left-0 mb-2 z-30 w-64 bg-[#0f172a] border border-slate-700 shadow-2xl p-2 flex flex-col gap-2 max-h-64 overflow-hidden rounded-xl"
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            autoFocus
                            type="text"
                            value={phoneSearch}
                            onChange={e => setPhoneSearch(e.target.value)}
                            placeholder="Search country..."
                            className="bg-[#0f172a] border border-slate-700 px-2 py-1.5 text-xs text-white focus:outline-none rounded-xl w-full"
                          />
                          <div className="flex flex-col gap-0.5 overflow-y-auto max-h-40">
                            {filteredCountries.map(c => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => { setPhoneCountry({ code: c.code, flag: c.flag, dialCode: c.dialCode }); setPhoneDropdownOpen(false); setPhoneSearch(""); }}
                                className="w-full text-left px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-700 flex items-center justify-between rounded"
                              >
                                <span>{c.flag} {c.name}</span>
                                <span className="text-slate-400">{c.dialCode}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      ref={inputRef as any}
                      type="tel"
                      value={answers[currentField.id] ?? ""}
                      onChange={e => setAnswer(currentField.id, e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder={currentField.placeholder || "(555) 000-0000"}
                      className="bg-transparent text-white text-xl w-full focus:outline-none placeholder-[#475569]"
                    />
                    {isInputValid && (
                      <Check className="absolute right-2 w-4 h-4 text-[#34d399]" />
                    )}
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
                        className={`flex items-center gap-3 border px-6 py-4 font-bold uppercase tracking-wider text-sm rounded-xl transition-all ${
                          answers[currentField.id] === opt
                            ? "border-[#c084fc] bg-[#c084fc]/10 text-[#c084fc]"
                            : "border-slate-700 text-slate-200 hover:border-slate-600 bg-slate-800/30"
                        }`}
                      >
                        <span className={`w-5 h-5 flex items-center justify-center font-bold text-xs border rounded-xl ${
                          answers[currentField.id] === opt ? "bg-[#c084fc] text-white border-[#c084fc]" : "border-slate-600 text-slate-400"
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
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star className={`w-10 h-10 transition-colors ${
                          star <= (ratingHover || Number(answers[currentField.id] ?? 0))
                            ? "text-[#c084fc] fill-[#c084fc]"
                            : "text-slate-600"
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
                        className={`flex items-center gap-4 border px-5 py-4 text-sm font-bold uppercase tracking-wider rounded-xl transition-all text-left ${
                          answers[currentField.id] === opt
                            ? "border-[#c084fc] bg-[#c084fc]/10 text-[#c084fc]"
                            : "border-slate-700 text-slate-200 hover:border-slate-600 bg-[#0f172a]"
                        }`}
                      >
                        <span className={`w-6 h-6 flex items-center justify-center text-[10px] font-black shrink-0 border rounded-xl ${
                          answers[currentField.id] === opt ? "bg-[#c084fc] text-white border-[#c084fc]" : "border-slate-600 text-slate-400"
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
                          className={`flex items-center gap-4 border px-5 py-4 text-sm font-bold uppercase tracking-wider rounded-xl transition-all text-left ${
                            checked
                              ? "border-[#c084fc] bg-[#c084fc]/10 text-[#c084fc]"
                              : "border-slate-700 text-slate-200 hover:border-slate-600 bg-[#0f172a]"
                          }`}
                        >
                          <span className={`w-5 h-5 flex items-center justify-center shrink-0 border-2 rounded-xl transition-colors ${
                            checked ? "bg-[#c084fc] border-[#c084fc]" : "border-slate-600"
                          }`}>
                            {checked && <Check className="w-3 h-3 text-white" />}
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
                      className="w-full flex items-center justify-between border border-slate-700 rounded-xl hover:border-[#c084fc] px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-left transition-colors bg-[#0f172a]"
                    >
                      <span className={answers[currentField.id] ? "text-white" : "text-slate-400"}>
                        {answers[currentField.id] || "Select an option..."}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-300 shrink-0" />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 z-20 w-full bg-[#0f172a] border border-slate-700 shadow-2xl max-h-48 overflow-y-auto rounded-xl" onClick={e => e.stopPropagation()}>
                        {choices.map((opt, idx) => (
                          <button
                            key={opt + idx}
                            type="button"
                            onClick={() => { setAnswer(currentField.id, opt); setDropdownOpen(false); }}
                            className="w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wide hover:bg-[#c084fc]/10 hover:text-[#c084fc] transition-colors text-slate-200"
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
                    <div className="relative w-full h-2 bg-slate-700 rounded-full">
                      <div className="absolute left-0 top-0 bottom-0 bg-[#c084fc] rounded-full" style={{ width: `${sliderPercent}%` }} />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-[#c084fc] rounded-full border-2 border-[#1e293b]"
                        style={{ left: `calc(${sliderPercent}% - 10px)` }}
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
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                      <span>{min}</span>
                      <span className="text-[#c084fc] text-sm font-black">{sliderValue}</span>
                      <span>{max}</span>
                    </div>
                  </div>
                )}

                {/* CONTACT_INFO or ADDRESS */}
                {(currentField.fieldType === "CONTACT_INFO" || currentField.fieldType === "ADDRESS") && childFields.length > 0 && (
                  <div className="flex flex-col gap-6 mt-2">
                    {childFields.map(child => (
                      <div key={child.id} className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          {child.label}{child.isRequired && <span className="text-[#c084fc] ml-1">*</span>}
                        </label>
                        {child.fieldType === "EMAIL" ? (
                          <div className="flex items-center gap-2 border-b border-slate-700 focus-within:border-[#c084fc] transition-colors py-2">
                            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                            <input type="email" value={answers[child.id] ?? ""} onChange={e => setAnswer(child.id, e.target.value)} placeholder={child.placeholder || "email@example.com"} className="bg-transparent text-white w-full focus:outline-none placeholder-[#475569] text-base" />
                          </div>
                        ) : child.fieldType === "PHONE" ? (
                          <div className="flex items-center gap-2 border-b border-slate-700 focus-within:border-[#c084fc] transition-colors py-2">
                            <PhoneIcon className="w-4 h-4 text-slate-400 shrink-0" />
                            <input type="tel" value={answers[child.id] ?? ""} onChange={e => setAnswer(child.id, e.target.value.replace(/[^0-9]/g, ""))} placeholder={child.placeholder || "(555) 000-0000"} className="bg-transparent text-white w-full focus:outline-none placeholder-[#475569] text-base" />
                          </div>
                        ) : child.fieldType === "WEBSITE" ? (
                          <div className="flex items-center gap-2 border-b border-slate-700 focus-within:border-[#c084fc] transition-colors py-2">
                            <GlobeIcon className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-slate-400 font-bold">https://</span>
                            <input type="text" value={answers[child.id] ?? ""} onChange={e => setAnswer(child.id, e.target.value)} placeholder={child.placeholder || "yourwebsite.com"} className="bg-transparent text-white w-full focus:outline-none placeholder-[#475569] text-base" />
                          </div>
                        ) : (
                          <input type="text" value={answers[child.id] ?? ""} onChange={e => setAnswer(child.id, e.target.value)} placeholder={child.placeholder || ""} className="bg-transparent border-b border-slate-700 focus:border-[#c084fc] text-white py-2 w-full focus:outline-none transition-colors placeholder-[#475569] text-base" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Media Upload & Active Capture Types */}
                {["IMAGE", "VIDEO", "FILE", "AUDIO"].includes(currentField.fieldType) && (() => {
                  const handleFileUpload = async (selectedFile: File) => {
                    const FOLDERS = { IMAGE: "IMAGE", VIDEO: "VIDEO", FILE: "PDF", AUDIO: "AUDIO" };
                    const LIMITS = {
                      IMAGE: 300 * 1024,
                      FILE: 200 * 1024,
                      VIDEO: 10 * 1024 * 1024,
                      AUDIO: 10 * 1024 * 1024,
                    };

                    const fieldTypeKey = currentField.fieldType === "FILE" ? "FILE" : currentField.fieldType as keyof typeof LIMITS;
                    const limit = LIMITS[fieldTypeKey];
                    
                    if (selectedFile.size > limit) {
                      const displaySize = limit >= 1024 * 1024 
                        ? `${limit / (1024 * 1024)}MB` 
                        : `${limit / 1024}KB`;
                      toast.error(`Frontend validation: File size exceeds ${displaySize} constraint for type ${currentField.fieldType}.`);
                      return;
                    }

                    setIsUploadingInternal(true);
                    setUploadProgress("Uploading file...");
                    try {
                      const formData = new FormData();
                      formData.append("file", selectedFile);
                      formData.append("type", FOLDERS[currentField.fieldType as keyof typeof FOLDERS]);

                      const apiBase = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/trpc', '') : 'http://localhost:8000';
                      const response = await fetch(`${apiBase}/api/upload`, {
                        method: "POST",
                        body: formData,
                      });

                      const resData = await response.json();
                      if (!response.ok) {
                        throw new Error(resData.error || "Upload failed");
                      }

                      setAnswer(currentField.id, resData.url);
                      toast.success("File uploaded successfully!");
                    } catch (err: any) {
                      toast.error(err.message || "Something went wrong during file upload.");
                    } finally {
                      setIsUploadingInternal(false);
                      setUploadProgress("");
                    }
                  };

                  const startRecording = async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      const options = { mimeType: "audio/webm" };
                      const newRecorder = new MediaRecorder(stream, options);
                      
                      const chunks: Blob[] = [];
                      newRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) chunks.push(e.data);
                      };

                      newRecorder.onstop = () => {
                        const audioBlob = new Blob(chunks, { type: "audio/webm" });
                        const audioUrl = URL.createObjectURL(audioBlob);
                        setAudioPreviewUrl(audioUrl);
                        setAudioChunks(chunks);
                      };

                      newRecorder.start();
                      setRecorder(newRecorder);
                      setIsRecording(true);
                      toast.info("Microphone recording started...");
                    } catch (err: any) {
                      toast.error("Failed to access microphone.");
                    }
                  };

                  const stopRecording = () => {
                    if (recorder && isRecording) {
                      recorder.stop();
                      recorder.stream.getTracks().forEach(track => track.stop());
                      setIsRecording(false);
                      toast.success("Recording complete.");
                    }
                  };

                  const uploadRecordedAudio = async () => {
                    if (audioChunks.length === 0) return;
                    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                    const audioFile = new File([audioBlob], `recording_${Date.now()}.webm`, { type: "audio/webm" });
                    await handleFileUpload(audioFile);
                  };

                  const resetAudioRecord = () => {
                    setAudioPreviewUrl(null);
                    setAudioChunks([]);
                    setRecorder(null);
                  };

                  const currentUrl = answers[currentField.id];

                  return (
                    <div className="flex flex-col gap-4 mt-2 max-w-lg w-full">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] bg-[#0f172a] p-3 border border-slate-700/60 rounded-xl">
                        <AlertCircle className="w-3.5 h-3.5 text-[#c084fc] shrink-0" />
                        {currentField.fieldType === "IMAGE" && "Images: 300KB max (JPEG, PNG)."}
                        {currentField.fieldType === "VIDEO" && "Videos: 10MB max (MP4, WebM)."}
                        {currentField.fieldType === "FILE" && "Documents: 200KB max (PDF)."}
                        {currentField.fieldType === "AUDIO" && "Audio clips: 10MB max."}
                      </div>

                      {currentField.fieldType !== "AUDIO" ? (
                        <div className="flex flex-col gap-4">
                          <label className="border border-dashed border-slate-700 hover:border-[#c084fc] rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-[#0f172a]/40 transition-colors cursor-pointer text-center group">
                            <input
                              type="file"
                              className="hidden"
                              accept={
                                currentField.fieldType === "IMAGE" ? "image/*" :
                                currentField.fieldType === "VIDEO" ? "video/*" :
                                ".pdf"
                              }
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file);
                              }}
                              disabled={isUploading}
                            />
                            {currentField.fieldType === "IMAGE" && <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-[#c084fc] transition-colors shrink-0" />}
                            {currentField.fieldType === "VIDEO" && <VideoIcon className="w-8 h-8 text-slate-400 group-hover:text-[#c084fc] transition-colors shrink-0" />}
                            {currentField.fieldType === "FILE" && <FileText className="w-8 h-8 text-slate-400 group-hover:text-[#c084fc] transition-colors shrink-0" />}
                            
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 group-hover:text-white transition-colors">
                              {isUploading ? "Uploading..." : `Select ${currentField.fieldType}`}
                            </span>
                          </label>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4 border border-slate-700 p-5 bg-[#0f172a]/40 rounded-xl">
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase text-slate-300">Option 1: Upload Audio File</span>
                            <label className="border border-slate-700 hover:border-[#c084fc] p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors bg-[#0f172a] rounded-xl">
                              <input
                                type="file"
                                className="hidden"
                                accept="audio/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file);
                                }}
                                disabled={isUploading}
                              />
                              <Upload className="w-4 h-4 text-slate-400" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-white">Choose File</span>
                            </label>
                          </div>

                          <div className="relative flex py-2 items-center justify-center">
                            <div className="flex-grow border-t border-slate-700"></div>
                            <span className="flex-shrink mx-4 text-[9px] font-bold uppercase text-neutral-600">Or</span>
                            <div className="flex-grow border-t border-slate-700"></div>
                          </div>

                          <div className="flex flex-col gap-3">
                            <span className="text-[10px] font-bold uppercase text-slate-300">Option 2: Record Live Audio</span>
                            
                            {!audioPreviewUrl ? (
                              <div className="flex gap-2">
                                {!isRecording ? (
                                  <button
                                    type="button"
                                    onClick={startRecording}
                                    disabled={isUploading}
                                    className="w-full flex items-center justify-center gap-2 bg-[#c084fc] hover:bg-[#c084fc]/90 text-white font-bold uppercase tracking-wider text-xs py-3 rounded-xl transition-all"
                                  >
                                    <Music className="w-4 h-4 shrink-0" /> Start Recording
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={stopRecording}
                                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-xs py-3 rounded-xl transition-all"
                                  >
                                    Stop Recording
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-3 border border-slate-700 p-3 bg-slate-800/50 rounded-xl">
                                <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Recording Saved
                                </span>
                                <audio src={audioPreviewUrl} controls className="w-full h-8" />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={uploadRecordedAudio}
                                    disabled={isUploading}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-[10px] py-2 rounded-xl transition-colors"
                                  >
                                    <Upload className="w-3.5 h-3.5" /> Upload
                                  </button>
                                  <button
                                    type="button"
                                    onClick={resetAudioRecord}
                                    disabled={isUploading}
                                    className="flex-1 flex items-center justify-center gap-1.5 border border-slate-700 text-slate-300 hover:text-white font-bold uppercase text-[10px] py-2 rounded-xl transition-colors"
                                  >
                                    Reset
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {isUploading && (
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-300 bg-[#0f172a] p-3 border border-slate-700 rounded-xl">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c084fc] shrink-0" />
                          {uploadProgress}
                        </div>
                      )}

                      {currentUrl && (
                        <div className="border border-slate-700 p-4 bg-[#0f172a]/60 rounded-xl flex flex-col gap-3">
                          <span className="text-[10px] font-bold uppercase text-[#c084fc] flex items-center gap-1.5 border-b border-slate-700 pb-2">
                            <Check className="w-3.5 h-3.5 text-[#c084fc] shrink-0" /> Uploaded Successfully
                          </span>
                          
                          {currentField.fieldType === "IMAGE" && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={currentUrl} alt="Preview" className="w-full max-h-36 object-contain border border-slate-700 bg-[#0f172a] rounded-xl" />
                          )}

                          {currentField.fieldType === "VIDEO" && (
                            <video src={currentUrl} controls className="w-full max-h-36 object-contain border border-slate-700 bg-[#0f172a] rounded-xl" />
                          )}

                          {(currentField.fieldType === "AUDIO" || currentUrl.endsWith(".webm") || currentUrl.endsWith(".mp3") || currentUrl.endsWith(".wav")) && (
                            <audio src={currentUrl} controls className="w-full" />
                          )}

                          {currentField.fieldType === "FILE" && (
                            <div className="flex items-center justify-between gap-4 p-2 bg-[#0f172a] border border-slate-700 rounded-xl">
                              <span className="text-[10px] font-bold truncate max-w-[200px]">{currentUrl}</span>
                              <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold uppercase border border-slate-600 px-2 py-1 hover:border-white transition-colors rounded text-white">Open</a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Dynamic sliding down error display */}
              <AnimatePresence>
                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-red-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" /> {validationError}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {submitError && (
                <p className="text-red-500 text-xs font-bold uppercase tracking-wider">{submitError}</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation & Progress indicators */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Submit/Continue button */}
          <div className="order-last md:order-first">
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting || isRequiredEmpty}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#c084fc] text-white font-bold uppercase tracking-wider text-[14px] px-7 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.03] hover:brightness-110 hover:shadow-[0_4px_20px_rgba(255,107,53,0.3)] active:scale-[0.97] disabled:opacity-40 disabled:hover:scale-100 disabled:hover:brightness-100 disabled:hover:shadow-none disabled:cursor-not-allowed select-none"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : isLastStep && !["WELCOME", "INFO"].includes(currentField.fieldType) ? (
                <>Submit</>
              ) : (
                <>Continue →</>
              )}
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2">
            {topLevelFields.map((field, idx) => {
              const isActive = stepIndex === idx;
              const isCompleted = idx < stepIndex;

              return (
                <motion.div
                  key={field.id}
                  animate={isActive ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                  transition={isActive ? { type: "keyframes", duration: 0.3, ease: "easeOut" } : { type: "spring", stiffness: 300, damping: 15 }}
                  className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                    isActive 
                      ? "w-2.5 h-2.5 bg-[#c084fc]" 
                      : isCompleted 
                        ? "w-[7px] h-[7px] bg-[#34d399]" 
                        : "w-1.5 h-1.5 bg-[#334155]"
                  }`}
                >
                  {isCompleted && (
                    <div className="w-[3px] h-[3px] bg-white rounded-full" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Powered by Fomz */}
      <div className="mt-8 text-center select-none pb-4">
        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          Powered by Fomz
        </span>
      </div>
    </main>
  );
}
