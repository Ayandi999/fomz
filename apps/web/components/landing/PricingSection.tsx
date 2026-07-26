"use client";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <section 
      id="pricing" 
      className="animate-on-scroll opacity-0 translate-y-16 py-32 bg-white/20 border-y border-black/10 transition-all duration-1000 transform relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center relative z-10">
        
        <h2 className="text-[40px] font-bold text-[#111] text-center">
          Simple pricing. No surprises.
        </h2>
        <p className="text-[18px] text-gray-600 text-center max-w-[480px] mt-4">
          Start free. Upgrade when you're ready.
        </p>

        {/* Toggle */}
        <div className="mt-8 mb-12 flex items-center gap-2 bg-white/60 p-1 rounded-full border border-black/5">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${!isYearly ? 'bg-[#2563EB] text-white shadow-md' : 'bg-transparent text-gray-500 hover:text-black'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${isYearly ? 'bg-[#2563EB] text-white shadow-md' : 'bg-transparent text-gray-500 hover:text-black'}`}
          >
            Yearly
            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${isYearly ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-400'}`}>Save 20%</span>
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full text-left">
          
          {/* Starter */}
          <div className={`bg-white/60 rounded-[20px] p-8 border border-black/5 flex flex-col shadow-lg transition-all duration-300 ${prefersReducedMotion ? '' : 'hover:border-black/10 hover:-translate-y-1 hover:shadow-xl'}`}>
            <h3 className="text-[24px] font-bold text-[#111]">Starter</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-[36px] font-bold text-[#111]">$0</span>
              <span className="text-[16px] text-gray-500">/mo</span>
            </div>
            <p className="text-[14px] text-gray-500 mt-1 mb-6 border-b border-black/5 pb-6">Free forever</p>
            <ul className="flex-1 flex flex-col gap-3">
              {['3 forms', '100 responses/mo', 'Basic analytics', 'Formz branding'].map((feat, i) => (
                <li key={i} className="flex items-center text-[15px] text-gray-600 leading-[2.2]">
                  <Check className="w-4 h-4 text-[#22C55E] mr-3 shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <button className="w-full mt-8 py-3 px-6 rounded-none border border-black/10 bg-transparent text-[#111] font-bold transition-colors cursor-pointer hover:bg-white hover:border-black/20 focus:ring-2 focus:ring-black/10 outline-none">
              Get Started
            </button>
          </div>

          {/* Pro */}
          <div className={`order-first lg:order-none relative bg-white/60 rounded-[20px] p-8 border-x border-b border-t-[3px] border-x-black/5 border-b-black/5 border-t-[#2563EB] flex flex-col shadow-lg transition-all duration-300 ${prefersReducedMotion ? '' : 'hover:scale-[1.02] hover:-translate-y-1'}`}
               style={!prefersReducedMotion ? { boxShadow: "0 0 40px rgba(255,107,53,0.08)" } : {}}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white text-[12px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
              ★ Most Popular
            </div>
            <h3 className="text-[24px] font-bold text-[#111] mt-2">Pro</h3>
            <div className="mt-2 flex items-baseline gap-1 relative overflow-hidden h-12">
              <div className={`transition-transform duration-300 absolute inset-0 flex items-baseline gap-1 ${isYearly ? '-translate-y-full' : 'translate-y-0'}`}>
                <span className="text-[36px] font-bold text-[#111]">$12</span>
                <span className="text-[16px] text-gray-500">/mo</span>
              </div>
              <div className={`transition-transform duration-300 absolute inset-0 flex items-baseline gap-1 ${isYearly ? 'translate-y-0' : 'translate-y-full'}`}>
                <span className="text-[36px] font-bold text-[#111]">$9</span>
                <span className="text-[16px] text-gray-500">/mo</span>
              </div>
            </div>
            <p className="text-[14px] text-gray-500 mt-1 mb-6 border-b border-black/5 pb-6">Billed {isYearly ? 'yearly' : 'monthly'}</p>
            <ul className="flex-1 flex flex-col gap-3">
              {['Unlimited forms', 'Unlimited responses', 'Advanced analytics', 'Custom branding', 'Logic & branching', 'File uploads', 'API access', 'Webhooks'].map((feat, i) => (
                <li key={i} className="flex items-center text-[15px] text-gray-600 leading-[2.2]">
                  <Check className="w-4 h-4 text-[#22C55E] mr-3 shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <button className="w-full mt-8 py-3 px-6 rounded-none bg-[#2563EB] text-white text-[14px] font-bold transition-all cursor-pointer hover:brightness-110 hover:shadow-[0_4px_20px_rgba(255,107,53,0.3)] focus:ring-2 focus:ring-[#2563EB]/50 outline-none">
              Start Free Trial →
            </button>
          </div>

          {/* Team */}
          <div className={`md:col-span-2 lg:col-span-1 bg-white/60 rounded-[20px] p-8 border border-black/5 flex flex-col shadow-lg transition-all duration-300 ${prefersReducedMotion ? '' : 'hover:border-black/10 hover:-translate-y-1 hover:shadow-xl'}`}>
            <h3 className="text-[24px] font-bold text-[#111]">Team</h3>
            <div className="mt-2 flex items-baseline gap-1 relative overflow-hidden h-12">
              <div className={`transition-transform duration-300 absolute inset-0 flex items-baseline gap-1 ${isYearly ? '-translate-y-full' : 'translate-y-0'}`}>
                <span className="text-[36px] font-bold text-[#111]">$39</span>
                <span className="text-[16px] text-gray-500">/mo</span>
              </div>
              <div className={`transition-transform duration-300 absolute inset-0 flex items-baseline gap-1 ${isYearly ? 'translate-y-0' : 'translate-y-full'}`}>
                <span className="text-[36px] font-bold text-[#111]">$31</span>
                <span className="text-[16px] text-gray-500">/mo</span>
              </div>
            </div>
            <p className="text-[14px] text-gray-500 mt-1 mb-6 border-b border-black/5 pb-6">Billed {isYearly ? 'yearly' : 'monthly'}</p>
            <ul className="flex-1 flex flex-col gap-3">
              {['Everything in Pro', '5 team members', 'SSO & SAML', 'Priority support', 'Dedicated onboarding'].map((feat, i) => (
                <li key={i} className="flex items-center text-[15px] text-gray-600 leading-[2.2]">
                  <Check className="w-4 h-4 text-[#22C55E] mr-3 shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <button className="w-full mt-8 py-3 px-6 rounded-none border border-black/10 bg-transparent text-[#111] font-bold transition-colors cursor-pointer hover:bg-white hover:border-black/20 focus:ring-2 focus:ring-black/10 outline-none">
              Contact Sales
            </button>
          </div>

        </div>
        
        <p className="mt-12 text-center text-gray-500 text-[11px] uppercase tracking-wider font-bold max-w-2xl border border-black/5 bg-white/60 px-6 py-4 rounded-none shadow-md">
          * By decree of Lord Gwyn-first lord of cinder and king of Anor Londo:<br/> These features are all available for free to all common non-hollow folks of Anor Londo. Use all features to your heart's content.
        </p>
      </div>
    </section>
  );
}
