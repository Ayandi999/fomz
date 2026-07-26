"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Save, Eye, EyeOff, CheckSquare,
  Sparkles, Type, AlignLeft, Hash, Mail, Calendar, ToggleLeft, Star,
  Image as ImageIcon, Video as VideoIcon, Mic as AudioIcon, FileText as FileIcon,
  List as ListIcon, ChevronDown, Sliders, User as UserIcon, MapPin as MapPinIcon,
  Phone as PhoneIcon, Globe as GlobeIcon, Link as LinkIcon, Copy, ExternalLink, QrCode, ArrowRight, Check, Download, LogOut, Edit3
} from "lucide-react";
import { useUser } from "~/hooks/api/auth/useUser";
import { useGetFormFields } from "~/hooks/api/forms/useGetFormFields";
import { useCreateFormFields } from "~/hooks/api/forms/useCreateFormFields";
import { usePutFormFields } from "~/hooks/api/forms/usePutFormFields";
import { useDeleteFormField } from "~/hooks/api/forms/useDeleteFormField";
import { usePublishForm } from "~/hooks/api/forms/usePublishForm";
import { useUserForms } from "~/hooks/api/forms/useUserForms";
import { useGetFormAnalytics } from "~/hooks/api/forms/useGetFormAnalytics";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import AnalyticsPanel from "./analytics";
import { trpc } from "~/trpc/client";
import { SlidesSidebar } from "~/components/edit/SlidesSidebar";
import { SettingsSidebar } from "~/components/edit/SettingsSidebar";
import { EditHeader } from "~/components/edit/EditHeader";
import { LivePreview } from "~/components/edit/LivePreview";
import { DynamicFieldCard } from "~/components/edit/cards/DynamicFieldCard";

export type FieldType =
  | "LONG_TEXT"
  | "SHORT_TEXT"
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "FILE"
  | "MULTIPLE_CHOICE"
  | "YES_NO"
  | "CHECKBOX"
  | "DROPDOWN"
  | "SLIDER"
  | "NUMBER"
  | "EMAIL"
  | "CONTACT_INFO"
  | "ADDRESS"
  | "PHONE"
  | "WEBSITE"
  | "RATING"
  | "DATE"
  | "WELCOME"
  | "THANK_YOU"
  | "INFO";

export interface QuestionItem {
  id?: string;
  clientTempId?: string;
  label: string;
  placeholder: string;
  description: string;
  fieldType: FieldType;
  isRequired: boolean;
  index: number;
  labelKey: string;
  parentId?: string | null;
}

export const inputClass =
  "flex h-10 w-full rounded-none border border-black/20 bg-transparent px-3 py-2 text-sm text-[#111] placeholder:text-[#666] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 focus-visible:border-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

export const buttonPrimaryClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm";

