"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Save, Eye, EyeOff, CheckSquare,
  Sparkles, Type, AlignLeft, Hash, Mail, Calendar, ToggleLeft, Star
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
  const [saveErrorMessage, setSaveErrorMessage] = useState<string>("");
  const [publishStatus, setPublishStatus] = useState<boolean>(false);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [showAddContent, setShowAddContent] = useState<boolean>(false);

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
      labelKey: `${type.toLowerCase()}_${Math.random().toString(36).substring(2, 6)}`,
      parentId: null,
    };
    const updated = [...questions, newQuestion];
    setQuestions(updated);
    setActiveIdx(updated.length - 1);
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
    if (questions.length <= 1) {
      toast.error("You need at least one question to create a form.");
      return;
    }
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

    // Safeguard activeIdx bounds
    if (reIndexed.length === 0) {
      setActiveIdx(0);
    } else if (activeIdx >= reIndexed.length) {
      setActiveIdx(reIndexed.length - 1);
    }
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
    setActiveIdx(targetIndex);
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
    } catch (err: any) {
      console.error(err);
      setSaveErrorMessage(err?.message || "Failed to save questions. Ensure Label Keys are unique.");
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
      <div className="w-full max-w-none flex flex-col gap-6 px-4 lg:px-8">
        {/* Navigation Bar */}
        <nav className="w-full border-2 border-neutral-900 dark:border-neutral-100 bg-background px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-black tracking-widest uppercase hover:text-muted-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-4">
              {currentForm?.title || "Conversational Form Builder"}
            </span>
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
        </nav>

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
                  {questions.length} Step{questions.length !== 1 ? 's' : ''}
                </span>
              </div>

              {questions.length === 0 ? (
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-center py-4">
                  No slides
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                  {questions.map((q, idx) => (
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
            {/* Top Toolbar with Add Content Button */}
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
                Changes saved successfully!
              </div>
            )}

            {saveStatus === "error" && (
              <div className="bg-red-100 dark:bg-red-950/20 border-2 border-red-500 text-red-800 dark:text-red-400 p-3 text-xs font-bold uppercase tracking-wider text-center">
                {saveErrorMessage}
              </div>
            )}

            {/* Conversational Live Slide Preview */}
            {questions.length === 0 ? (
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
              questions[activeIdx] && (
                <div className={cardClass}>
                  {/* Slide Header */}
                  <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-neutral-100 pb-4 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-neutral-900 text-white dark:bg-white dark:text-black">
                      Slide {activeIdx + 1} of {questions.length}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {questions[activeIdx].fieldType.replace("_", " ")}
                    </span>
                  </div>

                  {/* Typeform Live Slide Preview Canvas */}
                  <div className="flex flex-col gap-6 py-16 px-8 bg-neutral-50 dark:bg-neutral-950/40 border-2 border-dashed border-neutral-300 dark:border-neutral-700 min-h-[42vh] justify-center">
                    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
                      {/* Live editable question title */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest flex items-center gap-1">
                          Edit Question Label <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        </label>
                        <input
                          value={questions[activeIdx].label}
                          onChange={(e) => updateQuestion(activeIdx, { label: e.target.value })}
                          className="text-2xl md:text-3xl font-black bg-transparent border-b-2 border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-neutral-950 dark:focus:border-neutral-100 transition-colors w-full focus-visible:outline-none py-1 leading-tight uppercase tracking-tight"
                          placeholder="Enter question title..."
                        />
                      </div>

                      {/* Render the appropriate live input placeholder type */}
                      <div className="mt-8">
                        {questions[activeIdx].fieldType === "SHORT_TEXT" && (
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              placeholder={questions[activeIdx].placeholder || "Type your answer here..."}
                              className="text-lg bg-transparent border-b-2 border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-neutral-100 py-3 w-full focus-visible:outline-none transition-colors"
                              disabled
                            />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                              Press Enter ↵
                            </span>
                          </div>
                        )}

                        {questions[activeIdx].fieldType === "LONG_TEXT" && (
                          <div className="flex flex-col gap-2">
                            <textarea
                              placeholder={questions[activeIdx].placeholder || "Type your long paragraph answer here..."}
                              className="text-lg bg-transparent border-b-2 border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-neutral-100 py-3 w-full focus-visible:outline-none transition-colors min-h-24 resize-none"
                              disabled
                            />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                              Shift + Enter for new line
                            </span>
                          </div>
                        )}

                        {questions[activeIdx].fieldType === "NUMBER" && (
                          <div className="flex flex-col gap-2">
                            <input
                              type="number"
                              placeholder={questions[activeIdx].placeholder || "Enter a number..."}
                              className="text-lg bg-transparent border-b-2 border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-neutral-100 py-3 w-full focus-visible:outline-none transition-colors"
                              disabled
                            />
                          </div>
                        )}

                        {questions[activeIdx].fieldType === "EMAIL" && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 border-b-2 border-neutral-300 dark:border-neutral-700 py-3">
                              <Mail className="w-5 h-5 text-muted-foreground" />
                              <input
                                type="email"
                                placeholder={questions[activeIdx].placeholder || "name@example.com"}
                                className="text-lg bg-transparent w-full focus-visible:outline-none"
                                disabled
                              />
                            </div>
                          </div>
                        )}

                        {questions[activeIdx].fieldType === "DATE" && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 border-b-2 border-neutral-300 dark:border-neutral-700 py-3">
                              <Calendar className="w-5 h-5 text-muted-foreground" />
                              <input
                                type="text"
                                placeholder={questions[activeIdx].placeholder || "Select a date..."}
                                className="text-lg bg-transparent w-full focus-visible:outline-none"
                                disabled
                              />
                            </div>
                          </div>
                        )}

                        {questions[activeIdx].fieldType === "YES_NO" && (
                          <div className="flex flex-wrap gap-4 mt-2">
                            <button
                              type="button"
                              className="border-2 border-neutral-900 dark:border-neutral-100 px-6 py-3 font-bold uppercase tracking-widest hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors flex items-center gap-3 text-sm cursor-default"
                            >
                              <span className="bg-neutral-950 text-white dark:bg-white dark:text-black w-5 h-5 text-[10px] flex items-center justify-center font-extrabold">Y</span> Yes
                            </button>
                            <button
                              type="button"
                              className="border-2 border-neutral-900 dark:border-neutral-100 px-6 py-3 font-bold uppercase tracking-widest hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors flex items-center gap-3 text-sm cursor-default"
                            >
                              <span className="bg-neutral-950 text-white dark:bg-white dark:text-black w-5 h-5 text-[10px] flex items-center justify-center font-extrabold">N</span> No
                            </button>
                          </div>
                        )}

                        {questions[activeIdx].fieldType === "RATING" && (
                          <div className="flex gap-2 items-center mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className="w-8 h-8 text-neutral-300 dark:text-neutral-700 cursor-default"
                              />
                            ))}
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
            {questions[activeIdx] && (
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
                      checked={questions[activeIdx].isRequired}
                      onChange={(e) => updateQuestion(activeIdx, { isRequired: e.target.checked })}
                      className="w-4 h-4 border-2 border-neutral-900 rounded-none bg-background accent-neutral-900 cursor-pointer"
                    />
                    Required Field
                  </label>

                  {/* Custom Placeholder Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Placeholder Subtext
                    </label>
                    <input
                      value={questions[activeIdx].placeholder}
                      onChange={(e) => updateQuestion(activeIdx, { placeholder: e.target.value })}
                      placeholder="e.g. Type your response..."
                      className={inputClass}
                    />
                  </div>

                  {/* Move & Delete controls */}
                  <div className="flex gap-2 border-t border-neutral-200 dark:border-neutral-800 pt-3">
                    <button
                      type="button"
                      onClick={() => moveQuestion(activeIdx, "up")}
                      disabled={activeIdx === 0}
                      className={`${buttonSecondaryClass} flex-1 h-9 text-[10px] gap-1 px-1`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" /> Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(activeIdx, "down")}
                      disabled={activeIdx === questions.length - 1}
                      className={`${buttonSecondaryClass} flex-1 h-9 text-[10px] gap-1 px-1`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" /> Down
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQuestion(activeIdx)}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowAddContent(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`${cardClass} w-full max-w-xl gap-6 shadow-2xl`}
            >
              <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Add Content</h2>
                  <p className="text-xs text-muted-foreground uppercase mt-0.5 tracking-wider">
                    Select a field type to insert as a new slide
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { type: "SHORT_TEXT", label: "Short Text", desc: "For single-line answers like names or titles.", icon: Type },
                  { type: "LONG_TEXT", label: "Long Text", desc: "For longer paragraph responses or descriptions.", icon: AlignLeft },
                  { type: "NUMBER", label: "Number", desc: "Accepts numeric values and digits only.", icon: Hash },
                  { type: "EMAIL", label: "Email Address", desc: "For valid electronic mail contacts.", icon: Mail },
                  { type: "DATE", label: "Date Picker", desc: "Displays a clean date/calendar input.", icon: Calendar },
                  { type: "YES_NO", label: "Yes / No Choice", desc: "For simple boolean binary decisions.", icon: ToggleLeft },
                  { type: "RATING", label: "Rating Scale", desc: "A star-rating input for reviews or scoring.", icon: Star },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      addQuestion(item.type as FieldType);
                      setShowAddContent(false);
                    }}
                    className="text-left border-2 border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 p-4 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-950 flex flex-col gap-1 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 font-bold uppercase text-xs tracking-wide">
                      <item.icon className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                      {item.label}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-relaxed">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
