export function Footer() {
  return (
    <footer className="bg-transparent py-20 text-gray-600 border-t border-black/10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-12">
        
        <div className="col-span-2 flex flex-col gap-4">
          <img src="/som.svg" alt="Formz App Logo" className="h-9 w-auto self-start" />
          <p className="text-xs leading-relaxed text-gray-500 max-w-xs font-semibold">
            By legal decree of the Knights of Catarina & Solaire of Astora, this grossly incandescent property is licensed to all Hollows and Tarnished folk. \[T]/
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#2563EB]">Product</span>
          <a href="#problem" className="text-xs text-gray-500 hover:text-[#111] transition-colors">The Problem</a>
          <a href="#features" className="text-xs text-gray-500 hover:text-[#111] transition-colors">Conversational Flow</a>
          <a href="#demo" className="text-xs text-gray-500 hover:text-[#111] transition-colors">Interactive Demo</a>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#2563EB]">Developer</span>
          <span className="text-xs text-gray-500 hover:text-[#111] transition-colors cursor-pointer">Documentation</span>
          <span className="text-xs text-gray-500 hover:text-[#111] transition-colors cursor-pointer">Guides & APIs</span>
          <span className="text-xs text-gray-500 hover:text-[#111] transition-colors cursor-pointer">Status Updates</span>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#2563EB]">Legal</span>
          <span className="text-xs text-gray-500 hover:text-[#111] transition-colors cursor-pointer">Privacy Policy</span>
          <span className="text-xs text-gray-500 hover:text-[#111] transition-colors cursor-pointer">Terms of Service</span>
          <span className="text-xs text-gray-500 hover:text-[#111] transition-colors cursor-pointer">Data Compliance</span>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 border-t border-black/10 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-black">
          &copy; {new Date().getFullYear()} Formz. All rights reserved.
        </span>
        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-black">
          Formz Conversational Technologies Inc.
        </span>
      </div>
    </footer>
  );
}
