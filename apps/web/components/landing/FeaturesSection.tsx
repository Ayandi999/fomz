import { Sliders, Layout } from "lucide-react";

export function FeaturesSection() {
  return (
    <section 
      id="features" 
      className="animate-on-scroll opacity-0 translate-y-16 py-32 bg-transparent border-y border-black/10 transition-all duration-1000 transform"
    >
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-16">
        <div className="max-w-2xl flex flex-col gap-3">
          <span className="text-xs uppercase tracking-widest text-[#2563EB] font-black">
            The Formz advantage
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111] leading-[1.1]">
            Engineered for natural interaction.
          </h2>
        </div>

        <div className="flex flex-col gap-6">
          
          {/* Main horizontal flow display */}
          <div className="bg-white/60 p-8 sm:p-12 rounded-none flex flex-col lg:flex-row items-center justify-between gap-12 border border-black/5">
            <div className="max-w-md flex flex-col gap-5">
              <h3 className="text-2xl font-bold text-[#111] tracking-wide">Conversational Focus</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                By collapsing long forms down to a sequence of elegant one-field panels, respondents focus completely on one detail at a time. The result is higher engagement, minimal drop-offs, and incredibly clean data.
              </p>
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#2563EB] bg-[#2563EB]/5 px-3 py-1.5 rounded-none self-start mt-2">
                <span>✦ 60%+ average conversion improvement</span>
              </div>
            </div>
            <div className="w-full lg:w-96 aspect-video bg-white/80 border border-black/5 rounded-none flex items-center justify-center p-6 relative overflow-hidden">
              <div className="w-full flex flex-col gap-3">
                <span className="text-[9px] text-[#2563EB] font-black uppercase tracking-wider">Step 2: Experience</span>
                <div className="h-[2px] bg-[#2563EB] w-2/3 rounded-full mb-1" />
                <span className="text-xs font-bold text-[#111]">What type of form is this?</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-white/60 border border-[#2563EB]/30 p-2 rounded text-[10px] text-center text-[#111] font-semibold">Conversational</div>
                  <div className="bg-white/60 border border-black/5 p-2 rounded text-[10px] text-center text-gray-500">Traditional</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid of features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white/60 p-8 rounded-none flex flex-col gap-4 border border-black/5 hover:border-[#2563EB]/20 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-none bg-white/80 border border-black/5 flex items-center justify-center">
                <Sliders className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h3 className="text-lg font-bold text-[#111] tracking-wide">Smart Conditional Logic</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Route respondents dynamically along customized question paths based on prior answers. Deliver custom experiences for every visitor.
              </p>
            </div>

            <div className="bg-white/60 p-8 rounded-none flex flex-col gap-4 border border-black/5 hover:border-[#2563EB]/20 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-none bg-white/80 border border-black/5 flex items-center justify-center">
                <Layout className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h3 className="text-lg font-bold text-[#111] tracking-wide">Dynamic Style Customizer</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Control everything from active glows, alignment, spacing, gradients, and custom brand logos. Match your web application's identity completely.
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
