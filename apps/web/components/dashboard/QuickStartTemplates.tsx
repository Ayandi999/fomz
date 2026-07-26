import { FileText, Phone, BookOpen, HelpCircle } from "lucide-react";

interface QuickStartTemplatesProps {
  onCreateFromTemplate: (templateName: string) => void;
}

export function QuickStartTemplates({ onCreateFromTemplate }: QuickStartTemplatesProps) {
  const templates = [
    { name: "Feedback", desc: "Customer review", icon: FileText, details: "Collect product reviews" },
    { name: "Contact", desc: "Lead collection", icon: Phone, details: "Grow your list easily" },
    { name: "Survey", desc: "Product research", icon: BookOpen, details: "Gather user feedback" },
    { name: "Quiz", desc: "Trivia and test", icon: HelpCircle, details: "Engage your audience" },
  ];

  return (
    <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
      <div className="flex items-center gap-2 border-b border-border/30 pb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white">
          Quick Start
        </h2>
        <span className="text-[10px] px-2 py-0.5 bg-[#161616] text-[#666] font-bold rounded-full">
          {templates.length} templates
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {templates.map((tmpl) => {
          const IconComp = tmpl.icon;
          return (
            <div
              key={tmpl.name}
              onClick={() => onCreateFromTemplate(tmpl.name)}
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
  );
}
