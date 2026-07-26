"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ArrowRight, Trash2, Plus, MoreVertical, Archive as ArchiveIcon } from "lucide-react";
import { isPlaceholderName, mockViews, buttonSecondaryClass, cardClass } from "./utils";

interface FormsListProps {
  forms: any[];
  sortBy: "recent" | "name" | "responses";
  setSortBy: (val: "recent" | "name" | "responses") => void;
  onCreateClick: () => void;
  onPublishClick: (form: any) => void;
  onDeleteForm: (formId: string) => Promise<void>;
}

export function FormsList({ forms, sortBy, setSortBy, onCreateClick, onPublishClick, onDeleteForm }: FormsListProps) {
  const router = useRouter();
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await onDeleteForm(id);
    setDeleteConfirmationId(null);
  };

  return (
    <section className="flex-1 flex flex-col gap-6 w-full">
      <div className="w-full flex items-center justify-between border-b border-border/30 pb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#111]">
          YOUR FORMS
        </h2>
        
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-tertiary">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent border-none text-xs font-semibold text-[#666] hover:text-[#111] transition-colors focus:outline-none cursor-pointer"
          >
            <option value="recent" className="bg-white text-[#111]">Recent</option>
            <option value="name" className="bg-white text-[#111]">Name</option>
            <option value="responses" className="bg-white text-[#111]">Responses</option>
          </select>
        </div>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white/60 p-12 rounded-none flex flex-col items-center justify-center gap-4 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
            <FileText className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-[#111]">No forms yet</h3>
            <p className="text-sm text-[#666] leading-snug">
              Create your first form to get started
            </p>
          </div>
          <button
            onClick={onCreateClick}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-none text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#2563EB]/90 h-9 px-4 transition-all duration-200 cursor-pointer shadow-sm border-none mt-2"
          >
            + Create Form →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {forms.map((form) => {
            const isTemp = isPlaceholderName(form.title);
            const viewsCount = mockViews(form.id, form.responses);
            return (
              <div
                key={form.id}
                onClick={() => router.push(`/dashboard/edit/${form.id}`)}
                className="group bg-white/60 hover:bg-white p-6 rounded-none flex flex-col gap-5 transition-all duration-200 cursor-pointer shadow-sm relative border border-transparent hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-none bg-black/5 flex items-center justify-center shrink-0 border border-black/10">
                      <FileText className="w-5 h-5 text-[#2563EB]" />
                    </div>
                    <div className="min-w-0 flex flex-col gap-0.5">
                      {isTemp ? (
                        <span className="text-[18px] font-bold text-[#666] italic">
                          Untitled Form
                        </span>
                      ) : (
                        <span className="text-[18px] font-bold text-[#111] truncate">
                          {form.title}
                        </span>
                      )}
                      <p className="text-[13px] text-[#666] mt-0.5">
                        {form.responses || 0} responses · Updated {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : "Just now"} · 2m avg completion
                      </p>
                    </div>
                  </div>

                  {/* 3 dots menu */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenDropdownId(openDropdownId === form.id ? null : form.id)}
                      className="p-1.5 text-zinc-500 hover:bg-black/5 hover:text-[#111] rounded-none transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openDropdownId === form.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white border border-black/10 rounded-none shadow-lg z-10 flex flex-col p-1 animate-fade-in">
                        <button
                          onClick={() => {
                            setOpenDropdownId(null);
                            // Archive action placeholder
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-[#444] hover:text-[#111] hover:bg-black/5 rounded-none flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors"
                        >
                          <ArchiveIcon className="w-3.5 h-3.5" /> Archive
                        </button>
                        <button
                          onClick={() => {
                            setOpenDropdownId(null);
                            setDeleteConfirmationId(form.id);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-none flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-border/10" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/edit/${form.id}`)}
                    className="h-8 px-4 text-xs font-semibold bg-white border border-black/10 text-[#444] hover:text-[#111] hover:bg-black/5 rounded-none transition-all duration-200 cursor-pointer"
                  >
                    Edit
                  </button>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPublishClick(form);
                    }}
                    className="h-8 px-4 text-xs bg-[#2563EB] hover:bg-[#2563EB]/90 text-white border-none font-semibold rounded-none flex items-center gap-1 cursor-pointer transition-all duration-200"
                  >
                    {form.isPublished ? "Share" : "Publish"} <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="ml-auto flex items-center">
                    {/* Status Badge moved here */}
                    {form.isPublished ? (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Published
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5 px-2.5 py-1 bg-zinc-500 border border-zinc-600 rounded-full">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                        </span>
                        Unpublished
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Extra Quiz card */}
          <div
            onClick={onCreateClick}
            className="group border border-dashed border-zinc-300 hover:border-[#2563EB] bg-transparent hover:bg-white/40 p-5 rounded-none flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer min-h-[80px]"
          >
            <Plus className="w-4 h-4 text-zinc-500 group-hover:text-[#2563EB] transition-colors" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-[#111] transition-colors">
              Add Extra Quiz
            </span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Popup */}
      {deleteConfirmationId && (() => {
        const formToDelete = forms.find(f => f.id === deleteConfirmationId);
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
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-widest bg-error text-white hover:bg-error/90 h-11 px-4 py-2 transition-colors cursor-pointer flex-1 border-none shadow-sm"
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
    </section>
  );
}
