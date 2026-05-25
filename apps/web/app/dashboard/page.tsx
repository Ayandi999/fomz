"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "~/hooks/api/auth/useUser";
import { useCreateForm } from "~/hooks/api/forms/useCreateForm";
import { useDeleteForm } from "~/hooks/api/forms/useDeleteForm";
import { useUserForms } from "~/hooks/api/forms/useUserForms";
import { usePublishForm } from "~/hooks/api/forms/usePublishForm";
import { toast } from "sonner";
import { ExternalLink, Link as LinkIcon, Copy, QrCode } from "lucide-react";
import QRCode from "qrcode";

type FormStatus = "draft" | "published";

type FormItem = {
  id: string;
  title: string;
  status: FormStatus;
  responses: number;
  updatedAt: string;
};

const inputClass =
  "flex h-10 w-full rounded-none border-2 border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-neutral-900 dark:focus-visible:border-neutral-100 disabled:cursor-not-allowed disabled:opacity-50";

const buttonPrimaryClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-widest bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 h-11 px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const buttonSecondaryClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-widest border-2 border-neutral-900 dark:border-neutral-100 bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 h-11 px-4 py-2 transition-colors";

const cardClass =
  "border-2 border-neutral-900 dark:border-neutral-100 bg-background p-6 flex flex-col gap-4";

