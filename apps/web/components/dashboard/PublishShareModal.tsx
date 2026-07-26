import { useState, useEffect } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { ExternalLink, Link as LinkIcon, Copy, QrCode } from "lucide-react";
import { inputClass, buttonPrimaryClass, buttonSecondaryClass } from "./utils";
import { usePublishForm } from "~/hooks/api/forms/usePublishForm";

interface PublishShareModalProps {
  form: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedForm: any) => Promise<void>;
}

export function PublishShareModal({ form, isOpen, onClose, onSuccess }: PublishShareModalProps) {
  const { publishFormAsync, isPending: isPublishing } = usePublishForm();

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
    if (isOpen && form) {
      setModalIsPublished(!!form.isPublished);
      setModalVisibility(form.visibility || "UNLISTED");
      setModalValidTill(form.validTill ? new Date(form.validTill).toISOString().slice(0, 16) : "");
      setModalAllowedDomains(form.allowedDomains || []);
      setModalIsPasswordProtected(!!form.isPasswordProtected);
      setModalPassword(form.isPasswordProtected ? "••••••••" : "");
      setModalShareTab("link");

      if (form.slug) {
        const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${form.slug}`;
        QRCode.toDataURL(shareUrl, { width: 160, margin: 2 })
          .then((url) => setQrCodeDataUrl(url))
          .catch((err) => console.error("Failed to generate QR code", err));
      } else {
        setQrCodeDataUrl("");
      }
    }
  }, [isOpen, form]);

  if (!isOpen || !form) return null;

  const handleModalTogglePublish = async () => {
    if (modalIsPasswordProtected && !modalPassword.trim()) {
      toast.error("Please enter a password when password protection is enabled.");
      return;
    }
    const nextPublishState = !modalIsPublished;
    const publishToastId = toast.loading(nextPublishState ? "Publishing form..." : "Unpublishing form...");
    try {
      const finalPassword = (modalPassword === "••••••••" || !modalPassword) ? undefined : modalPassword;
      await publishFormAsync({
        formId: form.id,
        isPublished: nextPublishState,
        visibility: modalVisibility,
        validTill: modalValidTill ? new Date(modalValidTill) : null,
        allowedDomains: modalAllowedDomains,
        isPasswordProtected: modalIsPasswordProtected,
        password: finalPassword,
      });
      setModalIsPublished(nextPublishState);
      toast.success(nextPublishState ? "Form published successfully!" : "Form unpublished.", { id: publishToastId });
      await onSuccess({ ...form, isPublished: nextPublishState });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update publish state.", { id: publishToastId });
    }
  };

  const handleModalSaveSettings = async () => {
    if (modalIsPasswordProtected && !modalPassword.trim()) {
      toast.error("Please enter a password when password protection is enabled.");
      return;
    }
    const publishToastId = toast.loading("Saving publish settings...");
    try {
      const finalPassword = (modalPassword === "••••••••" || !modalPassword) ? undefined : modalPassword;
      await publishFormAsync({
        formId: form.id,
        isPublished: modalIsPublished,
        visibility: modalVisibility,
        validTill: modalValidTill ? new Date(modalValidTill) : null,
        allowedDomains: modalAllowedDomains,
        isPasswordProtected: modalIsPasswordProtected,
        password: finalPassword,
      });
      toast.success("Publish settings saved!", { id: publishToastId });
      await onSuccess(form);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings.", { id: publishToastId });
    }
  };

  const handleModalCopyLink = () => {
    if (!form.slug) return;
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${form.slug}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setModalLinkCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setModalLinkCopied(false), 2000);
    }).catch((err) => {
      console.error(err);
      toast.error("Failed to copy link.");
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border w-full max-w-md flex flex-col gap-0 shadow-2xl text-foreground rounded-none overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
            <ExternalLink className="w-4 h-4 text-primary animate-pulse" /> Publish & Share
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-foreground text-xs font-bold uppercase tracking-widest cursor-pointer bg-transparent border-none"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-6 px-6 py-6 overflow-y-auto max-h-[75vh]">
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
            <select
              disabled={modalIsPublished}
              value={modalVisibility}
              onChange={(e) => setModalVisibility(e.target.value as any)}
              className={`${inputClass} text-xs ${modalIsPublished ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <option value="PUBLIC">PUBLIC</option>
              <option value="UNLISTED">UNLISTED</option>
              <option value="PRIVATE">PRIVATE</option>
            </select>
            <p className="text-[9px] text-text-secondary uppercase tracking-wider mt-1">
              {modalVisibility === "PUBLIC" && "Anyone can find and fill this form."}
              {modalVisibility === "UNLISTED" && "Only people with the link can access."}
              {modalVisibility === "PRIVATE" && "Form is hidden from all respondents."}
            </p>
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
                  className={`w-4 h-4 accent-[#2563EB] cursor-pointer ${modalIsPublished ? "opacity-40 cursor-not-allowed" : ""}`}
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
                      className="flex items-center gap-1.5 bg-[#2563EB]/15 border border-[#2563EB]/30 text-white text-[10px] font-bold px-2.5 py-1 rounded"
                    >
                      <span>{dom}</span>
                      <button
                        type="button"
                        disabled={modalIsPublished}
                        onClick={() => setModalAllowedDomains(prev => prev.filter(d => d !== dom))}
                        className={`text-[#2563EB] hover:text-white transition-colors font-bold border-none bg-transparent cursor-pointer ${modalIsPublished ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
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
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/share/${form.slug}`}
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
  );
}
