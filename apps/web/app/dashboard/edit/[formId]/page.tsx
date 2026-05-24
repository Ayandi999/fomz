"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Save, Eye, EyeOff, CheckSquare
} from "lucide-react";
import { useUser } from "~/hooks/api/auth/useUser";
import { useGetFormFields } from "~/hooks/api/forms/useGetFormFields";
import { useCreateFormFields } from "~/hooks/api/forms/useCreateFormFields";
import { usePutFormFields } from "~/hooks/api/forms/usePutFormFields";
import { useDeleteFormField } from "~/hooks/api/forms/useDeleteFormField";
import { usePublishForm } from "~/hooks/api/forms/usePublishForm";
import { useUserForms } from "~/hooks/api/forms/useUserForms";

type FieldType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "NUMBER"
  | "EMAIL"
  | "DATE"
  | "YES_NO"
  | "RATING"
  | "CONTACT_INFO"
  | "ADDRESS"
  | "PHONE"
  | "WEBSITE"
  | "MULTIPLE_CHOICE"
  | "CHECKBOX"
  | "DROPDOWN"
  | "SLIDER";

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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [publishStatus, setPublishStatus] = useState<boolean>(false);

  const currentForm = forms?.find((f) => f.id === formId);

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
    } else {
      setQuestions([]);
    }
  }, [dbFields]);

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

  const addQuestion = (type: FieldType) => {
    const tempId = `temp_${Date.now()}`;
    const nextIndex = questions.length > 0 ? Math.max(...questions.map((q) => q.index)) + 1.0 : 1.0;
    
    const newQuestion: QuestionItem = {
      clientTempId: tempId,
      label: `New ${type.replace("_", " ")} Question`,
      placeholder: "",
      description: "",
      fieldType: type,
      isRequired: false,
      index: nextIndex,
      labelKey: `${type.toLowerCase()}_${Date.now().toString().slice(-4)}`,
      parentId: null,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<QuestionItem>) => {
    const updated = [...questions];
    const current = updated[index];
    if (current) {
      updated[index] = { ...current, ...updates } as QuestionItem;
      setQuestions(updated);
    }
  };

  const deleteQuestion = async (index: number) => {
    const q = questions[index];
    if (q && q.id) {
      try {
        await deleteFormFieldAsync({
          formId,
          fieldId: q.id,
        });
      } catch (err) {
        console.error("Failed to delete question", err);
        return;
      }
    }
    const updated = questions.filter((_, i) => i !== index);
    // Recalculate indexes to ensure no collisions
    const reIndexed = updated.map((q, i) => ({ ...q, index: i + 1.0 }));
    setQuestions(reIndexed);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === questions.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...questions];
    
    // Swap items safely
    const temp = updated[index];
    const target = updated[targetIndex];
    if (temp && target) {
      updated[index] = target;
      updated[targetIndex] = temp;
    }

    // Re-index sequentially to avoid composite unique index collisions
    const reIndexed = updated.map((q, i) => ({ ...q, index: i + 1.0 }));
    setQuestions(reIndexed);
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      // Clear parentId values that refer to temporary IDs which are no longer in the list
      const validClientTempIds = questions.map((q) => q.clientTempId).filter(Boolean);
      const validDbIds = questions.map((q) => q.id).filter(Boolean);
      const allowedParentIds = [...validClientTempIds, ...validDbIds];

      // 1. Separate new questions and existing questions
      const newFields = questions
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

      const putFields = questions
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

      // 2. Call batch create if there are new questions
      if (newFields.length > 0) {
        await createFormFieldsAsync({
          formId,
          fields: newFields,
        });
      }

      // 3. Call batch put if there are updated questions
      if (putFields.length > 0) {
        await putFormFieldsAsync({
          formId,
          fields: putFields,
        });
      }

      setSaveStatus("saved");
      await refetchFields();
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  };

  const handleTogglePublish = async () => {
    try {
      const nextPublishState = !publishStatus;
      await publishFormAsync({
        formId,
        isPublished: nextPublishState,
      });
      setPublishStatus(nextPublishState);
    } catch (err) {
      console.error("Failed to toggle publish status", err);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 py-8">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* Navigation Bar */}
        <nav className="w-full border-2 border-neutral-900 dark:border-neutral-100 bg-background px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-black tracking-widest uppercase hover:text-muted-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {currentForm?.title || "Conversational Form Builder"}
            </span>
          </div>
        </nav>

        {/* Builder Interface */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Editing Board */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className={cardClass}>
              <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight">Questions Builder</h1>
                  <p className="text-xs text-muted-foreground uppercase mt-1 tracking-wider">
                    Add, edit and order your conversational questions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`${buttonPrimaryClass} h-9 px-4 text-xs flex items-center gap-1.5`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>

              {saveStatus === "saved" && (
                <div className="bg-emerald-100 dark:bg-emerald-950/20 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-400 p-3 text-xs font-bold uppercase tracking-wider text-center">
                  Changes saved successfully!
                </div>
              )}

              {saveStatus === "error" && (
                <div className="bg-red-100 dark:bg-red-950/20 border-2 border-red-500 text-red-800 dark:text-red-400 p-3 text-xs font-bold uppercase tracking-wider text-center">
                  Failed to save questions. Ensure Label Keys are unique.
                </div>
              )}

              {questions.length === 0 ? (
                <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 py-12 px-6 flex flex-col items-center justify-center gap-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    This Form is Empty
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs uppercase tracking-wider -mt-2">
                    Click the buttons in the "Add Question" panel to build your dynamic conversational workflow.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id || q.clientTempId}
                      className="border-2 border-neutral-900 dark:border-neutral-100 p-4 flex flex-col gap-4 relative group/item hover:bg-neutral-50 dark:hover:bg-neutral-950/40 transition-colors"
                    >
                      {/* Top Action Panel for Item */}
                      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-neutral-900 text-white dark:bg-white dark:text-black">
                          {idx + 1}. {q.fieldType.replace("_", " ")}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => moveQuestion(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveQuestion(idx, "down")}
                            disabled={idx === questions.length - 1}
                            className="p-1 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteQuestion(idx)}
                            className="p-1 border border-red-600/30 text-red-600 hover:border-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Editing Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Question / Label
                          </label>
                          <input
                            value={q.label}
                            onChange={(e) => updateQuestion(idx, { label: e.target.value })}
                            placeholder="e.g. What is your full name?"
                            className={inputClass}
                            required
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Identifier Key
                          </label>
                          <input
                            value={q.labelKey}
                            onChange={(e) => updateQuestion(idx, { labelKey: e.target.value })}
                            placeholder="e.g. first_name"
                            className={inputClass}
                            required
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Placeholder Subtext
                          </label>
                          <input
                            value={q.placeholder}
                            onChange={(e) => updateQuestion(idx, { placeholder: e.target.value })}
                            placeholder="e.g. Type your response here..."
                            className={inputClass}
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Parent Field Link (Optional nesting)
                          </label>
                          <select
                            value={q.parentId || ""}
                            onChange={(e) => updateQuestion(idx, { parentId: e.target.value || null })}
                            className={inputClass}
                          >
                            <option value="">No Parent Link (Standalone)</option>
                            {questions
                              .filter((parent, pIdx) => pIdx !== idx && (parent.id || parent.clientTempId))
                              .map((parent, pIdx) => (
                                <option 
                                  key={parent.id || parent.clientTempId} 
                                  value={parent.id || parent.clientTempId}
                                >
                                  Q{pIdx + 1}: {parent.label || "Untitled Parent"} ({parent.fieldType})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {/* Required Checkbox and Index Detail */}
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                          <input
                            type="checkbox"
                            checked={q.isRequired}
                            onChange={(e) => updateQuestion(idx, { isRequired: e.target.checked })}
                            className="w-4 h-4 border-2 border-neutral-900 rounded-none bg-background accent-neutral-900 cursor-pointer"
                          />
                          Require answer to submit
                        </label>
                        <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">
                          Sorting Index: {q.index.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side panel: Add options & Publish settings */}
          <div className="flex flex-col gap-6">
            {/* Publish Actions card */}
            <div className={cardClass}>
              <div className="border-b-2 border-neutral-900 dark:border-neutral-100 pb-3">
                <h3 className="text-lg font-black uppercase tracking-tight">Form Settings</h3>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Publish Status
                </span>
                <button
                  type="button"
                  onClick={handleTogglePublish}
                  disabled={isPublishing}
                  className={`w-full ${buttonSecondaryClass} flex items-center justify-center gap-2`}
                >
                  {publishStatus ? (
                    <>
                      <EyeOff className="w-4 h-4" /> Take Un-published
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 bg-neutral-900 text-white dark:bg-white dark:text-black p-0.5 rounded-none" /> Go Live & Publish
                    </>
                  )}
                </button>
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Live form url:
                </span>
                <span className="text-xs underline text-neutral-900 dark:text-white break-all tracking-wider uppercase font-semibold">
                  /form/{currentForm?.slug || "draft-slug"}
                </span>
              </div>
            </div>

            {/* Field Addition Palette */}
            <div className={cardClass}>
              <div className="border-b-2 border-neutral-900 dark:border-neutral-100 pb-3">
                <h3 className="text-lg font-black uppercase tracking-tight">Add Question</h3>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => addQuestion("SHORT_TEXT")}
                  className={`${buttonSecondaryClass} h-10 text-xs justify-start px-4`}
                >
                  + Short Text Input
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("LONG_TEXT")}
                  className={`${buttonSecondaryClass} h-10 text-xs justify-start px-4`}
                >
                  + Long Text Paragraph
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("NUMBER")}
                  className={`${buttonSecondaryClass} h-10 text-xs justify-start px-4`}
                >
                  + Numeric Input
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("EMAIL")}
                  className={`${buttonSecondaryClass} h-10 text-xs justify-start px-4`}
                >
                  + Email Address
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("DATE")}
                  className={`${buttonSecondaryClass} h-10 text-xs justify-start px-4`}
                >
                  + Calendar Date Picker
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("YES_NO")}
                  className={`${buttonSecondaryClass} h-10 text-xs justify-start px-4`}
                >
                  + Yes / No Choice
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("RATING")}
                  className={`${buttonSecondaryClass} h-10 text-xs justify-start px-4`}
                >
                  + Star Rating Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
