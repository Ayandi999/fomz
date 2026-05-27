"use client";

import { useState, use, useEffect, useRef, useTransition } from "react";
import { useGetPublicForm } from "~/hooks/api/forms/useGetPublicForm";
import { useSubmitFormResponse } from "~/hooks/api/forms/useSubmitFormResponse";
import { useRouter } from "next/navigation";
import { 
  ChevronDown, Globe as GlobeIcon, Phone as PhoneIcon, 
  Mail, Star, CheckSquare, AlignLeft, Type, Hash, Calendar,
  ArrowRight, ArrowLeft, Check, Loader2, Upload, Music,
  RefreshCw, AlertCircle, FileText, Image as ImageIcon, Video as VideoIcon,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

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
  const router = useRouter();

  const [passwordInput, setPasswordInput] = useState("");
  const [submittedPassword, setSubmittedPassword] = useState<string | undefined>(undefined);

  const { formId, fields, themeCode, isLoading, isError, error } = useGetPublicForm(slug, submittedPassword);
  
  useEffect(() => {
    if (isError && (error as any)?.message === "LOGIN_REQUIRED") {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isError, error, router]);

  useEffect(() => {
    if (isError && (error as any)?.message === "INCORRECT_PASSWORD") {
      toast.error("please enter the correct password");
    }
  }, [isError, error]);

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

  // File uploading and Audio media recorder states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

  // Animation states & accessibility
  const shouldReduceMotion = useReducedMotion();
  const [isCardShaking, setIsCardShaking] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const topLevelFields = (fields || []).filter((f: PublicField) => !f.parentId);
  const currentField = topLevelFields[stepIndex];
  const totalSteps = topLevelFields.length;

  const getChildFields = (parentId: string) =>
    (fields || []).filter((f: PublicField) => f.parentId === parentId);

  const isNonInteractive = (type: FieldType) => ["WELCOME", "INFO"].includes(type);
  const isLastStep = stepIndex === totalSteps - 1;

  // Country Codes Fetch
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
    setValidationError("");
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

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Loading form…</p>
        </div>
      </main>
    );
  }

  if (isError && ((error as any)?.message === "PASSWORD_REQUIRED" || (error as any)?.message === "INCORRECT_PASSWORD")) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white p-6">
        <div className="border border-neutral-800/40 bg-[#111111] p-8 max-w-md w-full flex flex-col gap-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="w-16 h-16 rounded-full bg-[#FF6B35]/10 flex items-center justify-center mx-auto text-[#FF6B35]">
            <Lock className="w-8 h-8" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">Password Protected</h1>
            <p className="text-xs text-[#A1A1A1] uppercase tracking-wider leading-relaxed mt-2">
              This form is password protected. Please enter the password to access it.
            </p>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!passwordInput.trim()) {
              toast.error("Please enter a password");
              return;
            }
            setSubmittedPassword(passwordInput);
          }} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Enter form password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="bg-transparent text-white text-lg py-3 px-4 border border-neutral-800 rounded-xl focus:outline-none focus:border-[#FF6B35] transition-colors placeholder-[#4A4A4A]"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-3.5 bg-[#FF6B35] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#FF6B35]/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#FF6B35]/15"
            >
              Unlock Form
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (isError && (error as any)?.message === "UNAUTHORIZED_DOMAIN_RESTRICTED") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white p-6">
        <div className="border border-red-500/20 bg-red-950/10 p-8 max-w-md w-full flex flex-col gap-5 text-center rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-red-400">Access Restricted</h1>
          <p className="text-xs text-[#A1A1A1] uppercase tracking-wider leading-relaxed">
            This account is not allowed. This is a private form restricted to specific organization domains. Try signing in with a different account.
          </p>
          <button
            onClick={() => {
              router.push(`/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
            }}
            className="w-full py-3.5 bg-[#FF6B35] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#FF6B35]/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#FF6B35]/15"
          >
            Try other accounts
          </button>
        </div>
      </main>
    );
  }

  if (isError || !fields || !formId) {
    const msg = (error as any)?.message ?? "This form is unavailable";
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white p-6">
        <div className="border border-red-500/20 bg-red-950/10 p-8 max-w-md w-full flex flex-col gap-4 text-center rounded-3xl">
          <h1 className="text-2xl font-black uppercase tracking-tight text-red-400">Unavailable</h1>
          <p className="text-sm text-neutral-400 uppercase tracking-wider">{msg}</p>
        </div>
      </main>
    );
  }

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
    setValidationError(msg);
    setIsCardShaking(true);
    setTimeout(() => setIsCardShaking(false), 400);
  };

  const handleNext = () => {
    if (isUploading) {
      triggerError("Please wait until your file upload completes.");
      return;
    }
    if (!validateStep()) return;
    setValidationError("");
    if (isLastStep) {
      handleSubmit();
    } else {
      setIsNavigating(true);
      setTimeout(() => {
        setStepIndex(s => s + 1);
        setIsNavigating(false);
      }, 250);
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

  const handleBack = () => {
    if (stepIndex > 0) {
      setValidationError("");
      setIsNavigating(true);
      setTimeout(() => {
        setStepIndex(s => s - 1);
        setIsNavigating(false);
      }, 250);
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
    const thankYouSlide = topLevelFields.find((f: PublicField) => f.fieldType === "THANK_YOU");
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white p-6 relative overflow-hidden select-none">
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
              className="absolute w-2 h-2 rounded-full bg-[#FF6B35]"
            />
          ))}
        </div>

        <div className="w-full max-w-[720px] bg-[#111111] rounded-[24px] border border-neutral-800/40 p-12 md:shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-center relative z-10 flex flex-col items-center justify-center min-h-[360px]">
          <svg className="w-20 h-20 mb-8" viewBox="0 0 52 52">
            <motion.circle 
              cx="26" 
              cy="26" 
              r="25" 
              fill="none" 
              stroke="#FF6B35" 
              strokeWidth="2" 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
            <motion.path 
              fill="none" 
              stroke="#FF6B35" 
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
            className="text-[#A1A1A1] text-base mb-8"
          >
            {thankYouSlide?.placeholder || "Thank you for your time."}
          </motion.p>

          <motion.a
            href="/"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="px-6 py-3 border border-[#FF6B35] text-[#FF6B35] font-bold rounded-xl text-sm transition-all hover:bg-[#FF6B35]/10 active:scale-95 duration-200"
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
      className="preview-container min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-0 md:p-6" 
      onClick={() => { setDropdownOpen(false); setPhoneDropdownOpen(false); }}
      onKeyDown={handleKeyDown}
    >
      {themeCode?.css && (
        <style dangerouslySetInnerHTML={{ __html: themeCode.css }} />
      )}
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
        className={`w-full max-w-[720px] bg-[#111111] rounded-none md:rounded-[24px] p-6 md:p-12 border-0 md:border border-neutral-800/40 md:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col justify-between min-h-screen md:min-h-[480px] relative`}
      >
        {/* Header section */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-6 mb-8 text-neutral-500 h-6">
          <div className="w-1/4">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="text-[13px] text-[#666] hover:text-[#A1A1A1] transition-colors focus:outline-none focus:underline"
              >
                ← Back
              </button>
            )}
          </div>
          <div className="w-2/4 text-center">
            <span className="text-[12px] uppercase tracking-wider font-medium text-[#666]">
              Question {stepIndex + 1} of {totalSteps}
            </span>
          </div>
          <div className="w-1/4 text-right">
            {currentField.isRequired && (
              <span className="text-[12px] font-bold text-[#FF6B35]">Required *</span>
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
                  <p className="text-[#A1A1A1] text-base leading-relaxed mb-6">{currentField.placeholder}</p>
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
                      className="bg-transparent text-white text-xl py-3 pr-8 w-full border-b border-neutral-800 focus:outline-none placeholder-[#4A4A4A] transition-colors focus-within:shadow-[inset_0_-1px_0_0_#FF6B35]"
                    />
                    {/* Bottom growing border */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF6B35] origin-center scale-x-0 transition-transform duration-300 pointer-events-none focus-within:scale-x-100" />
                    
                    {/* Green checkmark valid indicator */}
                    {isInputValid && (
                      <Check className="absolute right-2 w-4 h-4 text-[#22C55E] animate-fade-in" />
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
                        className="bg-transparent text-white text-lg py-3 pr-8 w-full border-b border-neutral-800 focus:outline-none placeholder-[#4A4A4A] resize-none overflow-y-auto max-h-[300px]"
                        style={{ height: "auto" }}
                      />
                      {/* Bottom growing border */}
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF6B35] origin-center scale-x-0 transition-transform duration-300 pointer-events-none focus-within:scale-x-100" />

                      {/* Green checkmark valid indicator */}
                      {isInputValid && (
                        <Check className="absolute right-2 bottom-4 w-4 h-4 text-[#22C55E] animate-fade-in" />
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
                      className="bg-transparent text-white text-xl py-3 pr-8 w-full border-b border-neutral-800 focus:outline-none placeholder-[#4A4A4A]"
                    />
                    {isInputValid && (
                      <Check className="absolute right-2 w-4 h-4 text-[#22C55E]" />
                    )}
                  </div>
                )}

                {/* EMAIL */}
                {currentField.fieldType === "EMAIL" && (
                  <div className="relative flex items-center w-full border-b border-neutral-800 py-3">
                    <Mail className="w-5 h-5 text-neutral-500 shrink-0 mr-3" />
                    <input
                      ref={inputRef as any}
                      type="email"
                      value={answers[currentField.id] ?? ""}
                      onChange={e => setAnswer(currentField.id, e.target.value)}
                      placeholder={currentField.placeholder || "name@example.com"}
                      className="bg-transparent text-white text-xl w-full focus:outline-none placeholder-[#4A4A4A]"
                    />
                    {isInputValid && (
                      <Check className="absolute right-2 w-4 h-4 text-[#22C55E]" />
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
                    className="bg-[#161616] border border-neutral-800 rounded-xl text-white text-lg py-3 px-4 w-full focus:outline-none focus:border-[#FF6B35] transition-colors"
                  />
                )}

                {/* WEBSITE */}
                {currentField.fieldType === "WEBSITE" && (
                  <div className="relative flex items-center w-full border-b border-neutral-800 py-3">
                    <GlobeIcon className="w-5 h-5 text-neutral-500 shrink-0 mr-2" />
                    <span className="text-neutral-500 text-lg font-bold mr-1">https://</span>
                    <input
                      ref={inputRef as any}
                      type="text"
                      value={answers[currentField.id] ?? ""}
                      onChange={e => setAnswer(currentField.id, e.target.value)}
                      placeholder={currentField.placeholder || "yourwebsite.com"}
                      className="bg-transparent text-white text-xl w-full focus:outline-none placeholder-[#4A4A4A]"
                    />
                    {isInputValid && (
                      <Check className="absolute right-2 w-4 h-4 text-[#22C55E]" />
                    )}
                  </div>
                )}

                {/* PHONE */}
                {currentField.fieldType === "PHONE" && (
                  <div className="relative flex items-center w-full border-b border-neutral-800 py-3">
                    <PhoneIcon className="w-5 h-5 text-neutral-500 shrink-0 mr-3" />
                    <div className="relative shrink-0 mr-2">
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setPhoneDropdownOpen(o => !o); }}
                        className="flex items-center gap-1.5 border border-neutral-800 px-2 py-1 text-white text-xs font-bold uppercase rounded-md hover:border-[#FF6B35] transition-colors"
                      >
                        {phoneCountry.flag} {phoneCountry.code}
                        <span className="text-neutral-500">{phoneCountry.dialCode}</span>
                      </button>
                      {phoneDropdownOpen && (
                        <div
                          className="absolute bottom-full left-0 mb-2 z-30 w-64 bg-[#161616] border border-neutral-800 shadow-2xl p-2 flex flex-col gap-2 max-h-64 overflow-hidden rounded-xl"
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            autoFocus
                            type="text"
                            value={phoneSearch}
                            onChange={e => setPhoneSearch(e.target.value)}
                            placeholder="Search country..."
                            className="bg-[#0A0A0A] border border-neutral-800 px-2 py-1.5 text-xs text-white focus:outline-none rounded-md w-full"
                          />
                          <div className="flex flex-col gap-0.5 overflow-y-auto max-h-40">
                            {filteredCountries.map(c => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => { setPhoneCountry({ code: c.code, flag: c.flag, dialCode: c.dialCode }); setPhoneDropdownOpen(false); setPhoneSearch(""); }}
                                className="w-full text-left px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 flex items-center justify-between rounded"
                              >
                                <span>{c.flag} {c.name}</span>
                                <span className="text-neutral-500">{c.dialCode}</span>
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
                      className="bg-transparent text-white text-xl w-full focus:outline-none placeholder-[#4A4A4A]"
                    />
                    {isInputValid && (
                      <Check className="absolute right-2 w-4 h-4 text-[#22C55E]" />
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
                            ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                            : "border-neutral-800 text-neutral-300 hover:border-neutral-700 bg-neutral-900/30"
                        }`}
                      >
                        <span className={`w-5 h-5 flex items-center justify-center font-bold text-xs border rounded-md ${
                          answers[currentField.id] === opt ? "bg-[#FF6B35] text-white border-[#FF6B35]" : "border-neutral-700 text-neutral-500"
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
                            ? "text-[#FF6B35] fill-[#FF6B35]"
                            : "text-neutral-700"
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
                            ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                            : "border-neutral-800 text-neutral-300 hover:border-neutral-700 bg-[#161616]"
                        }`}
                      >
                        <span className={`w-6 h-6 flex items-center justify-center text-[10px] font-black shrink-0 border rounded-md ${
                          answers[currentField.id] === opt ? "bg-[#FF6B35] text-white border-[#FF6B35]" : "border-neutral-700 text-neutral-500"
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
                              ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                              : "border-neutral-800 text-neutral-300 hover:border-neutral-700 bg-[#161616]"
                          }`}
                        >
                          <span className={`w-5 h-5 flex items-center justify-center shrink-0 border-2 rounded-md transition-colors ${
                            checked ? "bg-[#FF6B35] border-[#FF6B35]" : "border-neutral-700"
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
                      className="w-full flex items-center justify-between border border-neutral-800 rounded-xl hover:border-[#FF6B35] px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-left transition-colors bg-[#161616]"
                    >
                      <span className={answers[currentField.id] ? "text-white" : "text-neutral-500"}>
                        {answers[currentField.id] || "Select an option..."}
                      </span>
                      <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 z-20 w-full bg-[#161616] border border-neutral-800 shadow-2xl max-h-48 overflow-y-auto rounded-xl" onClick={e => e.stopPropagation()}>
                        {choices.map((opt, idx) => (
                          <button
                            key={opt + idx}
                            type="button"
                            onClick={() => { setAnswer(currentField.id, opt); setDropdownOpen(false); }}
                            className="w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wide hover:bg-[#FF6B35]/10 hover:text-[#FF6B35] transition-colors text-neutral-300"
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
                    <div className="relative w-full h-2 bg-neutral-800 rounded-full">
                      <div className="absolute left-0 top-0 bottom-0 bg-[#FF6B35] rounded-full" style={{ width: `${sliderPercent}%` }} />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-[#FF6B35] rounded-full border-2 border-[#111111]"
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
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-500">
                      <span>{min}</span>
                      <span className="text-[#FF6B35] text-sm font-black">{sliderValue}</span>
                      <span>{max}</span>
                    </div>
                  </div>
                )}

                {/* CONTACT_INFO or ADDRESS */}
                {(currentField.fieldType === "CONTACT_INFO" || currentField.fieldType === "ADDRESS") && childFields.length > 0 && (
                  <div className="flex flex-col gap-6 mt-2">
                    {childFields.map(child => (
                      <div key={child.id} className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                          {child.label}{child.isRequired && <span className="text-[#FF6B35] ml-1">*</span>}
                        </label>
                        {child.fieldType === "EMAIL" ? (
                          <div className="flex items-center gap-2 border-b border-neutral-800 focus-within:border-[#FF6B35] transition-colors py-2">
                            <Mail className="w-4 h-4 text-neutral-500 shrink-0" />
                            <input type="email" value={answers[child.id] ?? ""} onChange={e => setAnswer(child.id, e.target.value)} placeholder={child.placeholder || "email@example.com"} className="bg-transparent text-white w-full focus:outline-none placeholder-[#4A4A4A] text-base" />
                          </div>
                        ) : child.fieldType === "PHONE" ? (
                          <div className="flex items-center gap-2 border-b border-neutral-800 focus-within:border-[#FF6B35] transition-colors py-2">
                            <PhoneIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                            <input type="tel" value={answers[child.id] ?? ""} onChange={e => setAnswer(child.id, e.target.value.replace(/[^0-9]/g, ""))} placeholder={child.placeholder || "(555) 000-0000"} className="bg-transparent text-white w-full focus:outline-none placeholder-[#4A4A4A] text-base" />
                          </div>
                        ) : child.fieldType === "WEBSITE" ? (
                          <div className="flex items-center gap-2 border-b border-neutral-800 focus-within:border-[#FF6B35] transition-colors py-2">
                            <GlobeIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                            <span className="text-neutral-500 font-bold">https://</span>
                            <input type="text" value={answers[child.id] ?? ""} onChange={e => setAnswer(child.id, e.target.value)} placeholder={child.placeholder || "yourwebsite.com"} className="bg-transparent text-white w-full focus:outline-none placeholder-[#4A4A4A] text-base" />
                          </div>
                        ) : (
                          <input type="text" value={answers[child.id] ?? ""} onChange={e => setAnswer(child.id, e.target.value)} placeholder={child.placeholder || ""} className="bg-transparent border-b border-neutral-800 focus:border-[#FF6B35] text-white py-2 w-full focus:outline-none transition-colors placeholder-[#4A4A4A] text-base" />
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

                    setIsUploading(true);
                    setUploadProgress("Uploading file...");
                    try {
                      const formData = new FormData();
                      formData.append("file", selectedFile);
                      formData.append("type", FOLDERS[currentField.fieldType as keyof typeof FOLDERS]);

                      const response = await fetch("http://localhost:8000/api/upload", {
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
                      setIsUploading(false);
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
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#A1A1A1] bg-[#161616] p-3 border border-neutral-800/60 rounded-xl">
                        <AlertCircle className="w-3.5 h-3.5 text-[#FF6B35] shrink-0" />
                        {currentField.fieldType === "IMAGE" && "Images: 300KB max (JPEG, PNG)."}
                        {currentField.fieldType === "VIDEO" && "Videos: 10MB max (MP4, WebM)."}
                        {currentField.fieldType === "FILE" && "Documents: 200KB max (PDF)."}
                        {currentField.fieldType === "AUDIO" && "Audio clips: 10MB max."}
                      </div>

                      {currentField.fieldType !== "AUDIO" ? (
                        <div className="flex flex-col gap-4">
                          <label className="border border-dashed border-neutral-800 hover:border-[#FF6B35] rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-[#161616]/40 transition-colors cursor-pointer text-center group">
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
                            {currentField.fieldType === "IMAGE" && <ImageIcon className="w-8 h-8 text-neutral-500 group-hover:text-[#FF6B35] transition-colors shrink-0" />}
                            {currentField.fieldType === "VIDEO" && <VideoIcon className="w-8 h-8 text-neutral-500 group-hover:text-[#FF6B35] transition-colors shrink-0" />}
                            {currentField.fieldType === "FILE" && <FileText className="w-8 h-8 text-neutral-500 group-hover:text-[#FF6B35] transition-colors shrink-0" />}
                            
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 group-hover:text-white transition-colors">
                              {isUploading ? "Uploading..." : `Select ${currentField.fieldType}`}
                            </span>
                          </label>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4 border border-neutral-800 p-5 bg-[#161616]/40 rounded-xl">
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase text-neutral-400">Option 1: Upload Audio File</span>
                            <label className="border border-neutral-800 hover:border-[#FF6B35] p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors bg-[#161616] rounded-xl">
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
                              <Upload className="w-4 h-4 text-neutral-500" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-white">Choose File</span>
                            </label>
                          </div>

                          <div className="relative flex py-2 items-center justify-center">
                            <div className="flex-grow border-t border-neutral-800"></div>
                            <span className="flex-shrink mx-4 text-[9px] font-bold uppercase text-neutral-600">Or</span>
                            <div className="flex-grow border-t border-neutral-800"></div>
                          </div>

                          <div className="flex flex-col gap-3">
                            <span className="text-[10px] font-bold uppercase text-neutral-400">Option 2: Record Live Audio</span>
                            
                            {!audioPreviewUrl ? (
                              <div className="flex gap-2">
                                {!isRecording ? (
                                  <button
                                    type="button"
                                    onClick={startRecording}
                                    disabled={isUploading}
                                    className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-bold uppercase tracking-wider text-xs py-3 rounded-xl transition-all"
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
                              <div className="flex flex-col gap-3 border border-neutral-800 p-3 bg-neutral-900/50 rounded-xl">
                                <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Recording Saved
                                </span>
                                <audio src={audioPreviewUrl} controls className="w-full h-8" />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={uploadRecordedAudio}
                                    disabled={isUploading}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-[10px] py-2 rounded-lg transition-colors"
                                  >
                                    <Upload className="w-3.5 h-3.5" /> Upload
                                  </button>
                                  <button
                                    type="button"
                                    onClick={resetAudioRecord}
                                    disabled={isUploading}
                                    className="flex-1 flex items-center justify-center gap-1.5 border border-neutral-800 text-neutral-400 hover:text-white font-bold uppercase text-[10px] py-2 rounded-lg transition-colors"
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
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-neutral-400 bg-[#161616] p-3 border border-neutral-800 rounded-xl">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6B35] shrink-0" />
                          {uploadProgress}
                        </div>
                      )}

                      {currentUrl && (
                        <div className="border border-neutral-800 p-4 bg-[#161616]/60 rounded-xl flex flex-col gap-3">
                          <span className="text-[10px] font-bold uppercase text-[#FF6B35] flex items-center gap-1.5 border-b border-neutral-800 pb-2">
                            <Check className="w-3.5 h-3.5 text-[#FF6B35] shrink-0" /> Uploaded Successfully
                          </span>
                          
                          {currentField.fieldType === "IMAGE" && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={currentUrl} alt="Preview" className="w-full max-h-36 object-contain border border-neutral-800 bg-[#0A0A0A] rounded-lg" />
                          )}

                          {currentField.fieldType === "VIDEO" && (
                            <video src={currentUrl} controls className="w-full max-h-36 object-contain border border-neutral-800 bg-[#0A0A0A] rounded-lg" />
                          )}

                          {(currentField.fieldType === "AUDIO" || currentUrl.endsWith(".webm") || currentUrl.endsWith(".mp3") || currentUrl.endsWith(".wav")) && (
                            <audio src={currentUrl} controls className="w-full" />
                          )}

                          {currentField.fieldType === "FILE" && (
                            <div className="flex items-center justify-between gap-4 p-2 bg-[#0A0A0A] border border-neutral-800 rounded-lg">
                              <span className="text-[10px] font-bold truncate max-w-[200px]">{currentUrl}</span>
                              <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold uppercase border border-neutral-700 px-2 py-1 hover:border-white transition-colors rounded text-white">Open</a>
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
        <div className="mt-8 pt-6 border-t border-neutral-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Submit/Continue button */}
          <div className="order-last md:order-first">
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting || isRequiredEmpty}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#FF6B35] text-white font-bold uppercase tracking-wider text-[14px] px-7 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.03] hover:brightness-110 hover:shadow-[0_4px_20px_rgba(255,107,53,0.3)] active:scale-[0.97] disabled:opacity-40 disabled:hover:scale-100 disabled:hover:brightness-100 disabled:hover:shadow-none disabled:cursor-not-allowed select-none"
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
                      ? "w-2.5 h-2.5 bg-[#FF6B35]" 
                      : isCompleted 
                        ? "w-[7px] h-[7px] bg-[#22C55E]" 
                        : "w-1.5 h-1.5 bg-[#2A2A2A]"
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

      {/* Powered by Formz */}
      <div className="mt-8 text-center select-none pb-4">
        <span className="text-[10px] text-neutral-700 font-bold uppercase tracking-widest">
          Powered by Formz
        </span>
      </div>
    </main>
  );
}
