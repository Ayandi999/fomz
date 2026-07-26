import { Play, X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface VideoModalProps {
  videoOpen: boolean;
  setVideoOpen: Dispatch<SetStateAction<boolean>>;
}

export function VideoModal({ videoOpen, setVideoOpen }: VideoModalProps) {
  if (!videoOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
      <div className="relative w-full max-w-4xl bg-white border border-black/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 bg-white/60 border-b border-black/5">
          <span className="text-xs font-black uppercase tracking-widest text-[#FF6B35]">Formz Product Tour</span>
          <button 
            onClick={() => setVideoOpen(false)}
            className="p-1 rounded-full bg-black/5 text-gray-600 hover:text-black transition-colors hover:bg-black/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="aspect-video w-full bg-[#fdfbf7] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#FF6B35]/10 flex items-center justify-center border border-[#FF6B35]/20">
              <Play className="w-8 h-8 text-[#FF6B35]" />
            </div>
            <h3 className="text-lg font-bold text-[#111] tracking-wide">YouTube Tour Video Placeholder</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              We will link your live high-resolution YouTube product walkthrough video asset right here as soon as you upload it.
            </p>
            <button
              onClick={() => setVideoOpen(false)}
              className="mt-2 bg-[#FF6B35] text-white font-bold px-6 py-2.5 rounded-full hover:bg-[#FF6B35]/90 transition-all text-xs uppercase tracking-widest"
            >
              Close Player
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
