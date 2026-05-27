"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "~/hooks/api/auth/useUser";
import { useCreateForm } from "~/hooks/api/forms/useCreateForm";
import { useDeleteForm } from "~/hooks/api/forms/useDeleteForm";
import { useUserForms } from "~/hooks/api/forms/useUserForms";
import { usePublishForm } from "~/hooks/api/forms/usePublishForm";
import { useRecentSubmissions } from "~/hooks/api/forms/useRecentSubmissions";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { 
  Plus, Trash2, ExternalLink, Link as LinkIcon, Copy, QrCode, 
  ArrowRight, Check, Download, FileText, User as UserIcon, 
  ChevronDown, CheckCircle, Eye, Activity, MoreHorizontal, 
  BookOpen, HelpCircle, Phone, Sparkles
} from "lucide-react";
import QRCode from "qrcode";

type FormStatus = "draft" | "published";

const inputClass =
  "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

const buttonPrimaryClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-accent-hover h-10 px-4 py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer";

const buttonSecondaryClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-border bg-card text-foreground hover:bg-surface-hover h-10 px-4 py-2 transition-all duration-200 cursor-pointer";

const cardClass =
  "border border-border bg-card rounded-xl p-6 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

const isPlaceholderName = (name: string) => {
  return /^[A-Z0-9]{7}$/.test(name) || name.startsWith("temp_") || name.length === 0;
};