export const buttonSecondaryClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-medium border border-black/10 bg-transparent text-[#111] hover:bg-black/5 h-10 px-4 py-2 transition-colors cursor-pointer";

export const cardClass =
  "border border-black/10 bg-white/80 rounded-none p-6 flex flex-col gap-4 shadow-sm";

export default function EditFormPage(props: { params: Promise<{ formId: string }> }) {
  const params = use(props.params);
  const formId = params.formId;
  const router = useRouter();
  
  const { user, isLoading: isUserLoading } = useUser();
  const { forms } = useUserForms();
  const currentForm = forms?.find((f) => f.id === formId);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Dynamic Themes state
  const { data: themes } = trpc.forms.getThemes.useQuery();
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [activeThemeCss, setActiveThemeCss] = useState<string>("");

  const getThemeMutation = trpc.forms.getTheme.useMutation({
    onSuccess: (data: { code: { css: string } }) => {
      setActiveThemeCss(data.code.css);
    }
  });

  const updateThemeMutation = trpc.forms.updateFormTheme.useMutation();

  const selectedThemeIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedThemeIdRef.current = selectedThemeId;
  }, [selectedThemeId]);

  const handleThemeChange = async (themeId: string | null) => {
    setSelectedThemeId(themeId);
    setIsDirty(true);
    isDirtyRef.current = true;
    if (themeId) {
      try {
        const t = await getThemeMutation.mutateAsync({ themeId });
        setActiveThemeCss(t.code.css);
        toast.success(`Theme "${t.name}" loaded!`);
      } catch (err) {
        toast.error("Failed to load theme styles");
      }
    } else {
      setActiveThemeCss("");
    }
  };

  // Sync theme when form data is fetched
  useEffect(() => {
    if (currentForm && currentForm.themeId) {
      setSelectedThemeId(currentForm.themeId);
      if (currentForm.themeCode?.css) {
        setActiveThemeCss(currentForm.themeCode.css);
      } else {
        getThemeMutation.mutate({ themeId: currentForm.themeId });
      }
    }
  }, [currentForm?.themeId, currentForm?.themeCode?.css]);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const { fields: dbFields, isLoading: isFieldsLoading, refetch: refetchFields } = useGetFormFields(formId);
  const { createFormFieldsAsync, isPending: isCreating } = useCreateFormFields();
  const { putFormFieldsAsync, isPending: isPutting } = usePutFormFields();
  const { deleteFormFieldAsync } = useDeleteFormField();
  const isSaving = isCreating || isPutting;
  const { publishFormAsync, isPending: isPublishing } = usePublishForm();

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveErrorMessage, setSaveErrorMessage] = useState<string>("");
  const [publishStatus, setPublishStatus] = useState<boolean>(false);
  const [showAddContent, setShowAddContent] = useState<boolean>(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitleVal, setEditedTitleVal] = useState("");

  // Publish/Share panel states
  const [showPublishPanel, setShowPublishPanel] = useState<boolean>(false);
  const [publishVisibility, setPublishVisibility] = useState<"PUBLIC" | "PRIVATE" | "UNLISTED">("UNLISTED");
  const [publishValidTill, setPublishValidTill] = useState<string>("");
  const [shareTab, setShareTab] = useState<"link" | "qr">("link");
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [publishIsPasswordProtected, setPublishIsPasswordProtected] = useState<boolean>(false);
  const [publishPassword, setPublishPassword] = useState<string>("");
  
  const [activeTab, setActiveTab] = useState<"build" | "analytics">("build");
  const [notificationEmailsInput, setNotificationEmailsInput] = useState<string>("");
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomainInput, setNewDomainInput] = useState("");

  useEffect(() => {
    if (currentForm?.title) {
      setEditedTitleVal(currentForm.title);
    }
  }, [currentForm?.title]);

  const signOutMutation = trpc.auth.signOut.useMutation();
  const handleLogout = async () => {
    try {
      await signOutMutation.mutateAsync();
      router.push("/sign-in");
    } catch (err) {
      console.error("Logout failed, clearing cookies manually", err);
      document.cookie = "access-cookie=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      document.cookie = "refresh-cookie=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      router.push("/sign-in");
    }
  };

  // Fetch responses analytics
  const { analytics, refetch: refetchAnalytics } = useGetFormAnalytics(formId);

  useEffect(() => {
    if (activeTab === "analytics") {
      refetchAnalytics?.();
    }
  }, [activeTab]);

  const handleDownloadCSV = () => {
    if (!analytics?.submissionsList || analytics.submissionsList.length === 0) {
      toast.error("No submission data available to download.");
      return;
    }

    const submissions = analytics.submissionsList;
    const questionKeys = questions.map(q => q.labelKey);
    const questionLabels = questions.map(q => q.label || q.labelKey);
    const headers = ["Submission ID", "Submitted At", ...questionLabels];

    const rows = submissions.map((sub: any) => {
      const subAnswers = sub.answers || {};
      const answerValues = questionKeys.map(key => {
        const val = subAnswers[key] || "";
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      return [
        `"${sub.id}"`,
        `"${new Date(sub.createdAt).toLocaleString()}"`,
        ...answerValues
      ].join(",");
    });

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `form_${formId}_responses.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Responses CSV downloaded successfully!");
  };

  const topLevelQuestions = questions.filter(q => !q.parentId);
  const activeQuestion = topLevelQuestions[activeIdx] || topLevelQuestions[0];
  const activeAbsoluteIdx = questions.findIndex(q => 
    activeQuestion && (
      (q.id && q.id === activeQuestion.id) || 
      (q.clientTempId && q.clientTempId === activeQuestion.clientTempId)
    )
  );
  const activeChildren = questions.filter(q => 
    activeQuestion && (
      (activeQuestion.id && q.parentId === activeQuestion.id) ||
      (activeQuestion.clientTempId && q.parentId === activeQuestion.clientTempId)
    )
  );
  
  // Autosave and exit protection states
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Searchable phone dropdown prefix states
  const [phoneSearchQuery, setPhoneSearchQuery] = useState<string>("");
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState<{ code: string; flag: string; dialCode: string }>({
    code: "US",
    flag: "🇺🇸",
    dialCode: "+1"
  });
  const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState<boolean>(false);

  // Interactive dropdown preview states
  const [selectedDropdownValue, setSelectedDropdownValue] = useState<string>("");
  const [isDropdownPreviewOpen, setIsDropdownPreviewOpen] = useState<boolean>(false);

  // Interactive slider preview states
  const [previewSliderValue, setPreviewSliderValue] = useState<number>(50);
  const [minInputStr, setMinInputStr] = useState<string>("0");
  const [maxInputStr, setMaxInputStr] = useState<string>("100");

  // Form Preview States
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewStepIndex, setPreviewStepIndex] = useState<number>(0);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});

  // Sync range slider sidebar inputs with dynamic question bounds changes
  useEffect(() => {
    const q = activeQuestion;
    if (q && q.fieldType === "SLIDER") {
      let min = 0;
      let max = 100;
      if (q.placeholder) {
        try {
          const parsed = JSON.parse(q.placeholder);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            min = typeof parsed.min === "number" ? parsed.min : 0;
            max = typeof parsed.max === "number" ? parsed.max : 100;
          }
        } catch (e) {}
      }
      setMinInputStr(min.toString());
      setMaxInputStr(max.toString());
    }
  }, [activeIdx, activeQuestion?.placeholder]);

  // Reset dropdown and slider states on active slide or bounds change
  useEffect(() => {
    setSelectedDropdownValue("");
    setIsDropdownPreviewOpen(false);
    setPhoneSearchQuery("");
    setIsPhoneDropdownOpen(false);

    const q = activeQuestion;
    if (q && q.fieldType === "SLIDER") {
      let min = 0;
      let max = 100;
      if (q.placeholder) {
        try {
          const parsed = JSON.parse(q.placeholder);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            min = typeof parsed.min === "number" ? parsed.min : 0;
            max = typeof parsed.max === "number" ? parsed.max : 100;
          }
        } catch (e) {}
      }
      setPreviewSliderValue(Math.floor((min + max) / 2));
    } else {
      setPreviewSliderValue(50);
    }
  }, [activeIdx, activeQuestion?.placeholder]);

  // Unified validation for preview mode steps
  const validatePreviewStep = (q: any) => {
    if (!q) return true;
    if (["WELCOME", "INFO"].includes(q.fieldType)) return true;

    const val = (previewAnswers[q.labelKey] || "").trim();
    const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (q.isRequired) {
      const parentId = q.id || q.clientTempId;
      const children = questions.filter(item => item.parentId === parentId);

      if (children.length > 0) {
        const unanswered = children.filter(c => !previewAnswers[c.labelKey]?.trim());
        if (unanswered.length > 0) {
          toast.error(`Please fill in all required sub-fields.`);
          return false;
        }
      } else if (["CHECKBOX"].includes(q.fieldType)) {
        const hasAnswer = !!(previewAnswers[q.labelKey] && previewAnswers[q.labelKey].length > 0);
        if (!hasAnswer) {
          toast.error(`Please answer the required question: "${q.label}" before proceeding.`);
          return false;
        }
      } else {
        const hasAnswer = !!previewAnswers[q.labelKey];
        if (!hasAnswer) {
          toast.error(`Please answer the required question: "${q.label}" before proceeding.`);
          return false;
        }
      }
    }

    // Format Validations for populated fields
    if (val) {
      if (q.fieldType === "EMAIL" && !isEmailValid(val)) {
        toast.error("Please enter a valid email address.");
        return false;
      }
      if (q.fieldType === "PHONE" && val.length < 7) {
        toast.error("Please enter a valid phone number (at least 7 digits).");
        return false;
      }
    }

    // Child validations for contact cards and addresses
    const parentId = q.id || q.clientTempId;
    const children = questions.filter(item => item.parentId === parentId);
    for (const child of children) {
      const childVal = (previewAnswers[child.labelKey] || "").trim();
      if (childVal) {
        if (child.fieldType === "EMAIL" && !isEmailValid(childVal)) {
          toast.error(`Please enter a valid email address for "${child.label}".`);
          return false;
        }
        if (child.fieldType === "PHONE" && childVal.length < 7) {
          toast.error(`Please enter a valid phone number (at least 7 digits) for "${child.label}".`);
          return false;
        }
      }
    }

    return true;
  };

  // Keyboard listeners for preview mode navigation & Yes/No controls
  useEffect(() => {
    if (!isPreviewOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const q = topLevelQuestions[previewStepIndex];
      if (!q) return;

      // YES/NO hotkeys
      if (q.fieldType === "YES_NO") {
        if (e.key.toLowerCase() === "y") {
          setPreviewAnswers((prev) => ({ ...prev, [q.labelKey]: "YES" }));
          return;
        }
        if (e.key.toLowerCase() === "n") {
          setPreviewAnswers((prev) => ({ ...prev, [q.labelKey]: "NO" }));
          return;
        }
      }

      // Enter key to advance next (if not textareas focus)
      if (e.key === "Enter" && !(document.activeElement instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        const isFinal = previewStepIndex === topLevelQuestions.length - 1;
        const isThankYou = q.fieldType === "THANK_YOU";
        if (isThankYou) {
          setIsPreviewOpen(false);
          return;
        }

        if (!validatePreviewStep(q)) {
          return;
        }

        setPreviewStepIndex(previewStepIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPreviewOpen, previewStepIndex, previewAnswers, questions, topLevelQuestions]);

  // Dynamic country codes fetched from provided GitHub Gist
  const [countryCodes, setCountryCodes] = useState<{ code: string; name: string; flag: string; dialCode: string }[]>([
    { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
    { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
    { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
    { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
    { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
    { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33" },
    { code: "JP", name: "Japan", flag: "🇯🇵", dialCode: "+81" },
  ]);

  useEffect(() => {
    const fetchCountryCodes = async () => {
      try {
        const res = await fetch("https://gist.githubusercontent.com/anubhavshrimal/75f6183458db8c453306f93521e93d37/raw/");
        if (!res.ok) return;
        const data = await res.json();
        
        const getFlagEmoji = (countryCode: string) => {
          if (!countryCode) return "";
          try {
            const codePoints = countryCode
              .toUpperCase()
              .split("")
              .map((char) => 127397 + char.charCodeAt(0));
            return String.fromCodePoint(...codePoints);
          } catch (e) {
            return "";
          }
        };

        const parsed = data
          .filter((c: any) => c.code && c.name && c.dial_code)
          .map((c: any) => ({
            code: c.code,
            name: c.name,
            flag: getFlagEmoji(c.code) || "🏳️",
            dialCode: c.dial_code.replace(/\s+/g, ""),
          }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));

        if (parsed.length > 0) {
          setCountryCodes(parsed);
        }
      } catch (err) {
        console.error("Failed to fetch country codes from Gist, using fallback presets.", err);
      }
    };
    fetchCountryCodes();
  }, []);
  
  const isDirtyRef = useRef<boolean>(false);
  const questionsRef = useRef<QuestionItem[]>([]);
  
  const getQuestionChoices = (question: QuestionItem): string[] => {
    if (!question.placeholder) {
      return ["Option A", "Option B", "Option C"];
    }
    try {
      const parsed = JSON.parse(question.placeholder);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      if (question.placeholder.includes(",")) {
        return question.placeholder.split(",").map((s) => s.trim());
      }
    }
    return ["Option A", "Option B", "Option C"];
  };

  const handleUpdateChoice = (questionIdx: number, choiceIdx: number, newValue: string) => {
    const q = questions[questionIdx];
    if (!q) return;
    const currentChoices = getQuestionChoices(q);
    const updatedChoices = [...currentChoices];
    updatedChoices[choiceIdx] = newValue;
    updateQuestion(questionIdx, { placeholder: JSON.stringify(updatedChoices) });
  };

  const handleAddChoice = (questionIdx: number) => {
    const q = questions[questionIdx];
    if (!q) return;
    const currentChoices = getQuestionChoices(q);
    const nextLetter = String.fromCharCode(65 + currentChoices.length);
    const updatedChoices = [...currentChoices, `Option ${nextLetter}`];
    updateQuestion(questionIdx, { placeholder: JSON.stringify(updatedChoices) });
  };

  const handleDeleteChoice = (questionIdx: number, choiceIdx: number) => {
    const q = questions[questionIdx];
    if (!q) return;
    const currentChoices = getQuestionChoices(q);
    if (currentChoices.length <= 2) {
      toast.error("You need at least two choice options.");
      return;
    }
    const updatedChoices = currentChoices.filter((_, i) => i !== choiceIdx);
    updateQuestion(questionIdx, { placeholder: JSON.stringify(updatedChoices) });
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

  const handleUpdateSliderBoundaries = (questionIdx: number, min: number, max: number) => {
    updateQuestion(questionIdx, { placeholder: JSON.stringify({ min, max }) });
  };

  // Sync dbFields to local state on initial load
  useEffect(() => {
    if (dbFields) {
      const mapped = dbFields.map((f) => ({
        id: f.id,
        label: f.label || "",
        placeholder: f.placeholder || "",
        description: f.description || "",
        fieldType: f.fieldType as FieldType,
        isRequired: f.isRequired,
        index: f.index,
        labelKey: f.labelKey,
        parentId: f.parentId || null,
      }));
      if (mapped.length === 0) {
        const defaultQuestion: QuestionItem = {
          clientTempId: "temp-long-text-" + Math.random().toString(36).substring(2, 9),
          fieldType: "LONG_TEXT",
          label: "Describe your feedback in detail...",
          placeholder: "Type your long response here...",
          isRequired: false,
          index: 1.0,
          labelKey: "feedback_detail",
          description: "Please share any additional details or feedback.",
          parentId: null,
        };
        setQuestions([defaultQuestion]);
      } else {
        setQuestions(mapped);
      }
      setIsDirty(false);
      isDirtyRef.current = false;
    } else {
      setQuestions([]);
    }
  }, [dbFields]);

  useEffect(() => {
    if (!isFieldsLoading && (!dbFields || dbFields.length === 0) && questions.length === 0) {
      const defaultQuestion: QuestionItem = {
        clientTempId: "temp-long-text-" + Math.random().toString(36).substring(2, 9),
        fieldType: "LONG_TEXT",
        label: "Describe your feedback in detail...",
        placeholder: "Type your long response here...",
        isRequired: false,
        index: 1.0,
        labelKey: "feedback_detail",
        description: "Please share any additional details or feedback.",
        parentId: null,
      };
      setQuestions([defaultQuestion]);
    }
  }, [isFieldsLoading, dbFields, questions.length]);

  // Mirror questions to ref
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    if (currentForm && showPublishPanel) {
      setPublishStatus(currentForm.isPublished);
      setPublishVisibility(currentForm.visibility || "UNLISTED");
      if (currentForm.validTill) {
        const d = new Date(currentForm.validTill);
        const pad = (n: number) => String(n).padStart(2, "0");
        const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setPublishValidTill(dateStr);
      } else {
        setPublishValidTill("");
      }
      setNotificationEmailsInput(currentForm.notificationEmails?.join(", ") || "");
      setAllowedDomains(currentForm.allowedDomains || []);
      setPublishIsPasswordProtected(!!currentForm.isPasswordProtected);
      setPublishPassword(currentForm.isPasswordProtected ? "••••••••" : "");
    }
  }, [currentForm, showPublishPanel]);

  useEffect(() => {
    if (!isUserLoading && !user?.id) {
      router.replace("/sign-in");
    }
  }, [user, isUserLoading, router]);

  // Tab Close / Browser Reload exit warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // Reusable draft-saving helper
  const executeAutosave = async (fieldsToSave: QuestionItem[]) => {
    if (fieldsToSave.length === 0) return;
    // Validate slider boundaries before saving
    const validatedFields = fieldsToSave.map((q) => {
      if (q.fieldType === "SLIDER" && q.placeholder) {
        try {
          const parsed = JSON.parse(q.placeholder);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const min = typeof parsed.min === "number" ? parsed.min : 0;
            const max = typeof parsed.max === "number" ? parsed.max : 100;
            if (min > max) {
              const correctedMin = max - 50;
              toast.error(`Validation error: Min limit was greater than max limit on "${q.label}". Auto-reducing min to ${correctedMin}.`);
              return {
                ...q,
                placeholder: JSON.stringify({ min: correctedMin, max })
              };
            }
          }
        } catch (e) {}
      }
      return q;
    });

    // Update state to match corrected values
    setQuestions(validatedFields);

    const validClientTempIds = validatedFields.map((q) => q.clientTempId).filter(Boolean);
    const validDbIds = validatedFields.map((q) => q.id).filter(Boolean);
    const allowedParentIds = [...validClientTempIds, ...validDbIds];

    const newFields = validatedFields
      .filter((q) => !q.id && q.clientTempId)
      .map((q) => ({
        clientTempId: q.clientTempId as string,
        label: q.label,
        placeholder: q.placeholder,
        description: q.description,
        fieldType: q.fieldType,
        isRequired: q.isRequired,
        index: q.index,
        labelKey: q.labelKey,
        parentId: q.parentId && allowedParentIds.includes(q.parentId) ? q.parentId : null,
      }));

    const putFields = validatedFields
      .filter((q) => q.id)
      .map((q) => ({
        id: q.id as string,
        label: q.label,
        placeholder: q.placeholder,
        description: q.description,
        fieldType: q.fieldType,
        isRequired: q.isRequired,
        index: q.index,
        labelKey: q.labelKey,
        parentId: q.parentId && allowedParentIds.includes(q.parentId) ? q.parentId : null,
      }));

    if (newFields.length > 0) {
      await createFormFieldsAsync({
        formId,
        fields: newFields,
      });
    }

    if (putFields.length > 0) {
      await putFormFieldsAsync({
        formId,
        fields: putFields,
      });
    }

    // Save theme configuration draft as well
    await updateThemeMutation.mutateAsync({
      formId,
      themeId: selectedThemeIdRef.current,
    });
  };

  // Component Unmount hook for background autosave
  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        executeAutosave(questionsRef.current)
          .then(() => {
            toast.success("Form saved as draft!");
          })
          .catch((err) => {
            console.error("Failed to background autosave form as draft on leave", err);
          });
      }
    };
  }, []);

  if (isUserLoading || isFieldsLoading || !user?.id) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center p-4">
        <div className={`${cardClass} w-full max-w-md items-center`}>
          <p className="text-xs font-bold uppercase tracking-widest text-[#666]">
            Loading form editor…
          </p>
        </div>
      </div>
    );
  }

  const handleAddSubQuestion = (parentId: string, currentChildrenCount: number) => {
    const parent = questions.find(q => q.id === parentId || q.clientTempId === parentId);
    if (!parent) return;

    const childTempId = `temp_${Date.now()}`;
    const newChild: QuestionItem = {
      clientTempId: childTempId,
      label: `New Sub Field`,
      placeholder: "",
      description: "",
      fieldType: "SHORT_TEXT",
      isRequired: false,
      index: parent.index + (currentChildrenCount + 1) * 0.01,
      labelKey: `sub_${Math.random().toString(36).substring(2, 6)}`,
      parentId: parentId,
    };

    const updated = [...questions, newChild];
    setQuestions(updated);
    setIsDirty(true);
    isDirtyRef.current = true;
  };

  const addQuestion = (type: FieldType) => {
    const tempId = `temp_${Date.now()}`;
    const nextIndex = questions.length > 0 ? Math.max(...questions.map((q) => q.index)) + 1.0 : 1.0;
    
    const formattedLabel = type === "YES_NO" 
      ? "Yes/No" 
      : type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

    const newQuestion: QuestionItem = {
      clientTempId: tempId,
      label: formattedLabel,
      placeholder: "",
      description: "",
      fieldType: type,
      isRequired: false,
      index: nextIndex,
      labelKey: `${type.toLowerCase()}_${Math.random().toString(36).substring(2, 6)}`,
      parentId: null,
    };

    let extraQuestions: QuestionItem[] = [];
    if (type === "CONTACT_INFO") {
      extraQuestions = [
        {
          clientTempId: `temp_${Date.now()}_name`,
          label: "Full Name",
          placeholder: "John Doe",
          description: "",
          fieldType: "SHORT_TEXT",
          isRequired: false,
          index: nextIndex + 0.01,
          labelKey: `name_${Math.random().toString(36).substring(2, 6)}`,
          parentId: tempId,
        },
        {
          clientTempId: `temp_${Date.now()}_email`,
          label: "Email",
          placeholder: "john@example.com",
          description: "",
          fieldType: "EMAIL",
          isRequired: false,
          index: nextIndex + 0.02,
          labelKey: `email_${Math.random().toString(36).substring(2, 6)}`,
          parentId: tempId,
        },
        {
          clientTempId: `temp_${Date.now()}_phone`,
          label: "Phone",
          placeholder: "(555) 000-0000",
          description: "",
          fieldType: "PHONE",
          isRequired: false,
          index: nextIndex + 0.03,
          labelKey: `phone_${Math.random().toString(36).substring(2, 6)}`,
          parentId: tempId,
        },
        {
          clientTempId: `temp_${Date.now()}_website`,
          label: "Website",
          placeholder: "example.com",
          description: "",
          fieldType: "WEBSITE",
          isRequired: false,
          index: nextIndex + 0.04,
          labelKey: `website_${Math.random().toString(36).substring(2, 6)}`,
          parentId: tempId,
        }
      ];
    } else if (type === "ADDRESS") {
      extraQuestions = [
        {
          clientTempId: `temp_${Date.now()}_street`,
          label: "Street Address",
          placeholder: "123 Main St",
          description: "",
          fieldType: "SHORT_TEXT",
          isRequired: false,
          index: nextIndex + 0.01,
          labelKey: `street_${Math.random().toString(36).substring(2, 6)}`,
          parentId: tempId,
        },
        {
          clientTempId: `temp_${Date.now()}_city`,
          label: "City",
          placeholder: "New York",
          description: "",
          fieldType: "SHORT_TEXT",
          isRequired: false,
          index: nextIndex + 0.02,
          labelKey: `city_${Math.random().toString(36).substring(2, 6)}`,
          parentId: tempId,
        },
        {
          clientTempId: `temp_${Date.now()}_zip`,
          label: "Zip Code",
          placeholder: "10001",
          description: "",
          fieldType: "SHORT_TEXT",
          isRequired: false,
          index: nextIndex + 0.03,
          labelKey: `zip_${Math.random().toString(36).substring(2, 6)}`,
          parentId: tempId,
        }
      ];
    }

    const updated = [...questions, newQuestion, ...extraQuestions];
    setQuestions(updated);
    setActiveIdx(topLevelQuestions.length);
    setIsDirty(true);
    isDirtyRef.current = true;
  };

  const updateQuestion = (index: number, updates: Partial<QuestionItem>) => {
    const updated = [...questions];
    const current = updated[index];
    if (current) {
      updated[index] = { ...current, ...updates } as QuestionItem;
      setQuestions(updated);
      setIsDirty(true);
      isDirtyRef.current = true;
    }
  };

  const deleteQuestion = async (index: number) => {
    const topLevel = questions.filter(q => !q.parentId);
    const q = questions[index];
    if (!q) return;

    if (!q.parentId && topLevel.length <= 1) {
      toast.error("You need at least one question to create a form.");
      return;
    }

    const toDeleteIds = [q.id || q.clientTempId];
    if (!q.parentId) {
      const parentId = q.id || q.clientTempId;
      const children = questions.filter(item => item.parentId === parentId);
      children.forEach(c => toDeleteIds.push(c.id || c.clientTempId));
    }

    for (const id of toDeleteIds) {
      const savedQ = questions.find(item => item.id === id);
      if (savedQ && savedQ.id) {
        try {
          await deleteFormFieldAsync({
            formId,
            fieldId: savedQ.id,
          });
        } catch (err) {
          console.error("Failed to delete question", err);
          return;
        }
      }
    }

    const updated = questions.filter(item => !toDeleteIds.includes(item.id || item.clientTempId));

    let currentTopLevelIndex = 1.0;
    const reIndexed: QuestionItem[] = [];

    const remainingTopLevel = updated.filter(item => !item.parentId);
    remainingTopLevel.forEach((parent) => {
      const parentNewIndex = currentTopLevelIndex;
      currentTopLevelIndex += 1.0;
      const parentId = parent.id || parent.clientTempId;

      reIndexed.push({
        ...parent,
        index: parentNewIndex
      });

      const children = updated.filter(item => item.parentId === parentId);
      children.forEach((child, childIdx) => {
        reIndexed.push({
          ...child,
          index: parentNewIndex + (childIdx + 1) * 0.01
        });
      });
    });

    const oldTopLevel = questions.filter(item => !item.parentId);
    const deletedParentIdx = oldTopLevel.findIndex(item => 
      (q.id && item.id === q.id) || 
      (q.clientTempId && item.clientTempId === q.clientTempId)
    );

    setQuestions(reIndexed);
    setIsDirty(true);
    isDirtyRef.current = true;

    if (reIndexed.length === 0) {
      setActiveIdx(0);
    } else {
      if (q.parentId) {
        const parent = reIndexed.find(item => 
          (q.parentId && item.id === q.parentId) || 
          (q.parentId && item.clientTempId === q.parentId)
        );
        if (parent) {
          const parentIdx = reIndexed.filter(item => !item.parentId).findIndex(item => 
            (parent.id && item.id === parent.id) || 
            (parent.clientTempId && item.clientTempId === parent.clientTempId)
          );
          setActiveIdx(parentIdx !== -1 ? parentIdx : activeIdx);
        }
      } else {
        const targetIdx = Math.max(0, deletedParentIdx - 1);
        setActiveIdx(targetIdx);
      }
    }
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const activeQ = questions[index];
    if (!activeQ || activeQ.parentId) return;

    const topLevel = questions.filter(q => !q.parentId);
    const topLevelIdx = topLevel.findIndex(q => (q.id && q.id === activeQ.id) || (q.clientTempId && q.clientTempId === activeQ.clientTempId));

    if (direction === "up" && topLevelIdx === 0) return;
    if (direction === "down" && topLevelIdx === topLevel.length - 1) return;

    const targetTopLevelIdx = direction === "up" ? topLevelIdx - 1 : topLevelIdx + 1;

    const newTopLevel = [...topLevel];
    const temp = newTopLevel[topLevelIdx];
    const targetVal = newTopLevel[targetTopLevelIdx];
    if (temp && targetVal) {
      newTopLevel[topLevelIdx] = targetVal;
      newTopLevel[targetTopLevelIdx] = temp;
    }

    let currentTopLevelIndex = 1.0;
    const reIndexed: QuestionItem[] = [];

    newTopLevel.forEach((parent) => {
      const parentNewIndex = currentTopLevelIndex;
      currentTopLevelIndex += 1.0;
      const parentId = parent.id || parent.clientTempId;

      reIndexed.push({
        ...parent,
        index: parentNewIndex
      });

      const children = questions.filter(item => item.parentId === parentId);
      children.forEach((child, childIdx) => {
        reIndexed.push({
          ...child,
          index: parentNewIndex + (childIdx + 1) * 0.01
        });
      });
    });

    setQuestions(reIndexed);
    setIsDirty(true);
    isDirtyRef.current = true;

    const targetParent = newTopLevel[targetTopLevelIdx];
    if (targetParent) {
      const targetParentId = targetParent.id || targetParent.clientTempId;
      const newTopLevelIdx = reIndexed.filter(q => !q.parentId).findIndex(q => q.id === targetParentId || q.clientTempId === targetParentId);
      setActiveIdx(newTopLevelIdx !== -1 ? newTopLevelIdx : 0);
    }
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await executeAutosave(questions);
      await updateThemeMutation.mutateAsync({ formId, themeId: selectedThemeId });
      setSaveStatus("saved");
      setIsDirty(false);
      isDirtyRef.current = false;
      await refetchFields();
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err: any) {
      console.error(err);
      setSaveErrorMessage(err?.message || "Failed to save questions. Ensure Label Keys are unique.");
      setSaveStatus("error");
    }
  };

  const handleBackToDashboard = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDirty) {
      const saveToastId = toast.loading("Saving form as draft...");
      try {
        await executeAutosave(questions);
        setIsDirty(false);
        isDirtyRef.current = false;
        toast.success("Form saved as draft!", { id: saveToastId });
        router.push("/dashboard");
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to autosave. Please save changes manually.", { id: saveToastId });
      }
    } else {
      router.push("/dashboard");
    }
  };

  const handleTogglePublish = async () => {
    if (publishIsPasswordProtected && !publishPassword.trim()) {
      toast.error("Please enter a password when password protection is enabled.");
      return;
    }
    try {
      const nextPublishState = !publishStatus;
      const parsedEmails = notificationEmailsInput
        .split(",")
        .map(e => e.trim())
        .filter(Boolean);

      const finalPassword = (publishPassword === "••••••••" || !publishPassword) ? undefined : publishPassword;

      await publishFormAsync({
        formId,
        isPublished: nextPublishState,
        visibility: publishVisibility,
        validTill: publishValidTill ? new Date(publishValidTill) : null,
        notificationEmails: parsedEmails,
        allowedDomains,
        isPasswordProtected: publishIsPasswordProtected,
        password: finalPassword,
      });
      setPublishStatus(nextPublishState);
      if (nextPublishState) {
        toast.success("Form published!");
      } else {
        toast.success("Form unpublished.");
      }
    } catch (err) {
      console.error("Failed to toggle publish status", err);
      toast.error("Failed to update publish state.");
    }
  };

  const handleSaveSettings = async () => {
    if (publishIsPasswordProtected && !publishPassword.trim()) {
      toast.error("Please enter a password when password protection is enabled.");
      return;
    }
    const saveToastId = toast.loading("Saving publish settings...");
    try {
      const parsedEmails = notificationEmailsInput
        .split(",")
        .map(e => e.trim())
        .filter(Boolean);

      const finalPassword = (publishPassword === "••••••••" || !publishPassword) ? undefined : publishPassword;

      await publishFormAsync({
        formId,
        isPublished: publishStatus,
        visibility: publishVisibility,
        validTill: publishValidTill ? new Date(publishValidTill) : null,
        notificationEmails: parsedEmails,
        allowedDomains,
        isPasswordProtected: publishIsPasswordProtected,
        password: finalPassword,
      });
      toast.success("Publish settings saved!", { id: saveToastId });
    } catch (err) {
      console.error("Failed to save settings", err);
      toast.error("Failed to save settings.", { id: saveToastId });
    }
  };

  const shareUrl = currentForm?.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${currentForm.slug}`
    : "";

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const handleTitleSubmit = async () => {
    setIsEditingTitle(false);
    if (!editedTitleVal.trim() || editedTitleVal.trim() === currentForm?.title) return;
    const saveToastId = toast.loading("Updating form name...");
    try {
      // Autosave handles standard dynamic title metadata pushing or general updates
      await executeAutosave(questions);
      toast.success("Form renamed successfully!", { id: saveToastId });
    } catch (err) {
      toast.error("Failed to rename form.", { id: saveToastId });
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden paper-texture text-[#111]">
      {activeThemeCss && (
        <style dangerouslySetInnerHTML={{ __html: activeThemeCss }} />
      )}
      <div className="w-full h-full flex flex-col">
        
        {/* Navigation Bar - completely custom styled, no borders, ambient elevation */}
        <EditHeader {...{ activeTab, setActiveTab, handleBackToDashboard, isEditingTitle, editedTitleVal, setEditedTitleVal, handleTitleSubmit, setIsEditingTitle, currentForm, activeThemeCss, selectedThemeId, handleThemeChange, themes, saveStatus, isSaving, saveForm: handleSave, isPublishing, publishStatus, publishFormAsync, handleDownloadCSV, mounted, showProfileMenu, setShowProfileMenu, handleLogout, setShowPublishPanel, user, setIsPreviewOpen, setPreviewStepIndex, setPreviewAnswers, questions, analytics, formId }} />

        {/* Publish / Share Panel Modal */}
        {showPublishPanel && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowPublishPanel(false)}
          >
            <div
              className="bg-white/80 border border-black/10 w-full max-w-md flex flex-col gap-0 shadow-2xl text-[#111] rounded-none overflow-hidden animate-fade-in"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-b border-black/10 px-6 py-4 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-[#111]">
                  <ExternalLink className="w-4 h-4 text-primary animate-pulse" /> Publish & Share
                </h2>
                <button
                  type="button"
                  onClick={() => setShowPublishPanel(false)}
                  className="text-[#666] hover:text-[#111] text-xs font-bold uppercase tracking-widest cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-6 px-6 py-6 overflow-y-auto max-h-[75vh]">
                {/* Publish toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-[#111]">{publishStatus ? "Published" : "Unpublished"}</p>
                    <p className="text-[10px] text-[#666] uppercase tracking-wider mt-0.5">
                      {publishStatus ? "Your form is live and accepting responses." : "Your form is a draft — not visible to the public."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePublish}
                    disabled={isPublishing}
                    className={`${publishStatus ? buttonPrimaryClass : buttonSecondaryClass + " bg-white/80 border-black/10 hover:bg-black/5 text-[#111]"} h-9 px-4 text-xs flex items-center gap-1.5`}
                  >
                    {isPublishing ? "Updating…" : publishStatus ? "Unpublish" : "Publish Now"}
                  </button>
                </div>

                {/* Visibility */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#666]">Visibility</label>
                  <select
                    disabled={publishStatus}
                    value={publishVisibility}
                    onChange={(e) => setPublishVisibility(e.target.value as any)}
                    className={`${inputClass} text-xs ${publishStatus ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="UNLISTED">UNLISTED</option>
                    <option value="PRIVATE">PRIVATE</option>
                  </select>
                  <p className="text-[9px] text-[#666] uppercase tracking-wider">
                    {publishVisibility === "PUBLIC" && "Anyone can find and fill this form."}
                    {publishVisibility === "UNLISTED" && "Only people with the link can access."}
                    {publishVisibility === "PRIVATE" && "Form is hidden from all respondents."}
                  </p>
                </div>

                {/* Expiration */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#666]">Expiration Date (optional)</label>
                  <input
                    type="datetime-local"
                    disabled={publishStatus}
                    value={publishValidTill}
                    onClick={(e) => !publishStatus && e.currentTarget.showPicker?.()}
                    onChange={e => {
                      const selectedDate = e.target.value;
                      if (selectedDate && new Date(selectedDate) < new Date()) {
                        toast.error("You cannot choose an expiration date/time in the past.");
                        return;
                      }
                      setPublishValidTill(selectedDate);
                    }}
                    className={`${inputClass} text-xs ${publishStatus ? "opacity-40 cursor-not-allowed" : ""}`}
                  />
                  {publishValidTill && !publishStatus && (
                    <button type="button" onClick={() => setPublishValidTill("")} className="text-[9px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider text-left cursor-pointer bg-transparent border-none">
                      ✕ Clear expiration
                    </button>
                  )}
                </div>

                {/* Expiration Digests Extra Recipients */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#666]">Digest Notification Emails (optional)</label>
                  <input
                    type="text"
                    disabled={publishStatus}
                    placeholder="extra1@example.com, extra2@example.com"
                    value={notificationEmailsInput}
                    onChange={e => setNotificationEmailsInput(e.target.value)}
                    className={`${inputClass} text-xs ${publishStatus ? "opacity-40 cursor-not-allowed" : ""}`}
                  />
                  <p className="text-[9px] text-[#666] uppercase tracking-wider">
                    Separate multiple emails with commas. They will receive the compiled digest after the form expires.
                  </p>
                </div>

                {/* Password Protection */}
                {publishVisibility !== "PRIVATE" && (
                  <div className="flex flex-col gap-3 border-t border-black/10 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#666]">
                          Password Protection
                        </label>
                        <p className="text-[9px] text-[#666] uppercase tracking-wider mt-0.5">
                          Require respondents to enter a password to access the form.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        disabled={publishStatus}
                        checked={publishIsPasswordProtected}
                        onChange={(e) => setPublishIsPasswordProtected(e.target.checked)}
                        className={`w-4 h-4 accent-[#2563EB] cursor-pointer ${publishStatus ? "opacity-40 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    {publishIsPasswordProtected && (
                      <div className="flex flex-col gap-1.5">
                        <input
                          type="password"
                          disabled={publishStatus}
                          placeholder="Enter access password"
                          value={publishPassword}
                          onChange={(e) => setPublishPassword(e.target.value)}
                          className={`${inputClass} text-xs ${publishStatus ? "opacity-40 cursor-not-allowed" : ""}`}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Whitelisted Domains for PRIVATE forms */}
                {publishVisibility === "PRIVATE" && (
                  <div className="flex flex-col gap-3 border-t border-black/10 pt-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#666]">
                      Allowed Email Domains
                    </label>
                    <p className="text-[9px] text-[#666] uppercase tracking-wider -mt-1">
                      Only users logged in with email addresses belonging to these domains will be allowed to view and fill this form.
                    </p>
                    
                    {/* Domain list tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {allowedDomains.length === 0 ? (
                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wide">
                          No domains whitelisted. Add at least one!
                        </span>
                      ) : (
                        allowedDomains.map((dom) => (
                          <div
                            key={dom}
                            className="flex items-center gap-1.5 bg-[#2563EB]/15 border border-[#2563EB]/30 text-[#111] text-[10px] font-bold px-2.5 py-1 rounded"
                          >
                            <span>{dom}</span>
                            <button
                              type="button"
                              disabled={publishStatus}
                              onClick={() => setAllowedDomains(prev => prev.filter(d => d !== dom))}
                              className={`text-[#2563EB] hover:text-[#111] transition-colors font-bold border-none bg-transparent cursor-pointer ${publishStatus ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Domain Input Box */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled={publishStatus}
                        placeholder="e.g. company.com"
                        value={newDomainInput}
                        onChange={(e) => setNewDomainInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = newDomainInput.trim().toLowerCase();
                            if (val && !allowedDomains.includes(val)) {
                              setAllowedDomains([...allowedDomains, val]);
                              setNewDomainInput("");
                            }
                          }
                        }}
                        className={`${inputClass} text-xs flex-1 ${publishStatus ? "opacity-40 cursor-not-allowed" : ""}`}
                      />
                      <button
                        type="button"
                        disabled={publishStatus}
                        onClick={() => {
                          const val = newDomainInput.trim().toLowerCase();
                          if (val && !allowedDomains.includes(val)) {
                            setAllowedDomains([...allowedDomains, val]);
                            setNewDomainInput("");
                          }
                        }}
                        className={`px-3.5 bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-[#111] font-bold text-xs uppercase tracking-widest rounded transition-all cursor-pointer ${publishStatus ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Save Settings Button */}
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={publishStatus || isPublishing}
                  className={`${buttonSecondaryClass} bg-white/80 border-black/10 hover:bg-black/5 text-[#111] w-full h-10 text-xs ${publishStatus ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {publishStatus ? "Form is Live (Unpublish to Edit Settings)" : "Save Settings"}
                </button>

                {/* Share link (only if published) */}
                {publishStatus && shareUrl && (
                  <div className="border-t border-black/10 pt-4 flex flex-col gap-3">
                    {/* Tab switcher */}
                    <div className="flex border border-black/10 rounded overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShareTab("link")}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                          shareTab === "link"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-black/5 bg-white/80 text-[#111]"
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" /> Link
                      </button>
                      <button
                        type="button"
                        onClick={() => setShareTab("qr")}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                          shareTab === "qr"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-black/5 bg-white/80 text-[#111]"
                        }`}
                      >
                        <QrCode className="w-3 h-3" /> QR Code
                      </button>
                    </div>

                    {shareTab === "link" && (
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={shareUrl}
                          className={`${inputClass} text-xs flex-1 select-all`}
                          onFocus={e => e.target.select()}
                        />
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className={`${buttonPrimaryClass} h-10 px-3 text-xs flex items-center gap-1.5 shrink-0`}
                        >
                          {linkCopied ? "Copied!" : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                        </button>
                        <a
                          href={`/share/${currentForm?.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${buttonSecondaryClass} h-10 px-3 text-xs flex items-center gap-1.5 shrink-0`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open
                        </a>
                      </div>
                    )}

                    {shareTab === "qr" && (
                      <div className="flex flex-col items-center gap-3 py-2">
                        <div className="border border-black/10 p-4 bg-white rounded">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`}
                            alt="QR Code"
                            width={160}
                            height={160}
                            className="block"
                          />
                        </div>
                        <p className="text-[9px] text-[#666] uppercase tracking-widest text-center">Scan to open the form</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" ? (
          <AnalyticsPanel formId={formId} questions={questions} analytics={analytics} />
        ) : (
          <div className="flex-1 flex overflow-hidden w-full">
          
          {/* Left Column: Slides Map */}
          <SlidesSidebar
            topLevelQuestions={topLevelQuestions}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            setShowAddContent={setShowAddContent}
          />

          {/* Center Column: Live Slide Editor Preview */}
          <LivePreview {...{ activeQuestion, activeIdx, topLevelQuestions, getQuestionChoices, previewSliderValue, setPreviewSliderValue, isDropdownPreviewOpen, setIsDropdownPreviewOpen, selectedDropdownValue, setSelectedDropdownValue, activeAbsoluteIdx, isDirty, updateQuestion, getSliderBoundaries, activeChildren, questions, saveStatus, saveErrorMessage, showAddContent, setShowAddContent, deleteQuestion, handleAddSubQuestion, setQuestions, setIsDirty, isDirtyRef, countryCodes, isPhoneDropdownOpen, setIsPhoneDropdownOpen, selectedPhoneCountry, setSelectedPhoneCountry, phoneSearchQuery, setPhoneSearchQuery }} />
          {/* Right Column: Slide Settings */}
          <SettingsSidebar
            activeQuestion={activeQuestion}
            activeAbsoluteIdx={activeAbsoluteIdx}
            updateQuestion={updateQuestion}
            deleteQuestion={deleteQuestion}
            moveSlide={moveQuestion}
          />
        </div>
        )}

        {/* Floating Add Content Modal Dialog */}
        {showAddContent && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
            onClick={() => setShowAddContent(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`${cardClass} w-full max-w-3xl gap-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between border-b-2 border-neutral-900  pb-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Add Content Slide</h2>
                  <p className="text-xs text-[#666] uppercase mt-0.5 tracking-wider">
                    Select a dynamic conversational layout to insert as a step
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddContent(false)}
                  className="text-xs font-bold uppercase tracking-widest hover:text-[#666] cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Grouped and Structured Categories for All 19 Types */}
              <div className="flex flex-col gap-6">
                
                {/* 1. Text & Contacts Category */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-700  border-b border-neutral-200  pb-1 mb-3">
                    Text & Contact Info
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { type: "SHORT_TEXT", label: "Short Text", desc: "Names, keywords, small single lines.", icon: Type },
                      { type: "LONG_TEXT", label: "Long Text", desc: "Multi-line descriptive responses.", icon: AlignLeft },
                      { type: "EMAIL", label: "Email Address", desc: "Valid Electronic email forms.", icon: Mail },
                      { type: "WEBSITE", label: "Website URL", desc: "Prependable external hyperlink.", icon: GlobeIcon },
                      { type: "PHONE", label: "Phone Number", desc: "Telephone contact coordinates.", icon: PhoneIcon },
                      { type: "CONTACT_INFO", label: "Contact Card", desc: "Grouped Name, Email & Phone block.", icon: UserIcon },
                      { type: "ADDRESS", label: "Postal Address", desc: "Grouped Street, City & Zip card.", icon: MapPinIcon },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          addQuestion(item.type as FieldType);
                          setShowAddContent(false);
                        }}
                        className="text-left border-2 border-neutral-300  hover:border-neutral-900  p-3 transition-all hover:bg-neutral-50  flex flex-col gap-1 cursor-pointer group rounded-none bg-transparent"
                      >
                        <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wide">
                          <item.icon className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                          {item.label}
                        </div>
                        <p className="text-[9px] text-[#666] uppercase tracking-wide leading-relaxed truncate">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Choice & Options Category */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-700  border-b border-neutral-200  pb-1 mb-3">
                    Choices & Selections
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { type: "YES_NO", label: "Yes / No", desc: "Binary true/false choice.", icon: ToggleLeft },
                      { type: "MULTIPLE_CHOICE", label: "Multi Choice", desc: "Pick single from options.", icon: ListIcon },
                      { type: "CHECKBOX", label: "Checkboxes", desc: "Choose many from catalog.", icon: CheckSquare },
                      { type: "DROPDOWN", label: "Dropdown", desc: "Compact selectable list.", icon: ChevronDown },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          addQuestion(item.type as FieldType);
                          setShowAddContent(false);
                        }}
                        className="text-left border-2 border-neutral-300  hover:border-neutral-900  p-3 transition-all hover:bg-neutral-50  flex flex-col gap-1 cursor-pointer group rounded-none bg-transparent"
                      >
                        <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wide">
                          <item.icon className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                          {item.label}
                        </div>
                        <p className="text-[9px] text-[#666] uppercase tracking-wide leading-relaxed truncate">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Scales & Calendar Category */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-700  border-b border-neutral-200  pb-1 mb-3">
                    Scales & Dates
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { type: "NUMBER", label: "Number", desc: "Digits & numerical answers only.", icon: Hash },
                      { type: "RATING", label: "Rating Stars", desc: "Score reviews using stars.", icon: Star },
                      { type: "SLIDER", label: "Range Slider", desc: "Drag range scale metrics.", icon: Sliders },
                      { type: "DATE", label: "Date Picker", desc: "Choose calendar date nodes.", icon: Calendar },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          addQuestion(item.type as FieldType);
                          setShowAddContent(false);
                        }}
                        className="text-left border-2 border-neutral-300  hover:border-neutral-900  p-3 transition-all hover:bg-neutral-50  flex flex-col gap-1 cursor-pointer group rounded-none bg-transparent"
                      >
                        <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wide">
                          <item.icon className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                          {item.label}
                        </div>
                        <p className="text-[9px] text-[#666] uppercase tracking-wide leading-relaxed truncate">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Media Ingestion Category */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-700  border-b border-neutral-200  pb-1 mb-3">
                    Media & File Ingestion
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { type: "IMAGE", label: "Image Attachment", desc: "Upload PNG, JPG pictures.", icon: ImageIcon },
                      { type: "VIDEO", label: "Video Upload", desc: "Ingest mp4, webm media.", icon: VideoIcon },
                      { type: "AUDIO", label: "Audio Record", desc: "Ingest sound tracks/mp3.", icon: AudioIcon },
                      { type: "FILE", label: "General File", desc: "Submit PDF documents or CSV.", icon: FileIcon },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          addQuestion(item.type as FieldType);
                          setShowAddContent(false);
                        }}
                        className="text-left border-2 border-neutral-300  hover:border-neutral-900  p-3 transition-all hover:bg-neutral-50  flex flex-col gap-1 cursor-pointer group rounded-none bg-transparent"
                      >
                        <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wide">
                          <item.icon className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                          {item.label}
                        </div>
                        <p className="text-[9px] text-[#666] uppercase tracking-wide leading-relaxed truncate">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Informational & Layout Steps Category (Non-input fields) */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-700  border-b border-neutral-200  pb-1 mb-3">
                    Informational Steps (No Input)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { type: "WELCOME", label: "Welcome Slide", desc: "Introductory greeting slide.", icon: Sparkles },
                      { type: "INFO", label: "Info Slide", desc: "Show text message description step.", icon: AlignLeft },
                      { type: "THANK_YOU", label: "Thank You Screen", desc: "Completion exit screen slide.", icon: Star },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          addQuestion(item.type as FieldType);
                          setShowAddContent(false);
                        }}
                        className="text-left border-2 border-neutral-300  hover:border-neutral-900  p-3 transition-all hover:bg-neutral-50  flex flex-col gap-1 cursor-pointer group rounded-none bg-transparent"
                      >
                        <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wide">
                          <item.icon className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                          {item.label}
                        </div>
                        <p className="text-[9px] text-[#666] uppercase tracking-wide leading-relaxed truncate">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Form Preview Modal */}
        {isPreviewOpen && (
          <div className="preview-container fixed inset-0 z-50 bg-neutral-950 text-[#111] flex flex-col justify-between p-6 md:p-12 animate-fade-in overflow-y-auto">
            {/* Progress bar */}
            <div className="fixed top-0 left-0 right-0 h-0.5 bg-neutral-800 z-50">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${((previewStepIndex + 1) / topLevelQuestions.length) * 100}%` }}
              />
            </div>

            {/* Step counter */}
            <div className="fixed top-4 right-6 z-50">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                {previewStepIndex + 1} / {topLevelQuestions.length}
              </span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-neutral-800 pb-4 mb-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-primary text-black">
                  Preview Mode
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 ml-3">
                  {currentForm?.title || "Conversational Form"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="flex items-center gap-1 text-xs font-black uppercase tracking-widest hover:text-[#111] transition-colors cursor-pointer bg-transparent border-none text-neutral-400"
              >
                Exit Preview <Plus className="w-4 h-4 rotate-45 shrink-0" />
              </button>
            </div>

            {/* Active Preview Question Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              {(() => {
                const q = topLevelQuestions[previewStepIndex];
                if (!q) return null;
                const isThankYou = q.fieldType === "THANK_YOU";

                return (
                  <div className="w-full max-w-2xl flex flex-col gap-8 animate-fade-in px-4 md:px-8">
                    {/* Header Step Progress (unless it's THANK_YOU) */}
                    {!isThankYou && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                        Step {previewStepIndex + 1} of {topLevelQuestions.length}
                      </span>
                    )}

                    {/* Question Header */}
                    {isThankYou ? (
                      <div className="flex flex-col items-center justify-center text-center py-8 w-full animate-fade-in">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-widest text-[#111]">
                          Thank You!
                        </h1>
                        {q.description && (
                          <p className="text-neutral-450 text-base leading-relaxed mt-4 max-w-lg">
                            {q.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#111] leading-tight relative">
                          {q.label}
                          {q.isRequired && (
                            <span className="absolute -top-1 -right-3 text-red-400 font-extrabold text-2xl select-none">*</span>
                          )}
                        </h2>
                        {q.description && (
                          <p className="text-neutral-500 text-sm leading-relaxed max-w-xl">
                            {q.description}
                          </p>
                        )}
                      </div>
                    )}

                        <DynamicFieldCard
                          question={q}
                          mode="test"
                          value={previewAnswers[q.labelKey]}
                          onChange={(val) => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: val })}
                          getQuestionChoices={(q) => {
                            if (!q.placeholder) return ["Option A", "Option B", "Option C"];
                            try {
                              const parsed = JSON.parse(q.placeholder);
                              if (Array.isArray(parsed)) return parsed;
                            } catch (e) {
                              if (q.placeholder.includes(",")) return q.placeholder.split(",").map((s) => s.trim());
                            }
                            return ["Option A", "Option B", "Option C"];
                          }}
                          getSliderBoundaries={(q) => {
                            if (!q.placeholder) return { min: 0, max: 100 };
                            try {
                              const parsed = JSON.parse(q.placeholder);
                              if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                                return {
                                  min: typeof parsed.min === "number" ? parsed.min : 0,
                                  max: typeof parsed.max === "number" ? parsed.max : 100,
                                };
                              }
                            } catch (e) {}
                            return { min: 0, max: 100 };
                          }}
                          childrenFields={questions.filter(item => item.parentId === (q.id || q.clientTempId))}
                        />
                  </div>
                );
              })()}
            </div>

            {/* Footer Navigation bar */}
            <div className="border-t-2 border-neutral-800 pt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPreviewStepIndex(Math.max(0, previewStepIndex - 1))}
                disabled={previewStepIndex === 0}
                className="flex items-center gap-2 text-neutral-500 hover:text-[#111] transition-colors text-xs font-black uppercase tracking-widest bg-transparent border-none cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              
              {(() => {
                const q = topLevelQuestions[previewStepIndex];
                if (!q) return null;
                const isFinal = previewStepIndex === topLevelQuestions.length - 1;
                const isThankYou = q.fieldType === "THANK_YOU";

                if (isThankYou) {
                  return (
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(false)}
                      className="flex items-center gap-2 bg-primary text-black font-black uppercase tracking-widest text-sm px-6 py-3 hover:bg-primary/80 transition-colors cursor-pointer"
                    >
                      Close Preview
                    </button>
                  );
                }

                const handleNext = () => {
                  if (!validatePreviewStep(q)) {
                    return;
                  }

                  setPreviewStepIndex(previewStepIndex + 1);
                };

                return (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-primary text-black font-black uppercase tracking-widest text-sm px-6 py-3 hover:bg-primary/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isFinal ? <><Check className="w-4 h-4" /> Submit</> : <>Next <ArrowRight className="w-4 h-4" /></>}
                  </button>
                );
              })()}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
