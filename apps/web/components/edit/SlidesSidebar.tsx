import { ListIcon, Plus } from "lucide-react";

import type { QuestionItem } from "~/app/dashboard/edit/[formId]/page";

interface SlidesSidebarProps {
  topLevelQuestions: QuestionItem[];
  activeIdx: number;
  setActiveIdx: (idx: number) => void;
  setShowAddContent: (show: boolean) => void;
}

export function SlidesSidebar({
  topLevelQuestions,
  activeIdx,
  setActiveIdx,
  setShowAddContent
}: SlidesSidebarProps) {
  return (
          <div className="w-64 shrink-0 flex flex-col border-r border-black/10 h-full overflow-hidden bg-white/40">
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-semibold text-[#111] flex items-center gap-1.5">
                    <ListIcon className="w-3.5 h-3.5 text-primary" /> Slides
                  </span>
                  <span className="text-[12px] font-medium text-[#666]">
                    {topLevelQuestions.length} step{topLevelQuestions.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddContent(true)}
                  className="h-8 w-8 flex items-center justify-center rounded-none bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-all duration-200 cursor-pointer border-none shadow-md shadow-[#2563EB]/20 hover:scale-[1.05]"
                  title="Add Step"
                >
                  <Plus className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="border-t border-black/10 w-full my-1"></div>

              {topLevelQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-[10px] text-[#888] uppercase tracking-wider text-center">
                    No slides
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                  {topLevelQuestions.map((q, idx) => (
                    <button
                      key={q.id || q.clientTempId}
                      onClick={() => setActiveIdx(idx)}
                      className={`w-full text-left border flex flex-col transition-all duration-300 rounded-none cursor-pointer origin-center animate-in fade-in slide-in-from-bottom duration-300 ease-out ${
                        activeIdx === idx 
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10 p-3 min-h-[5.2rem] justify-between gap-1.5" 
                          : "border-black/10 hover:border-black/10-active bg-white/80 hover:bg-black/5 hover:scale-[1.01] hover:shadow-md hover:bg-black/5/80 hover:shadow-black/20 p-2.5 min-h-[3.2rem] justify-center gap-0.5"
                      }`}
                    >
                      <span className={`text-[12px] font-medium uppercase tracking-wider ${
                        activeIdx === idx ? "text-primary" : "text-[#888]"
                      }`}>
                        {idx + 1}
                      </span>
                      <p className={`font-bold uppercase tracking-tight text-[#111] leading-tight ${
                        activeIdx === idx ? "text-xs line-clamp-2" : "text-[10px] line-clamp-1"
                      }`}>
                        {q.label || `Untitled Slide`}
                      </p>
                      {activeIdx === idx && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#888] mt-0.5 animate-fade-in">
                          {q.fieldType.replace("_", " ").toLowerCase()}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
  );
}
