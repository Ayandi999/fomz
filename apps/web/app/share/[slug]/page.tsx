"use client";

import { useState, use, useEffect, useRef, useTransition } from "react";
import { useGetPublicForm } from "~/hooks/api/forms/useGetPublicForm";
import { useSubmitFormResponse } from "~/hooks/api/forms/useSubmitFormResponse";
import { useRouter } from "next/navigation";
import { themeRegistry } from "~/components/themes/registry";
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

  const { formId, fields, themeKey, isLoading, isError, error } = useGetPublicForm(slug, submittedPassword);
  
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
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Loading form…</p>
        </div>
      </main>
    );
  }

  if (isError && ((error as any)?.message === "PASSWORD_REQUIRED" || (error as any)?.message === "INCORRECT_PASSWORD")) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white p-6">
        <div className="border border-neutral-800/40 bg-[#111111] p-8 max-w-md w-full flex flex-col gap-6 rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="w-16 h-16 rounded-full bg-[#2563EB]/10 flex items-center justify-center mx-auto text-[#2563EB]">
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
              className="bg-transparent text-white text-lg py-3 px-4 border border-neutral-800 rounded-none focus:outline-none focus:border-[#2563EB] transition-colors placeholder-[#4A4A4A]"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-3.5 bg-[#2563EB] text-white font-bold text-xs uppercase tracking-widest rounded-none hover:bg-[#2563EB]/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#2563EB]/15"
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
        <div className="border border-red-500/20 bg-red-950/10 p-8 max-w-md w-full flex flex-col gap-5 text-center rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
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
            className="w-full py-3.5 bg-[#2563EB] text-white font-bold text-xs uppercase tracking-widest rounded-none hover:bg-[#2563EB]/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#2563EB]/15"
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
        <div className="border border-red-500/20 bg-red-950/10 p-8 max-w-md w-full flex flex-col gap-4 text-center rounded-none">
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


  const ThemeComponent = themeRegistry[themeKey || "lightMode"] || themeRegistry["lightMode"];

  return (
    <ThemeComponent
      mode="public"
      fields={topLevelFields as any}
      answers={answers}
      setAnswer={setAnswer}
      stepIndex={stepIndex}
      setStepIndex={setStepIndex}
      handleNext={handleNext}
      handleBack={handleBack}
      handleSubmit={handleSubmit}
      submitted={submitted}
      submitError={submitError}
      validationError={validationError}
      isUploading={isUploading}
      shouldReduceMotion={shouldReduceMotion}
      isNavigating={isNavigating}
      isCardShaking={isCardShaking}
    />
  );
}
