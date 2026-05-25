"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Save, Eye, EyeOff, CheckSquare,
  Sparkles, Type, AlignLeft, Hash, Mail, Calendar, ToggleLeft, Star,
  Image as ImageIcon, Video as VideoIcon, Mic as AudioIcon, FileText as FileIcon,
  List as ListIcon, ChevronDown, Sliders, User as UserIcon, MapPin as MapPinIcon,
  Phone as PhoneIcon, Globe as GlobeIcon, Link as LinkIcon, Copy, ExternalLink, QrCode, ArrowRight, Check
} from "lucide-react";
import { useUser } from "~/hooks/api/auth/useUser";
import { useGetFormFields } from "~/hooks/api/forms/useGetFormFields";
import { useCreateFormFields } from "~/hooks/api/forms/useCreateFormFields";
import { usePutFormFields } from "~/hooks/api/forms/usePutFormFields";
import { useDeleteFormField } from "~/hooks/api/forms/useDeleteFormField";
import { usePublishForm } from "~/hooks/api/forms/usePublishForm";
import { useUserForms } from "~/hooks/api/forms/useUserForms";
import { toast } from "sonner";

type FieldType =
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

interface QuestionItem {
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

const inputClass =
  "flex h-10 w-full rounded-none border-2 border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-neutral-900 dark:focus-visible:border-neutral-100 disabled:cursor-not-allowed disabled:opacity-50";

const buttonPrimaryClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-widest bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 h-11 px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

const buttonSecondaryClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-widest border-2 border-neutral-900 dark:border-neutral-100 bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 h-11 px-4 py-2 transition-colors cursor-pointer";

const cardClass =
  "border-2 border-neutral-900 dark:border-neutral-100 bg-background p-6 flex flex-col gap-4";

export default function EditFormPage(props: { params: Promise<{ formId: string }> }) {
  const params = use(props.params);
  const formId = params.formId;
  const router = useRouter();
  
  const { user, isLoading: isUserLoading } = useUser();
  const { forms } = useUserForms();
  
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

  // Publish/Share panel states
  const [showPublishPanel, setShowPublishPanel] = useState<boolean>(false);
  const [publishVisibility, setPublishVisibility] = useState<"PUBLIC" | "PRIVATE" | "UNLISTED">("UNLISTED");
  const [publishValidTill, setPublishValidTill] = useState<string>("");
  const [shareTab, setShareTab] = useState<"link" | "qr">("link");
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

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
  
  const currentForm = forms?.find((f) => f.id === formId);

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
      setQuestions(mapped);
      setIsDirty(false);
      isDirtyRef.current = false;
    } else {
      setQuestions([]);
    }
  }, [dbFields]);

  // Mirror questions to ref
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    if (currentForm) {
      setPublishStatus(currentForm.isPublished);
    }
  }, [currentForm]);

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
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
        const firstParent = reIndexed.find(item => !item.parentId);
        if (firstParent) {
          const firstParentIdx = reIndexed.filter(item => !item.parentId).findIndex(item => 
            (firstParent.id && item.id === firstParent.id) || 
            (firstParent.clientTempId && item.clientTempId === firstParent.clientTempId)
          );
          setActiveIdx(firstParentIdx !== -1 ? firstParentIdx : 0);
        } else {
          setActiveIdx(0);
        }
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
    try {
      const nextPublishState = !publishStatus;
      await publishFormAsync({
        formId,
        isPublished: nextPublishState,
        visibility: publishVisibility,
        validTill: publishValidTill ? new Date(publishValidTill) : null,
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

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 py-8">
      <div className="w-full max-w-none flex flex-col gap-6 px-4 lg:px-8">
        
        {/* Navigation Bar */}
        <nav className="w-full border-2 border-neutral-900 dark:border-neutral-100 bg-background px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-xs font-black tracking-widest uppercase hover:text-muted-foreground transition-colors cursor-pointer bg-transparent border-none text-neutral-900 dark:text-neutral-100"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-4">
              {currentForm?.title || "Conversational Form Builder"}
            </span>
            <button
              type="button"
              onClick={() => {
                if (questions.length === 0) {
                  toast.error("Add at least one slide to preview the form.");
                  return;
                }
                setIsPreviewOpen(true);
                setPreviewStepIndex(0);
                setPreviewAnswers({});
              }}
              className={`${buttonSecondaryClass} h-9 px-4 text-xs flex items-center gap-1.5`}
            >
              <Eye className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" /> Preview
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`${buttonPrimaryClass} h-9 px-4 text-xs flex items-center gap-1.5`}
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setShowPublishPanel(true)}
              className={`${publishStatus ? buttonPrimaryClass : buttonSecondaryClass} h-9 px-4 text-xs flex items-center gap-1.5`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {publishStatus ? "Published" : "Publish"}
            </button>
          </div>
        </nav>

        {/* Publish / Share Panel Modal */}
        {showPublishPanel && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setShowPublishPanel(false)}
          >
            <div
              className="bg-background border-2 border-neutral-900 dark:border-neutral-100 w-full max-w-md flex flex-col gap-0 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-b-2 border-neutral-900 dark:border-neutral-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-amber-500" /> Publish & Share
                </h2>
                <button onClick={() => setShowPublishPanel(false)} className="text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest cursor-pointer bg-transparent border-none">✕</button>
              </div>

              <div className="flex flex-col gap-6 px-6 py-6">
                {/* Publish toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest">{publishStatus ? "Published" : "Unpublished"}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                      {publishStatus ? "Your form is live and accepting responses." : "Your form is a draft — not visible to the public."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePublish}
                    disabled={isPublishing}
                    className={`${publishStatus ? buttonPrimaryClass : buttonSecondaryClass} h-9 px-4 text-xs flex items-center gap-1.5`}
                  >
                    {isPublishing ? "Updating…" : publishStatus ? "Unpublish" : "Publish Now"}
                  </button>
                </div>

                {/* Visibility */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Visibility</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["PUBLIC", "UNLISTED", "PRIVATE"] as const).map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setPublishVisibility(v)}
                        className={`border-2 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${publishVisibility === v ? "border-neutral-900 dark:border-neutral-100 bg-neutral-900 text-white dark:bg-white dark:text-black" : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-600"}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                    {publishVisibility === "PUBLIC" && "Anyone can find and fill this form."}
                    {publishVisibility === "UNLISTED" && "Only people with the link can access."}
                    {publishVisibility === "PRIVATE" && "Form is hidden from all respondents."}
                  </p>
                </div>

                {/* Expiration */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expiration Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={publishValidTill}
                    onChange={e => setPublishValidTill(e.target.value)}
                    className={`${inputClass} text-xs`}
                  />
                  {publishValidTill && (
                    <button type="button" onClick={() => setPublishValidTill("")} className="text-[9px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider text-left cursor-pointer bg-transparent border-none">
                      ✕ Clear expiration
                    </button>
                  )}
                </div>

                {/* Share link (only if published) */}
                {publishStatus && shareUrl && (
                  <div className="border-t-2 border-neutral-200 dark:border-neutral-800 pt-4 flex flex-col gap-3">
                    {/* Tab switcher */}
                    <div className="flex border-2 border-neutral-200 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setShareTab("link")}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 ${shareTab === "link" ? "bg-neutral-900 text-white dark:bg-white dark:text-black" : "hover:bg-neutral-100 dark:hover:bg-neutral-900"}`}
                      >
                        <LinkIcon className="w-3 h-3" /> Link
                      </button>
                      <button
                        type="button"
                        onClick={() => setShareTab("qr")}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 ${shareTab === "qr" ? "bg-neutral-900 text-white dark:bg-white dark:text-black" : "hover:bg-neutral-100 dark:hover:bg-neutral-900"}`}
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
                        <div className="border-2 border-neutral-200 dark:border-neutral-800 p-4 bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`}
                            alt="QR Code"
                            width={160}
                            height={160}
                            className="block"
                          />
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest text-center">Scan to open the form</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Builder Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Slides Map */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className={cardClass}>
              <div className="border-b-2 border-neutral-900 dark:border-neutral-100 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Slides
                </h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-muted-foreground">
                  {topLevelQuestions.length} Step{topLevelQuestions.length !== 1 ? 's' : ''}
                </span>
              </div>

              {topLevelQuestions.length === 0 ? (
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-center py-4">
                  No slides
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                  {topLevelQuestions.map((q, idx) => (
                    <button
                      key={q.id || q.clientTempId}
                      onClick={() => setActiveIdx(idx)}
                      className={`w-full text-left border-2 p-2 flex items-center gap-2 transition-all rounded-none group cursor-pointer ${
                        activeIdx === idx 
                          ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-black" 
                          : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-950"
                      }`}
                    >
                      <div className={`w-5 h-5 shrink-0 flex items-center justify-center font-extrabold text-[10px] rounded-none group-hover:scale-110 transition-transform ${
                        activeIdx === idx 
                          ? "bg-white text-black dark:bg-black dark:text-white" 
                          : "bg-neutral-900 text-white dark:bg-white dark:text-black"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-tight truncate">
                          {q.label || `Untitled`}
                        </p>
                        <p className={`text-[8px] font-semibold uppercase tracking-widest mt-0.5 ${
                          activeIdx === idx ? "text-neutral-300 dark:text-neutral-700" : "text-muted-foreground"
                        }`}>
                          {q.fieldType.replace("_", " ")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center Column: Live Slide Editor Preview */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-2 border-neutral-900 dark:border-neutral-100 bg-background px-6 py-4">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Conversational Canvas</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddContent(true)}
                className={`${buttonPrimaryClass} h-10 px-5 text-xs flex items-center gap-2`}
              >
                <Plus className="w-4 h-4" /> Add Content
              </button>
            </div>

            {saveStatus === "saved" && (
              <div className="bg-emerald-100 dark:bg-emerald-950/20 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-400 p-3 text-xs font-bold uppercase tracking-wider text-center">
                Changes saved successfully as draft!
              </div>
            )}

            {saveStatus === "error" && (
              <div className="bg-red-100 dark:bg-red-950/20 border-2 border-red-500 text-red-800 dark:text-red-400 p-3 text-xs font-bold uppercase tracking-wider text-center">
                {saveErrorMessage}
              </div>
            )}

            {/* Conversational Live Slide Preview */}
            {topLevelQuestions.length === 0 ? (
              <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 py-20 px-6 flex flex-col items-center justify-center gap-4 text-center bg-neutral-50/20 dark:bg-neutral-950/20">
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                  Your form is empty
                </p>
                <p className="text-xs text-muted-foreground max-w-sm uppercase tracking-wider -mt-2">
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
                <div className={cardClass}>
                  {/* Slide Header */}
                  <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-neutral-100 pb-4 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-neutral-900 text-white dark:bg-white dark:text-black">
                      Slide {activeIdx + 1} of {topLevelQuestions.length}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />}
                      {activeQuestion.fieldType.replace("_", " ")}
                    </span>
                  </div>

                  {/* Typeform Live Slide Preview Canvas */}
                  <div className="flex flex-col gap-6 py-20 px-10 bg-neutral-50 dark:bg-neutral-950/40 border-2 border-dashed border-neutral-300 dark:border-neutral-700 min-h-[48vh] justify-center">
                    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
                      
                      {/* Live editable question title & description */}
                      {activeQuestion.fieldType === "THANK_YOU" ? (
                        <div className="flex flex-col items-center justify-center text-center py-8 w-full animate-fade-in">
                          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                            Thank You!
                          </h1>
                          {activeQuestion.description && (
                            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap mt-4 max-w-lg">
                              {activeQuestion.description}
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Live editable question title */}
                          <div className="flex flex-col gap-1 items-start w-full">
                            <label className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest flex items-center gap-1">
                              Edit Question Label <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            </label>
                            <div className="relative inline-block w-full max-w-full">
                              {/* Invisible mirror span to measure text width & height for wrapping */}
                              <span className="invisible whitespace-pre-wrap break-words text-2xl md:text-3xl font-black uppercase tracking-tight px-1 select-none pointer-events-none block min-h-[3rem] pb-2 w-full">
                                {activeQuestion.label || "Enter question title..."}
                              </span>
                              <textarea
                                value={activeQuestion.label}
                                onChange={(e) => updateQuestion(activeAbsoluteIdx, { label: e.target.value })}
                                className="absolute inset-0 text-2xl md:text-3xl font-black bg-transparent border-b-2 border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-neutral-950 dark:focus:border-neutral-100 transition-colors w-full focus-visible:outline-none py-1 leading-tight uppercase tracking-tight text-neutral-900 dark:text-neutral-100 pr-8 resize-none overflow-hidden"
                                placeholder="Enter question title..."
                              />
                              {activeQuestion.isRequired && (
                                <span className="absolute -top-1 -right-2.5 text-red-500 font-extrabold text-2xl select-none" title="Required Field">
                                  *
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Live question description preview */}
                          {activeQuestion.description && (
                            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 font-bold border-l-2 border-amber-500 pl-3 -mt-2 max-w-2xl animate-fade-in whitespace-pre-wrap leading-relaxed">
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
                              className="text-lg bg-transparent border-b-2 border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-neutral-100 py-3 w-full focus-visible:outline-none transition-colors"
                              disabled
                            />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                              Press Enter ↵
                            </span>
                          </div>
                        )}

                        {/* 2. LONG_TEXT */}
                        {activeQuestion.fieldType === "LONG_TEXT" && (
                          <div className="flex flex-col gap-2">
                            <textarea
                              placeholder={activeQuestion.placeholder || "Type your long paragraph answer here..."}
                              className="text-lg bg-transparent border-b-2 border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-neutral-100 py-3 w-full focus-visible:outline-none transition-colors min-h-24 resize-none"
                              disabled
                            />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                              Shift + Enter for new line
                            </span>
                          </div>
                        )}

                        {/* 3. NUMBER */}
                        {activeQuestion.fieldType === "NUMBER" && (
                          <div className="flex flex-col gap-2">
                            <input
                              type="number"
                              placeholder={activeQuestion.placeholder || "Enter a number..."}
                              className="text-lg bg-transparent border-b-2 border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-neutral-100 py-3 w-full focus-visible:outline-none transition-colors"
                              disabled
                            />
                          </div>
                        )}

                        {/* 4. EMAIL */}
                        {activeQuestion.fieldType === "EMAIL" && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 border-b-2 border-neutral-300 dark:border-neutral-700 py-3">
                              <Mail className="w-5 h-5 text-muted-foreground" />
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
                            <div className="flex items-center gap-2 border-b-2 border-neutral-300 dark:border-neutral-700 py-3">
                              <Calendar className="w-5 h-5 text-muted-foreground" />
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
                              className="border-2 border-neutral-900 dark:border-neutral-100 px-6 py-3 font-bold uppercase tracking-widest hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors flex items-center gap-3 text-sm cursor-default bg-background"
                            >
                              <span className="bg-neutral-950 text-white dark:bg-white dark:text-black w-5 h-5 text-[10px] flex items-center justify-center font-extrabold">Y</span> Yes
                            </button>
                            <button
                              type="button"
                              className="border-2 border-neutral-900 dark:border-neutral-100 px-6 py-3 font-bold uppercase tracking-widest hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors flex items-center gap-3 text-sm cursor-default bg-background"
                            >
                              <span className="bg-neutral-950 text-white dark:bg-white dark:text-black w-5 h-5 text-[10px] flex items-center justify-center font-extrabold">N</span> No
                            </button>
                          </div>
                        )}

                        {/* 7. RATING */}
                        {activeQuestion.fieldType === "RATING" && (
                          <div className="flex gap-2 items-center mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className="w-8 h-8 text-neutral-300 dark:text-neutral-700 cursor-default"
                              />
                            ))}
                          </div>
                        )}

                        {/* 8. WEBSITE */}
                        {activeQuestion.fieldType === "WEBSITE" && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 border-b-2 border-neutral-300 dark:border-neutral-700 py-3">
                              <GlobeIcon className="w-5 h-5 text-muted-foreground" />
                              <span className="text-lg font-bold text-muted-foreground">https://</span>
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
                            <div className="flex items-center gap-2 border-b-2 border-neutral-300 dark:border-neutral-700 py-3 relative">
                              <PhoneIcon className="w-5 h-5 text-muted-foreground animate-pulse" />
                              
                              {/* Custom Searchable Country Popover Trigger */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setIsPhoneDropdownOpen(!isPhoneDropdownOpen)}
                                  className="text-xs font-black px-2.5 py-1.5 border-2 border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 tracking-widest bg-background rounded-none flex items-center gap-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer min-w-[95px] justify-between uppercase transition-colors"
                                >
                                  <span>{selectedPhoneCountry.flag} {selectedPhoneCountry.code}</span>
                                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold">{selectedPhoneCountry.dialCode}</span>
                                </button>

                                {/* Search Popover Menu */}
                                {isPhoneDropdownOpen && (
                                  <div 
                                    className="absolute top-full left-0 mt-1.5 z-30 w-64 border-2 border-neutral-900 dark:border-neutral-100 bg-background shadow-2xl p-2.5 flex flex-col gap-2 animate-fade-in max-h-64"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="text"
                                      autoFocus
                                      value={phoneSearchQuery}
                                      onChange={(e) => setPhoneSearchQuery(e.target.value)}
                                      placeholder="Type country name or code..."
                                      className="w-full text-xs border-2 border-neutral-900 dark:border-neutral-100 px-2 py-1.5 focus-visible:outline-none rounded-none bg-background text-neutral-900 dark:text-neutral-100 font-bold"
                                    />
                                    
                                    <div className="flex flex-col gap-0.5 overflow-y-auto max-h-40 pr-1 border-t border-neutral-200 dark:border-neutral-800 pt-1.5">
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
                                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-black flex items-center justify-between transition-colors rounded-none cursor-pointer bg-background border-none text-neutral-900 dark:text-neutral-100"
                                          >
                                            <span className="font-bold uppercase tracking-tight truncate max-w-[130px]">
                                              {c.flag} {c.name}
                                            </span>
                                            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-black">
                                              ({c.code}) {c.dialCode}
                                            </span>
                                          </button>
                                        ))
                                      }
                                      
                                      {countryCodes.filter((c) => 
                                        c.name.toLowerCase().includes(phoneSearchQuery.toLowerCase()) || 
                                        c.code.toLowerCase().includes(phoneSearchQuery.toLowerCase()) || 
                                        c.dialCode.includes(phoneSearchQuery)
                                      ).length === 0 && (
                                        <p className="text-[10px] text-center text-muted-foreground uppercase py-4 font-bold tracking-wider">No results</p>
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
                            {getQuestionChoices(activeQuestion).map((opt, oIdx) => (
                              <div
                                key={opt + "_" + oIdx}
                                className="border-2 border-neutral-900 dark:border-neutral-100 p-3 font-bold uppercase tracking-wide flex items-center gap-3 text-xs bg-background max-w-md animate-fade-in"
                              >
                                <span className="bg-neutral-950 text-white dark:bg-white dark:text-black w-5 h-5 text-[9px] flex items-center justify-center font-black shrink-0">
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
                            {getQuestionChoices(activeQuestion).map((opt, oIdx) => (
                              <div
                                key={opt + "_" + oIdx}
                                className="border-2 border-neutral-200 dark:border-neutral-800 p-3 font-bold uppercase tracking-wide flex items-center gap-3 text-xs bg-background max-w-md animate-fade-in"
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
                              className="w-full flex items-center justify-between border-2 border-neutral-900 dark:border-neutral-100 p-3 text-xs font-black uppercase tracking-widest bg-background hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer rounded-none text-left text-neutral-900 dark:text-neutral-100"
                            >
                              <span>
                                {selectedDropdownValue || "Select an option..."}
                              </span>
                              <ChevronDown className="w-4 h-4 text-neutral-900 dark:text-neutral-100 shrink-0" />
                            </button>

                            {/* Dropdown Options Popover Menu */}
                            {isDropdownPreviewOpen && (
                              <div 
                                className="absolute top-full left-0 mt-1 z-20 w-full border-2 border-neutral-900 dark:border-neutral-100 bg-background shadow-2xl p-1 flex flex-col gap-0.5 max-h-48 overflow-y-auto animate-fade-in"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {getQuestionChoices(activeQuestion).map((opt, oIdx) => (
                                  <button
                                    key={opt + "_" + oIdx}
                                    type="button"
                                    onClick={() => {
                                      setSelectedDropdownValue(opt);
                                      setIsDropdownPreviewOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-black transition-colors rounded-none cursor-pointer bg-background border-none text-neutral-900 dark:text-neutral-100"
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
                              <div className="relative w-full h-4 border-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-900 select-none">
                                {/* Filled progress bar */}
                                <div 
                                  className="absolute left-0 top-0 bottom-0 bg-amber-500 dark:bg-amber-400 border-r-2 border-neutral-900 dark:border-neutral-100" 
                                  style={{ width: `${percent}%` }}
                                />
                                {/* Custom Rotated Diamond Thumb */}
                                <div 
                                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 border-2 border-neutral-900 dark:border-neutral-100 bg-neutral-900 dark:bg-neutral-100 rotate-45 shadow-md flex items-center justify-center pointer-events-none"
                                  style={{ left: `calc(${percent}% - 12px)` }}
                                >
                                  {/* Tiny inner dot/diamond */}
                                  <div className="w-1.5 h-1.5 bg-background dark:bg-neutral-900 rotate-45" />
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
                              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                                <span className="border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 bg-neutral-50 dark:bg-neutral-950">
                                  {min} (Min)
                                </span>
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-extrabold bg-neutral-900 text-white dark:bg-white dark:text-black px-2.5 py-0.5 rounded-none border border-neutral-900 dark:border-white">
                                  Value: {previewSliderValue}
                                </span>
                                <span className="border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 bg-neutral-50 dark:bg-neutral-950">
                                  {max} (Max)
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 14. CONTACT_INFO & 15. ADDRESS (Dynamic nested sub-questions layout configuration) */}
                        {(activeQuestion.fieldType === "CONTACT_INFO" || activeQuestion.fieldType === "ADDRESS") && (
                          <div className="flex flex-col gap-6 w-full">
                            <div className="flex flex-col gap-4 border-2 border-neutral-900 dark:border-neutral-100 p-5 bg-background">
                              <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border-b pb-2 mb-2">
                                Sub Fields Configuration
                              </h4>
                              {activeChildren.length === 0 ? (
                                <p className="text-[10px] text-muted-foreground uppercase text-center py-4 font-bold">No sub fields defined.</p>
                              ) : (
                                <div className="flex flex-col gap-4">
                                  {activeChildren.map((child) => {
                                    const childAbsIdx = questions.findIndex(item => 
                                      (child.id && item.id === child.id) || 
                                      (child.clientTempId && item.clientTempId === child.clientTempId)
                                    );
                                    return (
                                      <div key={child.id || child.clientTempId} className="border-2 border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-3 relative bg-neutral-50/50 dark:bg-neutral-900/30 text-neutral-900 dark:text-neutral-100">
                                        <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-2">
                                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                            {child.fieldType === "EMAIL" && <Mail className="w-3.5 h-3.5 text-amber-500" />}
                                            {child.fieldType === "PHONE" && <PhoneIcon className="w-3.5 h-3.5 text-amber-500" />}
                                            {child.fieldType === "SHORT_TEXT" && <Type className="w-3.5 h-3.5 text-amber-500" />}
                                            {child.fieldType === "WEBSITE" && <GlobeIcon className="w-3.5 h-3.5 text-amber-500" />}
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
                                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Field Label</label>
                                            <input
                                              type="text"
                                              value={child.label}
                                              onChange={(e) => updateQuestion(childAbsIdx, { label: e.target.value })}
                                              className={`${inputClass} h-8 text-xs py-1`}
                                              placeholder="e.g. Full Name"
                                            />
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Placeholder text</label>
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
                                  <Plus className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Add Text Sub-Field
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
                                  <Plus className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Add Email Sub-Field
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
                                  <Plus className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Add Phone Sub-Field
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
                                  <Plus className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Add Website Sub-Field
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 16. IMAGE */}
                        {activeQuestion.fieldType === "IMAGE" && (
                          <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-8 flex flex-col items-center justify-center gap-2 bg-neutral-100/50 dark:bg-neutral-900/20 max-w-md">
                            <ImageIcon className="w-8 h-8 text-neutral-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-neutral-100">Upload Image File</span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Drag and drop or browse files</span>
                          </div>
                        )}

                        {/* 17. VIDEO */}
                        {activeQuestion.fieldType === "VIDEO" && (
                          <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-8 flex flex-col items-center justify-center gap-2 bg-neutral-100/50 dark:bg-neutral-900/20 max-w-md">
                            <VideoIcon className="w-8 h-8 text-neutral-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-neutral-100">Upload Video Attachment</span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Supports MP4, WebM up to 50MB</span>
                          </div>
                        )}

                        {/* 18. AUDIO */}
                        {activeQuestion.fieldType === "AUDIO" && (
                          <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-8 flex flex-col items-center justify-center gap-2 bg-neutral-100/50 dark:bg-neutral-900/20 max-w-md">
                            <AudioIcon className="w-8 h-8 text-neutral-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-neutral-100">Upload Sound / Audio</span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Supports MP3, WAV files</span>
                          </div>
                        )}

                        {/* 19. FILE */}
                        {activeQuestion.fieldType === "FILE" && (
                          <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-8 flex flex-col items-center justify-center gap-2 bg-neutral-100/50 dark:bg-neutral-900/20 max-w-md">
                            <FileIcon className="w-8 h-8 text-neutral-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-neutral-100">Upload Document attachment</span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Supports PDF, CSV, DOCX files</span>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Right Column: Slide Settings */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {activeQuestion && (
              <div className={cardClass}>
                <div className="border-b-2 border-neutral-900 dark:border-neutral-100 pb-3">
                  <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" /> Slide Settings
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Required Answer Toggle */}
                  <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-2 border-neutral-200 dark:border-neutral-800 p-3 hover:border-neutral-900 dark:hover:border-neutral-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={activeQuestion.isRequired}
                      onChange={(e) => updateQuestion(activeAbsoluteIdx, { isRequired: e.target.checked })}
                      className="w-4 h-4 border-2 border-neutral-900 rounded-none bg-background accent-neutral-900 cursor-pointer"
                    />
                    Required Field
                  </label>

                  {/* Custom Placeholder/Option Editor Fields */}
                  {["MULTIPLE_CHOICE", "CHECKBOX", "DROPDOWN"].includes(activeQuestion.fieldType) ? (
                    <div className="flex flex-col gap-3 border-2 border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/20 dark:bg-neutral-950/20">
                      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-1.5 flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <ListIcon className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Configure Options
                        </label>
                        <span className="text-[9px] font-bold text-muted-foreground bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5">
                          {getQuestionChoices(activeQuestion).length} Item{getQuestionChoices(activeQuestion).length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-1">
                        {getQuestionChoices(activeQuestion).map((choice, cIdx) => (
                          <div key={cIdx} className="flex gap-2 items-center">
                            <span className="bg-neutral-900 text-white dark:bg-white dark:text-black w-6 h-6 text-[10px] flex items-center justify-center font-black shrink-0">
                              {String.fromCharCode(65 + cIdx)}
                            </span>
                            <input
                              value={choice}
                              onChange={(e) => handleUpdateChoice(activeAbsoluteIdx, cIdx, e.target.value)}
                              onBlur={(e) => {
                                if (e.target.value.trim() === "") {
                                  handleUpdateChoice(activeAbsoluteIdx, cIdx, `Option ${String.fromCharCode(65 + cIdx)}`);
                                }
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + cIdx)}`}
                              className={`${inputClass} h-8 text-xs py-1`}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteChoice(activeAbsoluteIdx, cIdx)}
                              className="text-red-500 hover:text-red-700 shrink-0 p-1 cursor-pointer hover:scale-110 transition-transform bg-transparent border-none"
                              title="Remove Option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddChoice(activeAbsoluteIdx)}
                        className={`${buttonSecondaryClass} h-8 text-[10px] tracking-wider py-1 font-extrabold flex items-center justify-center gap-1.5`}
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" /> Add Option
                      </button>
                    </div>
                  ) : activeQuestion.fieldType === "SLIDER" ? (
                    <div className="flex flex-col gap-3 border-2 border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/20 dark:bg-neutral-950/20">
                      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Range Limits
                        </label>
                      </div>
                      
                      {(() => {
                        return (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
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
                                        handleUpdateSliderBoundaries(activeAbsoluteIdx, newMin, isNaN(currentMax) ? 100 : currentMax);
                                      }
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  const parsedMin = Number(minInputStr);
                                  const { max } = getSliderBoundaries(activeQuestion);
                                  if (isNaN(parsedMin)) {
                                    setMinInputStr("0");
                                    handleUpdateSliderBoundaries(activeAbsoluteIdx, 0, max);
                                  } else if (parsedMin >= max) {
                                    toast.error("Minimum limit cannot be greater than or equal to maximum limit.");
                                    const safeMin = max - 10;
                                    setMinInputStr(safeMin.toString());
                                    handleUpdateSliderBoundaries(activeAbsoluteIdx, safeMin, max);
                                  }
                                }}
                                className={`${inputClass} h-8 text-xs py-1`}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
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
                                      if (!isNaN(currentMin) && currentMin >= newMax) {
                                        toast.error("Minimum limit cannot be greater than or equal to maximum limit.");
                                      } else {
                                        handleUpdateSliderBoundaries(activeAbsoluteIdx, isNaN(currentMin) ? 0 : currentMin, newMax);
                                      }
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  const parsedMax = Number(maxInputStr);
                                  const { min } = getSliderBoundaries(activeQuestion);
                                  if (isNaN(parsedMax)) {
                                    setMaxInputStr("100");
                                    handleUpdateSliderBoundaries(activeAbsoluteIdx, min, 100);
                                  } else if (min >= parsedMax) {
                                    toast.error("Minimum limit cannot be greater than or equal to maximum limit.");
                                    const safeMax = min + 10;
                                    setMaxInputStr(safeMax.toString());
                                    handleUpdateSliderBoundaries(activeAbsoluteIdx, min, safeMax);
                                  }
                                }}
                                className={`${inputClass} h-8 text-xs py-1`}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : ["WELCOME", "THANK_YOU", "INFO"].includes(activeQuestion.fieldType) ? null : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Placeholder Subtext
                      </label>
                      <input
                        value={activeQuestion.placeholder}
                        onChange={(e) => updateQuestion(activeAbsoluteIdx, { placeholder: e.target.value })}
                        placeholder="e.g. Type your response..."
                        className={inputClass}
                      />
                    </div>
                  )}

                  {/* Custom Description Field */}
                  <div className="flex flex-col gap-1.5 border-t border-neutral-200 dark:border-neutral-800 pt-3">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Question Description
                    </label>
                    <textarea
                      value={activeQuestion.description || ""}
                      onChange={(e) => updateQuestion(activeAbsoluteIdx, { description: e.target.value })}
                      placeholder="e.g. Provide optional context, guidelines or details..."
                      className={`${inputClass} min-h-[5rem] text-xs resize-none`}
                    />
                  </div>

                  {/* Move & Delete controls */}
                  <div className="flex gap-2 border-t border-neutral-200 dark:border-neutral-800 pt-3">
                    <button
                      type="button"
                      onClick={() => moveQuestion(activeAbsoluteIdx, "up")}
                      disabled={activeIdx === 0}
                      className={`${buttonSecondaryClass} flex-1 h-9 text-[10px] gap-1 px-1`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" /> Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(activeAbsoluteIdx, "down")}
                      disabled={activeIdx === topLevelQuestions.length - 1}
                      className={`${buttonSecondaryClass} flex-1 h-9 text-[10px] gap-1 px-1`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" /> Down
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQuestion(activeAbsoluteIdx)}
                      className={`${buttonSecondaryClass} border-red-600 dark:border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white flex-1 h-9 text-[10px] gap-1 px-1`}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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
              <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Add Content Slide</h2>
                  <p className="text-xs text-muted-foreground uppercase mt-0.5 tracking-wider">
                    Select a dynamic conversational layout to insert as a step
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddContent(false)}
                  className="text-xs font-bold uppercase tracking-widest hover:text-muted-foreground cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Grouped and Structured Categories for All 19 Types */}
              <div className="flex flex-col gap-6">
                
                {/* 1. Text & Contacts Category */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 border-b border-neutral-200 dark:border-neutral-800 pb-1 mb-3">
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
                        className="text-left border-2 border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 p-3 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-950 flex flex-col gap-1 cursor-pointer group rounded-none bg-background"
                      >
                        <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wide">
                          <item.icon className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
                          {item.label}
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-relaxed truncate">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Choice & Options Category */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 border-b border-neutral-200 dark:border-neutral-800 pb-1 mb-3">
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
                        className="text-left border-2 border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 p-3 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-950 flex flex-col gap-1 cursor-pointer group rounded-none bg-background"
                      >
                        <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wide">
                          <item.icon className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
                          {item.label}
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-relaxed truncate">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Scales & Calendar Category */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 border-b border-neutral-200 dark:border-neutral-800 pb-1 mb-3">
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
                        className="text-left border-2 border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 p-3 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-950 flex flex-col gap-1 cursor-pointer group rounded-none bg-background"
                      >
                        <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wide">
                          <item.icon className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
                          {item.label}
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-relaxed truncate">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Media Ingestion Category */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 border-b border-neutral-200 dark:border-neutral-800 pb-1 mb-3">
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
                        className="text-left border-2 border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 p-3 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-950 flex flex-col gap-1 cursor-pointer group rounded-none bg-background"
                      >
                        <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wide">
                          <item.icon className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
                          {item.label}
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-relaxed truncate">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Informational & Layout Steps Category (Non-input fields) */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 border-b border-neutral-200 dark:border-neutral-800 pb-1 mb-3">
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
                        className="text-left border-2 border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 p-3 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-950 flex flex-col gap-1 cursor-pointer group rounded-none bg-background"
                      >
                        <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wide">
                          <item.icon className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
                          {item.label}
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-relaxed truncate">
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
          <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col justify-between p-6 md:p-12 animate-fade-in overflow-y-auto">
            {/* Progress bar */}
            <div className="fixed top-0 left-0 right-0 h-0.5 bg-neutral-800 z-50">
              <div
                className="h-full bg-amber-400 transition-all duration-500 ease-out"
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
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-amber-400 text-black">
                  Preview Mode
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 ml-3">
                  {currentForm?.title || "Conversational Form"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="flex items-center gap-1 text-xs font-black uppercase tracking-widest hover:text-white transition-colors cursor-pointer bg-transparent border-none text-neutral-400"
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
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                        Step {previewStepIndex + 1} of {topLevelQuestions.length}
                      </span>
                    )}

                    {/* Question Header */}
                    {isThankYou ? (
                      <div className="flex flex-col items-center justify-center text-center py-8 w-full animate-fade-in">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-widest text-white">
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
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight relative">
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

                        {/* 1. SHORT_TEXT */}
                        {q.fieldType === "SHORT_TEXT" && (
                          <input
                            type="text"
                            placeholder={q.placeholder || "Type your answer..."}
                            value={previewAnswers[q.labelKey] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: e.target.value })}
                            className="bg-transparent border-b-2 border-neutral-700 focus:border-amber-400 text-white text-xl py-3 w-full focus-visible:outline-none transition-colors placeholder:text-neutral-600"
                          />
                        )}

                        {/* 2. LONG_TEXT */}
                        {q.fieldType === "LONG_TEXT" && (
                          <textarea
                            placeholder={q.placeholder || "Type your response..."}
                            value={previewAnswers[q.labelKey] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: e.target.value })}
                            rows={4}
                            className="bg-transparent border-b-2 border-neutral-700 focus:border-amber-400 text-white text-lg py-3 w-full focus-visible:outline-none transition-colors placeholder:text-neutral-600 resize-none"
                          />
                        )}

                        {/* 3. NUMBER */}
                        {q.fieldType === "NUMBER" && (
                          <input
                            type="number"
                            placeholder={q.placeholder || "Type a number..."}
                            value={previewAnswers[q.labelKey] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: e.target.value })}
                            className="bg-transparent border-b-2 border-neutral-700 focus:border-amber-400 text-white text-xl py-3 w-full focus-visible:outline-none transition-colors placeholder:text-neutral-600"
                          />
                        )}

                        {/* 4. EMAIL */}
                        {q.fieldType === "EMAIL" && (
                          <div className="flex items-center gap-3 border-b-2 border-neutral-700 focus-within:border-amber-400 transition-colors py-3">
                            <Mail className="w-5 h-5 text-neutral-500 shrink-0" />
                            <input
                              type="email"
                              placeholder={q.placeholder || "email@example.com"}
                              value={previewAnswers[q.labelKey] || ""}
                              onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: e.target.value })}
                              className="bg-transparent text-white text-xl w-full focus-visible:outline-none placeholder:text-neutral-600"
                            />
                          </div>
                        )}

                        {/* 5. WEBSITE */}
                        {q.fieldType === "WEBSITE" && (
                          <div className="flex items-center gap-2 border-b-2 border-neutral-700 focus-within:border-amber-400 transition-colors py-3">
                            <GlobeIcon className="w-5 h-5 text-neutral-500 shrink-0" />
                            <span className="text-neutral-500 text-lg font-bold">https://</span>
                            <input
                              type="text"
                              placeholder={q.placeholder || "example.com"}
                              value={previewAnswers[q.labelKey] || ""}
                              onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: e.target.value })}
                              className="bg-transparent text-white text-xl w-full focus-visible:outline-none placeholder:text-neutral-600"
                            />
                          </div>
                        )}

                        {/* 6. PHONE */}
                        {q.fieldType === "PHONE" && (() => {
                          const country = previewAnswers[`${q.labelKey}_country`] || selectedPhoneCountry;
                          const isDropdownOpen = previewAnswers[`${q.labelKey}_drop_open`] || false;
                          const searchStr = previewAnswers[`${q.labelKey}_search`] || "";
                          const filtered = countryCodes.filter(c => 
                            c.name.toLowerCase().includes(searchStr.toLowerCase()) || 
                            c.dialCode.includes(searchStr)
                          );

                          return (
                            <div className="flex items-center gap-3 border-b-2 border-neutral-700 focus-within:border-amber-400 transition-colors py-3 relative w-full">
                              <PhoneIcon className="w-5 h-5 text-neutral-500 shrink-0" />
                              <div className="relative shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setPreviewAnswers({ ...previewAnswers, [`${q.labelKey}_drop_open`]: !isDropdownOpen }); }}
                                  className="flex items-center gap-1.5 border border-neutral-700 px-2 py-1 text-white text-xs font-black uppercase tracking-wider hover:border-amber-400 transition-colors"
                                >
                                  {country.flag} {country.code}
                                  <span className="text-neutral-500">{country.dialCode}</span>
                                </button>
                                {isDropdownOpen && (
                                  <div
                                    className="absolute top-full left-0 mt-1 z-30 w-64 bg-neutral-900 border border-neutral-700 shadow-2xl p-2 flex flex-col gap-2 max-h-64 overflow-hidden"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <input
                                      autoFocus
                                      placeholder="Search country..."
                                      value={searchStr}
                                      onChange={(e) => setPreviewAnswers({ ...previewAnswers, [`${q.labelKey}_search`]: e.target.value })}
                                      className="bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-xs text-white focus-visible:outline-none rounded-none w-full"
                                    />
                                    <div className="flex flex-col gap-0.5 overflow-y-auto max-h-40">
                                      {filtered.slice(0, 40).map((c, cIdx) => (
                                        <button
                                          key={c.code + "_" + cIdx}
                                          type="button"
                                          onClick={() => {
                                            setPreviewAnswers({
                                              ...previewAnswers,
                                              [`${q.labelKey}_country`]: c,
                                              [`${q.labelKey}_drop_open`]: false,
                                              [`${q.labelKey}_search`]: ""
                                            });
                                          }}
                                          className="w-full text-left px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700 flex items-center justify-between border-none bg-background cursor-pointer"
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
                                type="tel"
                                placeholder={q.placeholder || "(555) 000-0000"}
                                value={previewAnswers[q.labelKey] || ""}
                                onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: e.target.value.replace(/[^0-9]/g, "") })}
                                className="bg-transparent text-white text-xl w-full focus-visible:outline-none placeholder:text-neutral-600"
                              />
                            </div>
                          );
                        })()}

                        {/* 7. DATE */}
                        {q.fieldType === "DATE" && (
                          <input
                            type="date"
                            value={previewAnswers[q.labelKey] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: e.target.value })}
                            onClick={(e) => e.currentTarget.showPicker?.()}
                            className="bg-neutral-900 border-2 border-neutral-700 focus:border-amber-400 text-white text-lg py-3 px-4 w-full focus-visible:outline-none transition-colors"
                          />
                        )}

                        {/* 8. RATING */}
                        {q.fieldType === "RATING" && (
                          <div className="flex gap-3 flex-wrap mt-2">
                            {[1, 2, 3, 4, 5].map((val) => {
                              const activeRating = previewAnswers[q.labelKey] || 0;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: val })}
                                  className="p-1 cursor-pointer transition-transform hover:scale-125 border-none bg-transparent"
                                >
                                  <Star
                                    className={`w-10 h-10 transition-colors ${
                                      val <= activeRating
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-neutral-600"
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* 9. YES_NO */}
                        {q.fieldType === "YES_NO" && (
                          <div className="flex gap-4 flex-wrap mt-2">
                            {["YES", "NO"].map((choice) => {
                              const selectedVal = previewAnswers[q.labelKey];
                              const isSelected = selectedVal === choice;
                              return (
                                <button
                                  key={choice}
                                  type="button"
                                  onClick={() => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: choice })}
                                  className={`flex items-center gap-3 border-2 px-6 py-4 font-black uppercase tracking-widest text-sm transition-colors cursor-pointer ${
                                    isSelected
                                      ? "border-amber-400 bg-amber-400/10 text-amber-400"
                                      : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                                  }`}
                                >
                                  <span className={`w-6 h-6 flex items-center justify-center font-extrabold text-xs border ${
                                    isSelected ? "bg-amber-400 text-black border-amber-400" : "border-neutral-600 text-neutral-400"
                                  }`}>
                                    {choice[0]}
                                  </span>
                                  {choice}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* 10. MULTIPLE_CHOICE */}
                        {q.fieldType === "MULTIPLE_CHOICE" && (
                          <div className="flex flex-col gap-3 mt-2">
                            {getQuestionChoices(q).map((opt, oIdx) => {
                              const selectedVal = previewAnswers[q.labelKey];
                              const isSelected = selectedVal === opt;
                              return (
                                <button
                                  key={opt + "_" + oIdx}
                                  type="button"
                                  onClick={() => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: opt })}
                                  className={`flex items-center gap-4 border-2 px-5 py-4 text-sm font-bold uppercase tracking-wider transition-colors text-left cursor-pointer ${
                                    isSelected
                                      ? "border-amber-400 bg-amber-400/10 text-amber-400"
                                      : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                                  }`}
                                >
                                  <span className={`w-6 h-6 flex items-center justify-center text-[10px] font-black shrink-0 border ${
                                    isSelected ? "bg-amber-400 text-black border-amber-400" : "border-neutral-600 text-neutral-400"
                                  }`}>
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* 11. CHECKBOX */}
                        {q.fieldType === "CHECKBOX" && (
                          <div className="flex flex-col gap-3 mt-2">
                            {getQuestionChoices(q).map((opt, oIdx) => {
                              const selectedList: string[] = previewAnswers[q.labelKey] || [];
                              const isSelected = selectedList.includes(opt);
                              return (
                                <button
                                  key={opt + "_" + oIdx}
                                  type="button"
                                  onClick={() => {
                                    const next = isSelected 
                                      ? selectedList.filter(item => item !== opt) 
                                      : [...selectedList, opt];
                                    setPreviewAnswers({ ...previewAnswers, [q.labelKey]: next });
                                  }}
                                  className={`flex items-center gap-4 border-2 px-5 py-4 text-sm font-bold uppercase tracking-wider transition-colors text-left cursor-pointer ${
                                    isSelected
                                      ? "border-amber-400 bg-amber-400/10 text-amber-400"
                                      : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                                  }`}
                                >
                                  <span className={`w-5 h-5 flex items-center justify-center shrink-0 border-2 transition-colors ${
                                    isSelected ? "bg-amber-400 border-amber-400" : "border-neutral-600"
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3 text-black" />}
                                  </span>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* 12. DROPDOWN */}
                        {q.fieldType === "DROPDOWN" && (() => {
                          const val = previewAnswers[q.labelKey] || "";
                          const isOpen = previewAnswers[`${q.labelKey}_drop_open`] || false;

                          return (
                            <div className="relative max-w-md mt-2 w-full">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setPreviewAnswers({ ...previewAnswers, [`${q.labelKey}_drop_open`]: !isOpen }); }}
                                className="w-full flex items-center justify-between border-2 border-neutral-700 hover:border-amber-400 px-4 py-3 text-sm font-black uppercase tracking-wider text-left transition-colors bg-neutral-900"
                              >
                                <span className={val ? "text-white" : "text-neutral-500"}>
                                  {val || "Select an option..."}
                                </span>
                                <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                              </button>

                              {isOpen && (
                                <div className="absolute top-full left-0 mt-1 z-20 w-full bg-neutral-900 border border-neutral-700 shadow-2xl max-h-48 overflow-y-auto animate-fade-in">
                                  {getQuestionChoices(q).map((opt, oIdx) => (
                                    <button
                                      key={opt + "_" + oIdx}
                                      type="button"
                                      onClick={() => {
                                        setPreviewAnswers({
                                          ...previewAnswers,
                                          [q.labelKey]: opt,
                                          [`${q.labelKey}_drop_open`]: false
                                        });
                                      }}
                                      className="w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wide hover:bg-amber-400/10 hover:text-amber-400 transition-colors text-neutral-300 bg-neutral-900 border-none cursor-pointer"
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* 13. SLIDER */}
                        {q.fieldType === "SLIDER" && (() => {
                          const { min, max } = getSliderBoundaries(q);
                          const currentSliderVal = typeof previewAnswers[q.labelKey] === "number" ? previewAnswers[q.labelKey] : Math.floor((min + max) / 2);
                          const percent = max > min ? Math.min(100, Math.max(0, ((currentSliderVal - min) / (max - min)) * 100)) : 0;

                          return (
                            <div className="flex flex-col gap-4 max-w-lg mt-2 w-full">
                              <div className="relative w-full h-4 bg-neutral-800 border border-neutral-700 select-none">
                                <div 
                                  className="absolute left-0 top-0 bottom-0 bg-amber-400" 
                                  style={{ width: `${percent}%` }}
                                />
                                <div 
                                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-amber-400 rotate-45 border-2 border-black flex items-center justify-center pointer-events-none"
                                  style={{ left: `calc(${percent}% - 12px)` }}
                                />
                                <input
                                  type="range"
                                  min={min}
                                  max={max}
                                  value={currentSliderVal}
                                  onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: Number(e.target.value) })}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                              </div>

                              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-neutral-500">
                                <span>{min}</span>
                                <span className="text-amber-400 text-sm">{currentSliderVal}</span>
                                <span>{max}</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 14. CONTACT_INFO & 15. ADDRESS */}
                        {(q.fieldType === "CONTACT_INFO" || q.fieldType === "ADDRESS") && (() => {
                          const parentId = q.id || q.clientTempId;
                          const children = questions.filter(item => item.parentId === parentId);
                          return (
                            <div className="flex flex-col gap-6 mt-2 w-full">
                              {children.map((child) => {
                                return (
                                  <div key={child.id || child.clientTempId} className="flex flex-col gap-2">
                                    <span className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                                      {child.label}
                                      {child.isRequired && <span className="text-red-400 ml-1">*</span>}
                                    </span>
                                    {child.fieldType === "EMAIL" ? (
                                      <div className="flex items-center gap-2 border-b border-neutral-700 focus-within:border-amber-400 transition-colors py-2">
                                        <Mail className="w-4 h-4 text-neutral-500 shrink-0" />
                                        <input type="email" placeholder={child.placeholder || "email@example.com"} value={previewAnswers[child.labelKey] || ""} onChange={(e) => setPreviewAnswers({ ...previewAnswers, [child.labelKey]: e.target.value })} className="bg-transparent text-white w-full focus-visible:outline-none placeholder:text-neutral-600 text-base" />
                                      </div>
                                    ) : child.fieldType === "PHONE" ? (
                                      <div className="flex items-center gap-2 border-b border-neutral-700 focus-within:border-amber-400 transition-colors py-2">
                                        <PhoneIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                                        <input type="tel" placeholder={child.placeholder || "(555) 000-0000"} value={previewAnswers[child.labelKey] || ""} onChange={(e) => setPreviewAnswers({ ...previewAnswers, [child.labelKey]: e.target.value.replace(/[^0-9]/g, "") })} className="bg-transparent text-white w-full focus-visible:outline-none placeholder:text-neutral-600 text-base" />
                                      </div>
                                    ) : child.fieldType === "WEBSITE" ? (
                                      <div className="flex items-center gap-2 border-b border-neutral-700 focus-within:border-amber-400 transition-colors py-2">
                                        <GlobeIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                                        <span className="text-neutral-500 font-bold">https://</span>
                                        <input type="text" placeholder={child.placeholder || "yourwebsite.com"} value={previewAnswers[child.labelKey] || ""} onChange={(e) => setPreviewAnswers({ ...previewAnswers, [child.labelKey]: e.target.value })} className="bg-transparent text-white w-full focus-visible:outline-none placeholder:text-neutral-600 text-base" />
                                      </div>
                                    ) : (
                                      <input type="text" placeholder={child.placeholder || ""} value={previewAnswers[child.labelKey] || ""} onChange={(e) => setPreviewAnswers({ ...previewAnswers, [child.labelKey]: e.target.value })} className="bg-transparent border-b border-neutral-700 focus:border-amber-400 text-white py-2 w-full focus-visible:outline-none transition-colors placeholder:text-neutral-600 text-base" />
                                    )}
                                  </div>
                                );
                              })}
                              {children.length === 0 && (
                                <p className="text-xs text-muted-foreground uppercase py-4 font-bold text-center">No fields configured.</p>
                              )}
                            </div>
                          );
                        })()}

                        {/* 16. IMAGE */}
                        {q.fieldType === "IMAGE" && (
                          <div className="border-2 border-dashed border-neutral-800 p-16 flex flex-col items-center justify-center gap-6 bg-neutral-900/20 max-w-xl w-full">
                            <ImageIcon className="w-16 h-16 text-neutral-600 animate-pulse" />
                            <span className="text-base font-black uppercase tracking-widest text-white">Upload Image File</span>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: e.target.files?.[0]?.name || "" })}
                              className="text-xs text-muted-foreground uppercase tracking-wider cursor-pointer"
                            />
                            {previewAnswers[q.labelKey] && (
                              <span className="text-xs text-amber-450 font-bold bg-neutral-900 text-white px-3.5 py-1.5 uppercase tracking-wider mt-1 border border-neutral-700">
                                Attached: {previewAnswers[q.labelKey]}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 17. VIDEO */}
                        {q.fieldType === "VIDEO" && (
                          <div className="border-2 border-dashed border-neutral-800 p-16 flex flex-col items-center justify-center gap-6 bg-neutral-900/20 max-w-xl w-full">
                            <VideoIcon className="w-16 h-16 text-neutral-600 animate-pulse" />
                            <span className="text-base font-black uppercase tracking-widest text-white">Upload Video Attachment</span>
                            <input 
                              type="file" 
                              accept="video/*"
                              onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: e.target.files?.[0]?.name || "" })}
                              className="text-xs text-muted-foreground uppercase tracking-wider cursor-pointer"
                            />
                            {previewAnswers[q.labelKey] && (
                              <span className="text-xs text-amber-450 font-bold bg-neutral-900 text-white px-3.5 py-1.5 uppercase tracking-wider mt-1 border border-neutral-700">
                                Attached: {previewAnswers[q.labelKey]}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 18. AUDIO */}
                        {q.fieldType === "AUDIO" && (
                          <div className="border-2 border-dashed border-neutral-800 p-16 flex flex-col items-center justify-center gap-6 bg-neutral-900/20 max-w-xl w-full">
                            <AudioIcon className="w-16 h-16 text-neutral-600 animate-pulse" />
                            <span className="text-base font-black uppercase tracking-widest text-white">Upload Sound / Audio</span>
                            <input 
                              type="file" 
                              accept="audio/*"
                              onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: e.target.files?.[0]?.name || "" })}
                              className="text-xs text-muted-foreground uppercase tracking-wider cursor-pointer"
                            />
                            {previewAnswers[q.labelKey] && (
                              <span className="text-xs text-amber-450 font-bold bg-neutral-900 text-white px-3.5 py-1.5 uppercase tracking-wider mt-1 border border-neutral-700">
                                Attached: {previewAnswers[q.labelKey]}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 19. FILE */}
                        {q.fieldType === "FILE" && (
                          <div className="border-2 border-dashed border-neutral-800 p-16 flex flex-col items-center justify-center gap-6 bg-neutral-900/20 max-w-xl w-full">
                            <FileIcon className="w-16 h-16 text-neutral-600 animate-pulse" />
                            <span className="text-base font-black uppercase tracking-widest text-white">Upload Document attachment</span>
                            <input 
                              type="file" 
                              onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.labelKey]: e.target.files?.[0]?.name || "" })}
                              className="text-xs text-muted-foreground uppercase tracking-wider cursor-pointer"
                            />
                            {previewAnswers[q.labelKey] && (
                              <span className="text-xs text-amber-455 font-bold bg-neutral-900 text-white px-3.5 py-1.5 uppercase tracking-wider mt-1 border border-neutral-700">
                                Attached: {previewAnswers[q.labelKey]}
                              </span>
                            )}
                          </div>
                        )}
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
                className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest bg-transparent border-none cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
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
                      className="flex items-center gap-2 bg-amber-400 text-black font-black uppercase tracking-widest text-sm px-6 py-3 hover:bg-amber-300 transition-colors cursor-pointer"
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
                    className="flex items-center gap-2 bg-amber-400 text-black font-black uppercase tracking-widest text-sm px-6 py-3 hover:bg-amber-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
