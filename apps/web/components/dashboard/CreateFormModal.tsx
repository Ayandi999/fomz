import { useState } from "react";
import { cardClass, inputClass, buttonPrimaryClass, buttonSecondaryClass } from "./utils";

interface CreateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description?: string) => Promise<void>;
  isPending: boolean;
}

export function CreateFormModal({ isOpen, onClose, onSubmit, isPending }: CreateFormModalProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(newTitle, newDescription);
    setNewTitle("");
    setNewDescription("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
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
            onClick={onClose}
            disabled={isPending}
            className={`${buttonSecondaryClass} flex-1 bg-card border-border hover:bg-surface-hover text-foreground`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
