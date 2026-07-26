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
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center gap-2 border-b border-border/30 pb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#111]">
          Quick Start
        </h2>
        <span className="text-[10px] px-2 py-0.5 bg-white/60 text-[#666] font-bold rounded-full">
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
              className="group/tmpl border-l-[3px] border-transparent bg-white/60 hover:bg-white hover:border-[#2563EB] p-6 rounded-none flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-black/5 group-hover/tmpl:bg-black/10 flex items-center justify-center shrink-0 transition-colors">
                  <IconComp className="w-4 h-4 text-[#2563EB]" />
                </div>
                <div className="flex flex-col min-w-0 gap-0.5">
                  <span className="text-sm font-bold text-[#111]">
                    {tmpl.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold truncate">
                    {tmpl.desc}
                  </span>
                </div>
              </div>
              
              <span className="hidden group-hover/tmpl:inline-block text-[13px] font-bold text-[#2563EB] animate-fade-in whitespace-nowrap shrink-0">
                Preview →
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