function StatusBadge({ status }: { status: FormStatus }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border-2 ${
        status === "published"
          ? "border-neutral-900 dark:border-neutral-100 bg-neutral-900 text-white dark:bg-white dark:text-black"
          : "border-neutral-400 dark:border-neutral-600 text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { user, isLoading: isUserLoading, isFetched } = useUser();
  const { createFormAsync, isPending, isError, error } = useCreateForm();
  const { deleteFormAsync } = useDeleteForm();
  const { forms: realForms, isLoading: isFormsLoading, refetch: refetchForms } = useUserForms();
  const router = useRouter();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Publish & Share Modal States
  const [selectedFormForModal, setSelectedFormForModal] = useState<any | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [modalVisibility, setModalVisibility] = useState<"PUBLIC" | "PRIVATE" | "UNLISTED">("UNLISTED");
  const [modalValidTill, setModalValidTill] = useState<string>("");
  const [modalIsPublished, setModalIsPublished] = useState(false);
  const [modalShareTab, setModalShareTab] = useState<"link" | "qr">("link");
  const [modalLinkCopied, setModalLinkCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    if (selectedFormForModal?.slug) {
      const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${selectedFormForModal.slug}`;
      QRCode.toDataURL(shareUrl, { width: 160, margin: 2 })
        .then((url) => {
          setQrCodeDataUrl(url);
        })
        .catch((err) => {
          console.error("Failed to generate QR code", err);
        });
    } else {
      setQrCodeDataUrl("");
    }
  }, [selectedFormForModal?.slug]);

  const displayForms = realForms || [];

  useEffect(() => {
    if (isFetched && !isUserLoading && !user?.id) {
      router.replace("/sign-in");
    }
  }, [user, isUserLoading, isFetched, router]);

  const { publishFormAsync, isPending: isPublishing } = usePublishForm();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    const description = newDescription.trim() || undefined;
    await createFormAsync({ title, description });
    await refetchForms();

    setNewTitle("");
    setNewDescription("");
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    const deleteToastId = toast.loading("Permanently deleting form and purging files...");
    try {
      await deleteFormAsync({ formId: id });
      await refetchForms();
      setDeleteConfirmationId(null);
      toast.success("Form and all associated media deleted successfully!", { id: deleteToastId });
    } catch (err) {
      console.error("Failed to delete form:", err);
      toast.error("Failed to delete form.", { id: deleteToastId });
    }
  };

  const openPublishModal = (e: React.MouseEvent, form: any, defaultTab: "link" | "qr" = "link") => {
    e.stopPropagation();
    setSelectedFormForModal(form);
    setModalIsPublished(form.isPublished);
    setModalVisibility(form.visibility || "UNLISTED");
    setModalValidTill(form.validTill ? new Date(form.validTill).toISOString().slice(0, 16) : "");
    setModalShareTab(defaultTab);
    setShowPublishModal(true);
  };

  const handleModalTogglePublish = async () => {
    if (!selectedFormForModal) return;
    const nextPublishState = !modalIsPublished;
    const publishToastId = toast.loading(nextPublishState ? "Publishing form..." : "Unpublishing form...");
    try {
      await publishFormAsync({
        formId: selectedFormForModal.id,
        isPublished: nextPublishState,
        visibility: modalVisibility,
        validTill: modalValidTill ? new Date(modalValidTill) : null,
      });
      setModalIsPublished(nextPublishState);
      toast.success(nextPublishState ? "Form published successfully!" : "Form unpublished.", { id: publishToastId });
      await refetchForms();
      setSelectedFormForModal((prev: any) => prev ? { ...prev, isPublished: nextPublishState } : null);
    } catch (err) {
      console.error("Failed to toggle publish status", err);
      toast.error("Failed to update publish state.", { id: publishToastId });
    }
  };

  const handleModalSaveSettings = async () => {
    if (!selectedFormForModal) return;
    const publishToastId = toast.loading("Saving publish settings...");
    try {
      await publishFormAsync({
        formId: selectedFormForModal.id,
        isPublished: modalIsPublished,
        visibility: modalVisibility,
        validTill: modalValidTill ? new Date(modalValidTill) : null,
      });
      toast.success("Publish settings saved!", { id: publishToastId });
      await refetchForms();
    } catch (err) {
      console.error("Failed to save publish settings", err);
      toast.error("Failed to save settings.", { id: publishToastId });
    }
  };

  const handleModalCopyLink = () => {
    if (!selectedFormForModal?.slug) return;
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${selectedFormForModal.slug}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setModalLinkCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setModalLinkCopied(false), 2000);
    }).catch((err) => {
      console.error("Failed to copy link", err);
      toast.error("Failed to copy link.");
    });
  };

  if (isUserLoading || isFormsLoading || !user?.id) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center p-4">
        <div className={`${cardClass} w-full max-w-md items-center`}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  const publishedCount = displayForms.filter((f) => f.isPublished).length;
  const totalResponses = 0;

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 py-8">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* Top Navbar */}
        <nav className="w-full border-2 border-neutral-900 dark:border-neutral-100 bg-background px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight uppercase bg-neutral-900 text-white dark:bg-white dark:text-black px-2 py-0.5">
            Streamyst
          </span>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
            </span>
          </div>
        </nav>

        {/* Header */}
        <header className={cardClass}>
          <div className="flex flex-col gap-1 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight uppercase">
                Dashboard
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                Welcome back, {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className={`${buttonPrimaryClass} w-full sm:w-auto`}
            >
              + New Form
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">            <div className="border-2 border-neutral-300 dark:border-neutral-700 p-4 flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Forms
              </span>
              <span className="text-2xl font-extrabold">{displayForms.length}</span>
            </div>
            <div className="border-2 border-neutral-300 dark:border-neutral-700 p-4 flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Published
              </span>
              <span className="text-2xl font-extrabold">{publishedCount}</span>
            </div>
            <div className="border-2 border-neutral-300 dark:border-neutral-700 p-4 flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Responses
              </span>
              <span className="text-2xl font-extrabold">{totalResponses}</span>
            </div>
          </div>
        </header>
 
        {/* Forms list */}
        <section className={cardClass}>
          <div className="flex flex-col gap-1 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
            <h2 className="text-xl font-extrabold tracking-tight uppercase">
              Your Forms
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Create, edit, and share conversational forms
            </p>
          </div>
 
          {displayForms.length === 0 ? (
            <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-8 flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                No forms yet — create your first one
              </p>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className={buttonPrimaryClass}
              >
                Create Form
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {displayForms.map((form) => (
                <li
                  key={form.id}
                  onClick={() => router.push(`/dashboard/edit/${form.id}`)}
                  className="border-2 border-neutral-300 dark:border-neutral-700 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:border-neutral-900 dark:hover:border-neutral-100 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold uppercase tracking-tight truncate">
                        {form.title}
                      </h3>
                      <StatusBadge status={form.isPublished ? "published" : "draft"} />
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      0 responses · Updated {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : "Just now"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/edit/${form.id}`);
                      }}
                      className={`${buttonSecondaryClass} h-9 px-3 text-xs`}
                    >
                      Edit
                    </button>
                    {form.isPublished ? (
                      <button
                        type="button"
                        onClick={(e) => openPublishModal(e, form, "link")}
                        className={`${buttonSecondaryClass} h-9 px-3 text-xs`}
                      >
                        Share
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => openPublishModal(e, form, "link")}
                        className={`${buttonSecondaryClass} h-9 px-3 text-xs bg-amber-500 hover:bg-amber-650 border-neutral-900 text-neutral-900 dark:bg-amber-400 dark:hover:bg-amber-450 dark:border-neutral-100`}
                      >
                        Publish
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmationId(form.id);
                      }}
                      className={`${buttonSecondaryClass} h-9 px-3 text-xs border-red-600 dark:border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Create form modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setShowCreate(false)}
        >
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className={`${cardClass} w-full max-w-md gap-6`}
          >
            <div className="flex flex-col gap-1 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
              <h2 className="text-2xl font-extrabold tracking-tight uppercase">
                New Form
              </h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Give your form a name to get started
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Form Title
              </label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. Product launch survey"
                required
                autoFocus
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description (optional)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className={`${inputClass} min-h-20 py-2 resize-none`}
                placeholder="What is this form for?"
                disabled={isPending}
              />
            </div>

            {isError && (
              <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                {error?.message ?? "Failed to create form"}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={isPending}
                className={`${buttonPrimaryClass} flex-1`}
              >
                {isPending ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={isPending}
                className={`${buttonSecondaryClass} flex-1`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Publish & Share Modal */}
      {showPublishModal && selectedFormForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => setShowPublishModal(false)}
        >
          <div
            className="bg-background border-2 border-neutral-900 dark:border-neutral-100 w-full max-w-md flex flex-col gap-0 shadow-2xl text-neutral-900 dark:text-neutral-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b-2 border-neutral-900 dark:border-neutral-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-amber-500" /> Publish & Share
              </h2>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest cursor-pointer bg-transparent border-none"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-6 px-6 py-6">
              {/* Publish Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-widest">
                    {modalIsPublished ? "Published" : "Unpublished"}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                    {modalIsPublished
                      ? "Your form is live and accepting responses."
                      : "Your form is a draft — not visible to the public."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleModalTogglePublish}
                  disabled={isPublishing}
                  className={`${modalIsPublished ? buttonPrimaryClass : buttonSecondaryClass} h-9 px-4 text-xs flex items-center gap-1.5`}
                >
                  {isPublishing ? "Updating…" : modalIsPublished ? "Unpublish" : "Publish Now"}
                </button>
              </div>

              {/* Visibility Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Visibility
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["PUBLIC", "UNLISTED", "PRIVATE"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setModalVisibility(v)}
                      className={`border-2 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        modalVisibility === v
                          ? "border-neutral-900 dark:border-neutral-100 bg-neutral-900 text-white dark:bg-white dark:text-black"
                          : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-600 bg-background"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                  {modalVisibility === "PUBLIC" && "Anyone can find and fill this form."}
                  {modalVisibility === "UNLISTED" && "Only people with the link can access."}
                  {modalVisibility === "PRIVATE" && "Form is hidden from all respondents."}
                </p>
              </div>

              {/* Expiration Settings */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Expiration Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={modalValidTill}
                  onChange={(e) => setModalValidTill(e.target.value)}
                  className={`${inputClass} text-xs`}
                />
                {modalValidTill && (
                  <button
                    type="button"
                    onClick={() => setModalValidTill("")}
                    className="text-[9px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider text-left cursor-pointer bg-transparent border-none"
                  >
                    ✕ Clear expiration
                  </button>
                )}
              </div>

              {/* Save Settings Button */}
              <button
                type="button"
                onClick={handleModalSaveSettings}
                disabled={isPublishing}
                className={`${buttonSecondaryClass} w-full h-10 text-xs`}
              >
                Save Publish Settings
              </button>

              {/* Share link and QR (Only if published) */}
              {modalIsPublished && (
                <div className="border-t-2 border-neutral-200 dark:border-neutral-800 pt-4 flex flex-col gap-3">
                  {/* Tab switcher */}
                  <div className="flex border-2 border-neutral-200 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setModalShareTab("link")}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                        modalShareTab === "link"
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-900 bg-background text-neutral-900 dark:text-neutral-100"
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" /> Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalShareTab("qr")}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                        modalShareTab === "qr"
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-900 bg-background text-neutral-900 dark:text-neutral-100"
                      }`}
                    >
                      <QrCode className="w-3 h-3" /> QR Code
                    </button>
                  </div>

                  {modalShareTab === "link" && (
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/share/${selectedFormForModal.slug}`}
                        className={`${inputClass} text-xs flex-1 select-all`}
                        onFocus={(e) => e.target.select()}
                      />
                      <button
                        type="button"
                        onClick={handleModalCopyLink}
                        className={`${buttonPrimaryClass} h-10 px-3 text-xs flex items-center gap-1.5 shrink-0`}
                      >
                        {modalLinkCopied ? (
                          "Copied!"
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
                        )}
                      </button>
                      <a
                        href={`/share/${selectedFormForModal.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${buttonSecondaryClass} h-10 px-3 text-xs flex items-center gap-1.5 shrink-0`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open
                      </a>
                    </div>
                  )}

                  {modalShareTab === "qr" && qrCodeDataUrl && (
                    <div className="flex flex-col items-center gap-3 py-2 animate-fade-in">
                      <div className="border-2 border-neutral-200 dark:border-neutral-800 p-4 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrCodeDataUrl}
                          alt="QR Code"
                          width={160}
                          height={160}
                          className="block"
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest text-center">
                        Scan to open the form
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Popup */}
      {deleteConfirmationId && (() => {
        const formToDelete = displayForms.find(f => f.id === deleteConfirmationId);
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
            onClick={() => setDeleteConfirmationId(null)}
          >
            <div
              className={`${cardClass} w-full max-w-md gap-6 shadow-2xl animate-fade-in text-neutral-900 dark:text-neutral-100`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
                <h2 className="text-2xl font-extrabold tracking-tight uppercase text-red-500">
                  Delete Form?
                </h2>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  This action is permanent and cannot be undone
                </p>
              </div>

              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                Are you sure you want to permanently delete "{formToDelete?.title || "this form"}"? 
                This will purge all its associated answers, files, recordings, and media resources from the storage.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row mt-2">
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmationId)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-widest bg-red-600 text-white hover:bg-red-500 h-11 px-4 py-2 transition-colors cursor-pointer flex-1"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmationId(null)}
                  className={`${buttonSecondaryClass} flex-1`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