const getColorAndInitials = (id: string) => {
  const colors = [
    "bg-red-500/10 text-red-400 border border-red-500/20",
    "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    "bg-pink-500/10 text-pink-400 border border-pink-500/20",
    "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  ];
  const initialsList = ["JD", "EM", "SK", "TH", "WL", "RN", "FB", "MT", "KP", "HL", "GR", "OC"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIdx = Math.abs(hash) % colors.length;
  const initialIdx = Math.abs(hash) % initialsList.length;
  return {
    colorClass: colors[colorIdx]!,
    initials: initialsList[initialIdx]!,
  };
};

const getStatusDot = (id: string) => {
  const statuses = [
    { color: "bg-emerald-500", label: "Complete" },
    { color: "bg-emerald-500", label: "Complete" },
    { color: "bg-amber-500", label: "Partial" },
    { color: "bg-red-500", label: "Abandoned" },
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return statuses[Math.abs(hash) % statuses.length]!;
};

const mockViews = (id: string, responses: number) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (responses || 0) * 3 + (Math.abs(hash) % 15) + 5;
};

export default function DashboardPage() {
  const { user, isLoading: isUserLoading, isFetched } = useUser();
  const { createFormAsync, isPending } = useCreateForm();
  const { deleteFormAsync } = useDeleteForm();
  const { forms: realForms, isLoading: isFormsLoading, refetch: refetchForms } = useUserForms();
  const { recentSubmissions, isLoading: isSubmissionsLoading } = useRecentSubmissions();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [activeFormMenuId, setActiveFormMenuId] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "name" | "responses">("recent");
  const [recentLimit, setRecentLimit] = useState(4);

  // Publish & Share Modal States
  const [selectedFormForModal, setSelectedFormForModal] = useState<any | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [modalVisibility, setModalVisibility] = useState<"PUBLIC" | "PRIVATE" | "UNLISTED">("UNLISTED");
  const [modalValidTill, setModalValidTill] = useState<string>("");
  const [modalIsPublished, setModalIsPublished] = useState(false);
  const [modalShareTab, setModalShareTab] = useState<"link" | "qr">("link");
  const [modalLinkCopied, setModalLinkCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [modalAllowedDomains, setModalAllowedDomains] = useState<string[]>([]);
  const [modalNewDomainInput, setModalNewDomainInput] = useState("");
  const [modalIsPasswordProtected, setModalIsPasswordProtected] = useState<boolean>(false);
  const [modalPassword, setModalPassword] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const sortedForms = [...displayForms].sort((a, b) => {
    if (sortBy === "name") {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === "responses") {
      return (b.responses || 0) - (a.responses || 0);
    }
    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return dateB - dateA;
  });

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
    const createToastId = toast.loading("Creating form...");
    try {
      await createFormAsync({ title, description });
      await refetchForms();
      setNewTitle("");
      setNewDescription("");
      setShowCreate(false);
      toast.success("Form created successfully!", { id: createToastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create form.", { id: createToastId });
    }
  };

  const handleCreateFromTemplate = async (templateName: string) => {
    const createToastId = toast.loading(`Creating ${templateName} form...`);
    try {
      await createFormAsync({ 
        title: `${templateName} Form`, 
        description: `A pre-structured dynamic ${templateName.toLowerCase()} flow.` 
      });
      await refetchForms();
      toast.success(`${templateName} template deployed successfully!`, { id: createToastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create from template.", { id: createToastId });
    }
  };

  const handleDelete = async (id: string) => {
    const deleteToastId = toast.loading("Deleting form and purging answers...");
    try {
      await deleteFormAsync({ formId: id });
      await refetchForms();
      setDeleteConfirmationId(null);
      toast.success("Form and assets deleted successfully!", { id: deleteToastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete form.", { id: deleteToastId });
    }
  };

  const openPublishModal = (e: React.MouseEvent, form: any, defaultTab: "link" | "qr" = "link") => {
    e.stopPropagation();
    setSelectedFormForModal(form);
    setModalIsPublished(form.isPublished);
    setModalVisibility(form.visibility || "UNLISTED");
    setModalValidTill(form.validTill ? new Date(form.validTill).toISOString().slice(0, 16) : "");
    setModalAllowedDomains(form.allowedDomains || []);
    setModalIsPasswordProtected(!!form.isPasswordProtected);
    setModalPassword(form.isPasswordProtected ? "••••••••" : "");
    setModalShareTab(defaultTab);
    setShowPublishModal(true);
  };

  const handleModalTogglePublish = async () => {
    if (!selectedFormForModal) return;
    if (modalIsPasswordProtected && !modalPassword.trim()) {
      toast.error("Please enter a password when password protection is enabled.");
      return;
    }
    const nextPublishState = !modalIsPublished;
    const publishToastId = toast.loading(nextPublishState ? "Publishing form..." : "Unpublishing form...");
    try {
      const finalPassword = (modalPassword === "••••••••" || !modalPassword) ? undefined : modalPassword;

      await publishFormAsync({
        formId: selectedFormForModal.id,
        isPublished: nextPublishState,
        visibility: modalVisibility,
        validTill: modalValidTill ? new Date(modalValidTill) : null,
        allowedDomains: modalAllowedDomains,
        isPasswordProtected: modalIsPasswordProtected,
        password: finalPassword,
      });
      setModalIsPublished(nextPublishState);
      toast.success(nextPublishState ? "Form published successfully!" : "Form unpublished.", { id: publishToastId });
      await refetchForms();
      setSelectedFormForModal((prev: any) => prev ? { ...prev, isPublished: nextPublishState } : null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update publish state.", { id: publishToastId });
    }
  };

  const handleModalSaveSettings = async () => {
    if (!selectedFormForModal) return;
    if (modalIsPasswordProtected && !modalPassword.trim()) {
      toast.error("Please enter a password when password protection is enabled.");
      return;
    }
    const publishToastId = toast.loading("Saving publish settings...");
    try {
      const finalPassword = (modalPassword === "••••••••" || !modalPassword) ? undefined : modalPassword;

      await publishFormAsync({
        formId: selectedFormForModal.id,
        isPublished: modalIsPublished,
        visibility: modalVisibility,
        validTill: modalValidTill ? new Date(modalValidTill) : null,
        allowedDomains: modalAllowedDomains,
        isPasswordProtected: modalIsPasswordProtected,
        password: finalPassword,
      });
      toast.success("Publish settings saved!", { id: publishToastId });
      await refetchForms();
    } catch (err) {
      console.error(err);
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
      console.error(err);
      toast.error("Failed to copy link.");
    });
  };

  const handleCopyRecentLink = (slug: string) => {
    if (!slug) return;
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${slug}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("Share link copied successfully!");
    });
  };

  if (isUserLoading || isFormsLoading || !user?.id) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
            Orienting workspace…
          </p>
        </div>
      </div>
    );
  }

  const publishedCount = displayForms.filter((f) => f.isPublished).length;
  const totalResponses = displayForms.reduce((sum, f) => sum + (f.responses || 0), 0);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0F0F0F] text-foreground antialiased font-sans select-none pb-12">
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #111111;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #333333;
          border-radius: 999px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #555555;
        }
      `}</style>
      
      {/* Top Navbar */}
      <header className="w-full border-b border-border bg-[#0F0F0F]">
        <div className="w-full max-w-none px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/som.svg" alt="Formz! App Logo" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-4 relative z-50">


            {/* User Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 bg-secondary border-none hover:bg-surface-hover transition-all duration-200 p-1 pr-3 rounded-full cursor-pointer"
              >
                <div className="h-7 w-7 rounded-full bg-[#FF6B35] text-white font-bold text-xs flex items-center justify-center">
                  {user?.firstName ? user.firstName.substring(0, 2).toUpperCase() : "AP"}
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Ayandip Pal"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl z-50 flex flex-col p-1.5 animate-fade-in">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      router.push("/dashboard");
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-lg flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors duration-200"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#FF6B35]" /> Workspace
                  </button>
                  <div className="border-t border-border w-full my-1.5"></div>
                  <a
                    href="/sign-in"
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 border-none bg-transparent cursor-pointer no-underline transition-colors duration-200"
                  >
                    Logout
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="w-full max-w-none px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column sidebar: stats & recent activity (~25% width / 3 cols) */}
        <aside className="lg:col-span-3 flex flex-col gap-6 w-full lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto pr-1 scrollbar-thin">
          
          {/* Greeting context */}
          <div className="flex flex-col">
            <h1 className="text-[20px] font-bold text-white tracking-tight">
              Hey, {user?.firstName || "Ayandip"}
            </h1>
            <p className="text-[13px] text-[#666] uppercase font-bold tracking-wide mt-0.5">
              Welcome back to your workspace
            </p>
          </div>

          {/* Stats strip - Horizontal ambient layout, 12px radius, #161616 background */}
          <div className="bg-[#161616] p-4 rounded-xl flex items-center justify-between gap-1 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col">
              <span className="text-[28px] font-bold text-white leading-none">
                {displayForms.length}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-[#666] font-bold mt-1.5 flex items-center gap-1">
                <FileText className="w-3 h-3 text-[#A1A1A1]" /> Form{displayForms.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-8 w-[1px] bg-border/40"></div>
            <div className="flex flex-col">
              <span className="text-[28px] font-bold text-white leading-none">
                {publishedCount}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-[#666] font-bold mt-1.5 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-[#FF6B35]" /> Published
              </span>
            </div>
            <div className="h-8 w-[1px] bg-border/40"></div>
            <div className="flex flex-col">
              <span className="text-[28px] font-bold text-white leading-none">
                {totalResponses}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-[#666] font-bold mt-1.5 flex items-center gap-1">
                <Eye className="w-3 h-3 text-[#A1A1A1]" /> Views
              </span>
            </div>
          </div>

          {/* Recent Responses Section */}
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Recent Responses
                </h2>
              </div>
              <button 
                onClick={() => setRecentLimit(prev => prev + 5)}
                className="text-[13px] font-semibold text-[#FF6B35] hover:text-[#FF6B35]/80 transition-colors border-none bg-transparent cursor-pointer"
              >
                View All →
              </button>
            </div>

            {isSubmissionsLoading ? (
              <div className="flex flex-col gap-2.5">
                {[1, 2, 3].map((skeleton) => (
                  <div 
                    key={skeleton}
                    className="h-16 w-full rounded-xl overflow-hidden relative bg-[#161616] border border-transparent"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                  </div>
                ))}
              </div>
            ) : !recentSubmissions || recentSubmissions.length === 0 ? (
              <div className="bg-[#161616] rounded-xl p-6 flex flex-col items-center text-center gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                <div className="w-12 h-12 rounded-full bg-[#1C1C1C] flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[#666]" />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-[16px] font-semibold text-white">
                    No responses yet
                  </h4>
                  <p className="text-[14px] text-[#666] leading-snug">
                    Share your form to start collecting answers
                  </p>
                </div>
                {displayForms.length > 0 && displayForms.filter(f => f.isPublished)[0] && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstPublishedForm = displayForms.filter(f => f.isPublished)[0];
                      if (firstPublishedForm?.slug) {
                        handleCopyRecentLink(firstPublishedForm.slug);
                      }
                    }}
                    className="w-full py-2 bg-transparent border border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35]/10 transition-colors duration-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 justify-center cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-0 border border-border/10 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                {recentSubmissions.slice(0, recentLimit).map((sub, idx) => {
                  const { colorClass, initials } = getColorAndInitials(sub.submissionId);
                  const status = getStatusDot(sub.submissionId);
                  return (
                    <div
                      key={sub.submissionId}
                      className={`group/item bg-[#161616] hover:bg-[#1A1A1A] p-3 flex items-center justify-between gap-3 transition-all duration-200 ${
                        idx < Math.min(recentSubmissions.length, recentLimit) - 1 ? "border-b border-[#1F1F1F]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Initials Avatar */}
                        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${colorClass}`}>
                          {initials}
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-white truncate">
                              {sub.formTitle}
                            </span>
                            {/* Status Dot with Title Tooltip */}
                            <span 
                              className={`w-2 h-2 rounded-full ${status.color} shrink-0`} 
                              title={status.label}
                            />
                          </div>
                          <span className="text-[13px] text-[#666]">
                            #{(idx + 1)} recorded
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Timestamp */}
                        <span className="text-xs text-[#666] tracking-tight group-hover/item:hidden">
                          {new Date(sub.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        
                        {/* Hover Quick Actions */}
                        <div className="hidden group-hover/item:flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => router.push(`/dashboard/edit/${sub.formId}`)}
                            title="View Form Editor"
                            className="w-7 h-7 flex items-center justify-center bg-card hover:bg-surface-hover text-[#A1A1A1] hover:text-white rounded border border-border/10 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {recentSubmissions && recentSubmissions.length > recentLimit && (
              <button
                type="button"
                onClick={() => setRecentLimit(prev => prev + 4)}
                className="w-full py-2 mt-1 text-[11px] uppercase tracking-wider font-bold text-center text-[#666] hover:text-white transition-colors border-none bg-transparent cursor-pointer"
              >
                Load more...
              </button>
            )}
          </div>

        </aside>

        {/* Center: Forms List (~50% width / 6 cols) */}
        <section className="lg:col-span-6 flex flex-col gap-6 w-full">
          
          {/* Header block with Sort action */}
          <div className="w-full flex items-center justify-between border-b border-border/30 pb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              YOUR FORMS
            </h2>
            
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-tertiary">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-xs font-semibold text-[#666] hover:text-white transition-colors focus:outline-none cursor-pointer"
              >
                <option value="recent" className="bg-[#161616]">Recent</option>
                <option value="name" className="bg-[#161616]">Name</option>
                <option value="responses" className="bg-[#161616]">Responses</option>
              </select>
            </div>
          </div>

          {/* Form List block */}
          {sortedForms.length === 0 ? (
            <div className="bg-[#161616] p-12 rounded-xl flex flex-col items-center justify-center gap-4 text-center shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
              <div className="w-16 h-16 rounded-full bg-[#FF6B35]/10 flex items-center justify-center text-[#FF6B35]">
                <FileText className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-white">No forms yet</h3>
                <p className="text-sm text-[#666] leading-snug">
                  Create your first form to get started
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90 h-9 px-4 transition-all duration-200 cursor-pointer shadow-sm border-none mt-2"
              >
                + Create Form →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sortedForms.map((form) => {
                const isTemp = isPlaceholderName(form.title);
                const viewsCount = mockViews(form.id, form.responses);
                return (
                  <div
                    key={form.id}
                    onClick={() => router.push(`/dashboard/edit/${form.id}`)}
                    className="group bg-[#161616] hover:bg-[#1A1A1A] p-6 rounded-2xl flex flex-col gap-5 transition-all duration-200 cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.3)] relative border border-transparent hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[#0F0F0F] flex items-center justify-center shrink-0 border border-border/10">
                          <FileText className="w-5 h-5 text-[#FF6B35]" />
                        </div>
                        <div className="min-w-0 flex flex-col gap-0.5">
                          {isTemp ? (
                            <span className="text-[18px] font-bold text-[#666] italic">
                              Untitled Form
                            </span>
                          ) : (
                            <span className="text-[18px] font-bold text-white truncate">
                              {form.title}
                            </span>
                          )}
                          <p className="text-[13px] text-[#666] mt-0.5">
                            {form.responses || 0} responses · Updated {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : "Just now"} · 2m avg completion
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {form.isPublished ? (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-full">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          Published
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/40 border border-zinc-800/60 rounded-full">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-500"></span>
                          </span>
                          Unpublished
                        </span>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-2 mt-2 pt-3 border-t border-border/10" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/edit/${form.id}`)}
                        className="h-8 px-4 text-xs font-semibold bg-[#1C1C1E] border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-all duration-200 cursor-pointer"
                      >
                        Edit
                      </button>
                      
                      <button
                        type="button"
                        onClick={(e) => openPublishModal(e, form)}
                        className="h-8 px-4 text-xs bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white border-none font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-all duration-200"
                      >
                        {form.isPublished ? "Share" : "Publish"} <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmationId(form.id);
                        }}
                        className="h-8 px-3 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all duration-200 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>

                  </div>
                );
              })}

              {/* Add Extra Quiz card */}
              <div
                onClick={() => {
                  setNewTitle("");
                  setNewDescription("");
                  setShowCreate(true);
                }}
                className="group border border-dashed border-zinc-800 hover:border-[#FF6B35] bg-transparent hover:bg-[#161616]/40 p-5 rounded-2xl flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer min-h-[80px]"
              >
                <Plus className="w-4 h-4 text-zinc-500 group-hover:text-[#FF6B35] transition-colors" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-white transition-colors">
                  Add Extra Quiz
                </span>
              </div>
            </div>
          )}

        </section>

        {/* Right: Quick Start Templates (~25% width / 3 cols) */}
        <aside className="lg:col-span-3 flex flex-col gap-6 w-full">
          
          <div className="flex items-center gap-2 border-b border-border/30 pb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Quick Start
            </h2>
            <span className="text-[10px] px-2 py-0.5 bg-[#161616] text-[#666] font-bold rounded-full">
              4 templates
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { name: "Feedback", desc: "Customer review", icon: FileText, details: "Collect product reviews" },
              { name: "Contact", desc: "Lead collection", icon: Phone, details: "Grow your list easily" },
              { name: "Survey", desc: "Product research", icon: BookOpen, details: "Gather user feedback" },
              { name: "Quiz", desc: "Trivia and test", icon: HelpCircle, details: "Engage your audience" },
            ].map((tmpl) => {
              const IconComp = tmpl.icon;
              return (
                <div
                  key={tmpl.name}
                  onClick={() => handleCreateFromTemplate(tmpl.name)}
                  className="group/tmpl border-l-[3px] border-transparent bg-[#161616] hover:bg-[#1A1A1A] hover:border-[#FF6B35] p-6 rounded-xl flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#1A1A1A] group-hover/tmpl:bg-[#161616] flex items-center justify-center shrink-0 transition-colors">
                      <IconComp className="w-4 h-4 text-[#FF6B35]" />
                    </div>
                    <div className="flex flex-col min-w-0 gap-0.5">
                      <span className="text-sm font-bold text-white">
                        {tmpl.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold truncate">
                        {tmpl.desc}
                      </span>
                    </div>
                  </div>
                  
                  <span className="hidden group-hover/tmpl:inline-block text-[13px] font-bold text-[#FF6B35] animate-fade-in whitespace-nowrap shrink-0">
                    Preview →
                  </span>
                </div>
              );
            })}

          </div>

        </aside>

      </main>

      {/* Create form modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowCreate(false)}
        >
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className={`${cardClass} w-full max-w-md gap-6`}
          >
            <div className="flex flex-col gap-1 border-b border-border pb-4">
              <h2 className="text-2xl font-extrabold tracking-tight uppercase text-foreground">
                New Form
              </h2>
              <p className="text-xs text-text-secondary uppercase tracking-wider">
                Give your form a name to get started
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
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
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
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
                className={`${buttonSecondaryClass} flex-1 bg-card border-border hover:bg-surface-hover text-foreground`}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowPublishModal(false)}
        >
          <div
            className="bg-card border border-border w-full max-w-md flex flex-col gap-0 shadow-2xl text-foreground rounded-lg overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
                <ExternalLink className="w-4 h-4 text-primary animate-pulse" /> Publish & Share
              </h2>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="text-text-secondary hover:text-foreground text-xs font-bold uppercase tracking-widest cursor-pointer bg-transparent border-none"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-6 px-6 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-foreground">
                    {modalIsPublished ? "Published" : "Unpublished"}
                  </p>
                  <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-0.5">
                    {modalIsPublished
                      ? "Your form is live and accepting responses."
                      : "Your form is a draft — not visible to the public."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleModalTogglePublish}
                  disabled={isPublishing}
                  className={`${modalIsPublished ? buttonPrimaryClass : buttonSecondaryClass + " bg-card border-border hover:bg-surface-hover text-foreground"} h-9 px-4 text-xs flex items-center gap-1.5`}
                >
                  {isPublishing ? "Updating…" : modalIsPublished ? "Unpublish" : "Publish Now"}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  Visibility
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["PUBLIC", "UNLISTED", "PRIVATE"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      disabled={modalIsPublished}
                      onClick={() => setModalVisibility(v)}
                      className={`border py-2 text-[10px] font-black uppercase tracking-widest transition-colors rounded ${
                        modalVisibility === v
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-border-active bg-card text-foreground"
                      } ${modalIsPublished ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  Expiration Date (optional)
                </label>
                <input
                  type="datetime-local"
                  disabled={modalIsPublished}
                  value={modalValidTill}
                  onClick={(e) => !modalIsPublished && e.currentTarget.showPicker?.()}
                  onChange={(e) => setModalValidTill(e.target.value)}
                  className={`${inputClass} text-xs ${modalIsPublished ? "opacity-40 cursor-not-allowed" : ""}`}
                />
              </div>

              {/* Password Protection */}
              {modalVisibility !== "PRIVATE" && (
                <div className="flex flex-col gap-3 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                        Password Protection
                      </label>
                      <p className="text-[9px] text-text-secondary uppercase tracking-wider mt-0.5">
                        Require respondents to enter a password to access the form.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      disabled={modalIsPublished}
                      checked={modalIsPasswordProtected}
                      onChange={(e) => setModalIsPasswordProtected(e.target.checked)}
                      className={`w-4 h-4 accent-[#FF6B35] cursor-pointer ${modalIsPublished ? "opacity-40 cursor-not-allowed" : ""}`}
                    />
                  </div>
                  {modalIsPasswordProtected && (
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="password"
                        disabled={modalIsPublished}
                        placeholder="Enter access password"
                        value={modalPassword}
                        onChange={(e) => setModalPassword(e.target.value)}
                        className={`${inputClass} text-xs ${modalIsPublished ? "opacity-40 cursor-not-allowed" : ""}`}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Whitelisted Domains for PRIVATE forms */}
              {modalVisibility === "PRIVATE" && (
                <div className="flex flex-col gap-3 border-t border-border pt-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    Allowed Email Domains
                  </label>
                  <p className="text-[9px] text-text-secondary uppercase tracking-wider -mt-1">
                    Only users logged in with email addresses belonging to these domains will be allowed to view and fill this form.
                  </p>
                  
                  {/* Domain list tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {modalAllowedDomains.length === 0 ? (
                      <span className="text-[10px] text-red-400 font-bold uppercase tracking-wide">
                        No domains whitelisted. Add at least one!
                      </span>
                    ) : (
                      modalAllowedDomains.map((dom) => (
                        <div
                          key={dom}
                          className="flex items-center gap-1.5 bg-[#FF6B35]/15 border border-[#FF6B35]/30 text-white text-[10px] font-bold px-2.5 py-1 rounded"
                        >
                          <span>{dom}</span>
                          <button
                            type="button"
                            disabled={modalIsPublished}
                            onClick={() => setModalAllowedDomains(prev => prev.filter(d => d !== dom))}
                            className={`text-[#FF6B35] hover:text-white transition-colors font-bold border-none bg-transparent cursor-pointer ${modalIsPublished ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
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
                      disabled={modalIsPublished}
                      placeholder="e.g. company.com"
                      value={modalNewDomainInput}
                      onChange={(e) => setModalNewDomainInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = modalNewDomainInput.trim().toLowerCase();
                          if (val && !modalAllowedDomains.includes(val)) {
                            setModalAllowedDomains([...modalAllowedDomains, val]);
                            setModalNewDomainInput("");
                          }
                        }
                      }}
                      className={`${inputClass} text-xs flex-1 ${modalIsPublished ? "opacity-40 cursor-not-allowed" : ""}`}
                    />
                    <button
                      type="button"
                      disabled={modalIsPublished}
                      onClick={() => {
                        const val = modalNewDomainInput.trim().toLowerCase();
                        if (val && !modalAllowedDomains.includes(val)) {
                          setModalAllowedDomains([...modalAllowedDomains, val]);
                          setModalNewDomainInput("");
                        }
                      }}
                      className={`px-3.5 bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-white font-bold text-xs uppercase tracking-widest rounded transition-all cursor-pointer ${modalIsPublished ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleModalSaveSettings}
                disabled={modalIsPublished || isPublishing}
                className={`${buttonSecondaryClass} bg-card border-border hover:bg-surface-hover text-foreground w-full h-10 text-xs ${modalIsPublished ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {modalIsPublished ? "Form is Live (Unpublish to Edit Settings)" : "Save Publish Settings"}
              </button>

              {modalIsPublished && (
                <div className="border-t border-border pt-4 flex flex-col gap-3">
                  <div className="flex border border-border rounded overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setModalShareTab("link")}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                        modalShareTab === "link"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-surface-hover bg-card text-foreground"
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" /> Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalShareTab("qr")}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                        modalShareTab === "qr"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-surface-hover bg-card text-foreground"
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
                        {modalLinkCopied ? "Copied!" : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                      </button>
                    </div>
                  )}

                  {modalShareTab === "qr" && qrCodeDataUrl && (
                    <div className="flex flex-col items-center gap-3 py-2">
                      <div className="border border-border p-4 bg-white rounded">
                        <img
                          src={qrCodeDataUrl}
                          alt="QR Code"
                          width={160}
                          height={160}
                          className="block"
                        />
                      </div>
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
              className={`${cardClass} w-full max-w-md gap-6 shadow-2xl animate-fade-in text-foreground border border-border`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1 border-b border-border pb-4">
                <h2 className="text-2xl font-extrabold tracking-tight uppercase text-error">
                  Delete Form?
                </h2>
                <p className="text-xs text-text-secondary uppercase tracking-wider">
                  This action is permanent and cannot be undone
                </p>
              </div>

              <p className="text-sm leading-relaxed text-text-secondary">
                Are you sure you want to permanently delete "{formToDelete?.title || "this form"}"? 
                This will purge all its associated answers, files, recordings, and media resources from the storage.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row mt-2">
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmationId)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold uppercase tracking-widest bg-error text-white hover:bg-error/90 h-11 px-4 py-2 transition-colors cursor-pointer flex-1 border-none shadow-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmationId(null)}
                  className={`${buttonSecondaryClass} bg-card border-border hover:bg-surface-hover text-foreground flex-1`}
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
