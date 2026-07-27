import { ArrowLeft, Save, Sparkles, Download, ArrowUp, User as UserIcon, LogOut, Eye, Edit3, Sliders } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { QuestionItem, FieldType } from "~/app/dashboard/edit/[formId]/page";

export function EditHeader({ activeTab, setActiveTab, handleBackToDashboard, isEditingTitle, editedTitleVal, setEditedTitleVal, handleTitleSubmit, setIsEditingTitle, currentForm, selectedThemeKey, handleThemeChange, themes, saveStatus, isSaving, saveForm, isPublishing, publishStatus, publishFormAsync, handleDownloadCSV, mounted, showProfileMenu, setShowProfileMenu, handleLogout, setShowPublishPanel, user, setIsPreviewOpen, setPreviewStepIndex, setPreviewAnswers, questions, analytics, formId }: any) {
  return (
        <nav className="w-full bg-white/60 p-4 flex flex-col gap-4 border-b border-black/10 shrink-0">
          {/* Row 1 */}
          <div className="flex items-center justify-between">
            {/* Left side: Back to Dashboard, muted gray */}
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#666] hover:text-[#111] transition-colors duration-200 cursor-pointer bg-transparent border-none"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            {/* Center: Clickable form title rename */}
            <div className="flex items-center gap-2 max-w-md">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editedTitleVal}
                  onChange={(e) => setEditedTitleVal(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
                  autoFocus
                  className="bg-transparent border border-[#2563EB]/50 px-3 py-1 text-sm font-bold text-[#111] focus:outline-none rounded-none"
                />
              ) : (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="group flex items-center gap-2 text-sm font-bold tracking-tight text-[#111] hover:text-[#2563EB] transition-colors duration-200 bg-transparent border-none cursor-pointer"
                >
                  <span>{currentForm?.title || "Conversational Form Builder"}</span>
                  <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#666]" />
                </button>
              )}
            </div>

            {/* Right side: Export & dropdown actions */}
            <div className="flex items-center gap-3 relative">
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-none text-xs font-semibold border border-[#2563EB]/20 hover:border-[#2563EB]/60 hover:bg-[#2563EB]/10 text-[#2563EB] h-9 px-4 transition-all duration-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export
              </button>

              {/* Profile icon at the absolute right */}
              {mounted && (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="h-9 w-9 flex items-center justify-center border-none transition-all duration-200 cursor-pointer rounded-full bg-transparent"
                    title="User Profile Menu"
                  >
                    <UserIcon className="w-4 h-4 text-[#2563EB]" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white/60 border border-black/10 rounded-none shadow-2xl z-50 flex flex-col p-1.5 animate-fade-in">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowPublishPanel(true);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-[#666] hover:text-[#111] hover:bg-white rounded-none flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors duration-200"
                      >
                        <Sliders className="w-3.5 h-3.5 text-[#2563EB]" /> Settings
                      </button>
                      <div className="border-t border-black/10 w-full my-1.5"></div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-none flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors duration-200"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Hairline separate divider */}
          <div className="border-t border-black/10 w-full"></div>

          {/* Row 2 */}
          <div className="flex items-center justify-between">
            {/* Left side tabs: Builder, Analytics, Settings */}
            <div className="flex bg-transparent p-1 rounded-none shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("build")}
                className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer rounded-none border-none ${
                  activeTab === "build"
                    ? "bg-[#2563EB] text-white"
                    : "bg-transparent text-[#666] hover:text-[#111] hover:bg-black/5"
                }`}
              >
                Builder
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("analytics")}
                className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer rounded-none border-none ${
                  activeTab === "analytics"
                    ? "bg-[#2563EB] text-white"
                    : "bg-transparent text-[#666] hover:text-[#111] hover:bg-black/5"
                }`}
              >
                Analytics
              </button>
              <button
                type="button"
                onClick={() => setShowPublishPanel(true)}
                className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer rounded-none border-none bg-transparent text-[#666] hover:text-[#111] hover:bg-black/5"
              >
                Settings
              </button>

              {/* Theme Dropdown */}
              <div className="border-l border-black/10 h-4 mx-1"></div>
              <div className="relative flex items-center">
                <select
                  value={selectedThemeKey || ""}
                  onChange={(e) => handleThemeChange(e.target.value || null)}
                  className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none border-none bg-white/60 text-[#666] hover:text-[#111] hover:bg-black/5 outline-none"
                >
                  <option value="">Default Theme</option>
                  {themes?.map((t: any) => (
                    <option key={t.id} value={t.id} className="bg-white/60 text-[#111]">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right side: Preview and time stamp */}
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-[#666] tracking-wide font-medium hidden sm:inline">
                Last updated 2 min ago
              </span>
              {activeTab === "build" && (
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
                  className="h-9 px-4 text-xs flex items-center gap-1.5 bg-transparent hover:bg-black/5 text-[#111] rounded-none transition-all duration-200 border-none cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#666]" /> Preview
                </button>
              )}
            </div>
          </div>
        </nav>
  );
}