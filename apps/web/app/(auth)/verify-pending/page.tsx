"use client";

import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";

function VerifyPendingPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const type = searchParams.get("type") || "signup";

  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col justify-center items-center p-6 relative overflow-hidden select-none font-sans">
      
      {/* Background ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-48 left-1/4 w-[450px] h-[450px] bg-[#FF6B35]/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-48 right-1/4 w-[400px] h-[400px] bg-[#FF6B35]/4 rounded-full blur-[140px] animate-pulse" />
      </div>

      <div className="w-full max-w-md bg-white/[0.02] backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col gap-6 relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2 border-b border-white/5 pb-5">
          <img src="/som.svg" alt="Formz App Logo" className="h-9 w-auto" />
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            {type === "reset" ? "Reset Password" : "Verify Email"}
          </h1>
          <p className="text-[10px] text-[#A1A1A1] uppercase tracking-widest font-black">
            {type === "reset" ? "Check your inbox to reset password" : "Check your inbox to complete signup"}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B35]">
              {type === "reset" ? "Reset Link Sent To:" : "Verification Link Sent To:"}
            </span>
            <div className="bg-black/40 border border-white/10 px-4 py-3.5 text-center font-bold text-white rounded-xl break-all select-all text-sm tracking-wide">
              {email}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-1.5">
              <MailCheck className="w-4 h-4 text-[#FF6B35]" /> Action Required
            </span>
            <p className="text-[11px] text-[#A1A1A1] uppercase tracking-widest leading-relaxed font-semibold">
              {type === "reset" 
                ? "Click the button inside the email to reset your password. You will be redirected automatically to the password reset page." 
                : "Click the button inside the email to instantly activate your account. You will be redirected automatically to your dashboard."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyPendingPage;
