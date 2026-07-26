import { AlertTriangle, HelpCircle, Laptop } from "lucide-react";

export function ProblemSection() {
  return (
    <section 
      id="problem" 
      className="relative animate-on-scroll opacity-0 translate-y-16 py-32 w-full px-8 md:px-16 lg:px-24 flex flex-col md:flex-row gap-16 transition-all duration-1000 transform items-start"
    >
      <div className="md:w-2/5 flex flex-col gap-4 md:sticky top-32">
        <span className="text-sm uppercase tracking-widest text-black">
          The standard form friction
        </span>
        <h2 className="text-5xl sm:text-7xl font-normal tracking-tight text-[#111] leading-[1.05]" style={{ fontFamily: 'var(--fredrika-font)' }}>
          Why standard forms fail to perform.
        </h2>
      </div>

      <div className="md:w-2/3 flex flex-col gap-8">
        {[
          {
            icon: <AlertTriangle className="w-6 h-6 text-black" />,
            title: "Visual Overwhelm",
            desc: "Throwing 20 fields at a visitor immediately spikes bounce rates. Attention is a rare commodity."
          },
          {
            icon: <HelpCircle className="w-6 h-6 text-black" />,
            title: "The abandonment wall",
            desc: "Without conditional pathings, users fill out irrelevant questions. They feel ignored, then they close the tab."
          },
          {
            icon: <Laptop className="w-6 h-6 text-black" />,
            title: "Dull and unengaging",
            desc: "Static fields, standard checkmarks, and simple buttons feel like filling out spreadsheet rows. It lacks personality."
          }
        ].map((item, idx) => (
          <div 
            key={idx} 
            className="group relative p-8 flex flex-col sm:flex-row gap-6 bg-transparent hover:scale-[0.98] hover:-rotate-1 transition-all duration-300 items-start cursor-default"
          >
            {/* Sketchy Background Border (Tight Spacing) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M -2,1 L 102,2" stroke="#111" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
              <path d="M -2,3 L 102,1" stroke="#111" strokeWidth="1" fill="none" opacity="0.6" vectorEffect="non-scaling-stroke" />
              
              <path d="M -2,99 L 102,97" stroke="#111" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
              <path d="M -2,97 L 102,99" stroke="#111" strokeWidth="1" fill="none" opacity="0.6" vectorEffect="non-scaling-stroke" />
              
              <path d="M 0,-5 L 0.5,105" stroke="#111" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
              <path d="M 0.2,-5 L 0.8,105" stroke="#111" strokeWidth="1" fill="none" opacity="0.6" vectorEffect="non-scaling-stroke" />
              
              <path d="M 100,-5 L 99.5,105" stroke="#111" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
              <path d="M 99.8,-5 L 99.2,105" stroke="#111" strokeWidth="1" fill="none" opacity="0.6" vectorEffect="non-scaling-stroke" />
            </svg>

            <div className="relative z-10 w-12 h-12 flex-shrink-0 flex items-center justify-center border-2 border-[#111]">
              {item.icon}
            </div>
            <div className="relative z-10 flex flex-col gap-2">
              <h4 className="text-xl font-bold text-[#111] tracking-wide" style={{ fontFamily: 'var(--fredrika-font)' }}>{item.title}</h4>
              <p className="text-base text-black leading-relaxed font-normal">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom sketchy line */}
      <svg className="absolute bottom-0 left-0 w-full h-4 pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M -5,50 L 105,40" stroke="#111" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M -5,40 L 105,50" stroke="#111" strokeWidth="1.5" fill="none" opacity="0.8" vectorEffect="non-scaling-stroke" />
      </svg>
    </section>
  );
}
