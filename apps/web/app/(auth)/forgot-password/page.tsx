"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import Link from "next/link";
import { ArrowRight, AlertCircle } from "lucide-react";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      await forgotPasswordMutation.mutateAsync({ email });
      router.push(`/verify-pending?email=${encodeURIComponent(email)}&type=reset`);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col justify-center items-center p-6 relative overflow-hidden select-none font-sans">
      
      {/* Background ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-48 left-1/4 w-[450px] h-[450px] bg-[#FF6B35]/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-48 right-1/4 w-[400px] h-[400px] bg-[#FF6B35]/4 rounded-full blur-[140px] animate-pulse" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/[0.02] backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col gap-6 relative z-10"
      >
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2 border-b border-white/5 pb-5">
          <img src="/som.svg" alt="Formz App Logo" className="h-9 w-auto" />
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            Forgot Password
          </h1>
          <p className="text-[10px] text-[#A1A1A1] uppercase tracking-widest font-black">
            Enter your email to receive a reset link
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-center flex items-center gap-2 justify-center">
            <AlertCircle className="w-4 h-4 text-red-500" /> {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#FF6B35]">
              Email Address
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B35] transition-colors placeholder:text-[#444] disabled:opacity-50 disabled:cursor-not-allowed"
              type="email"
              placeholder="e.g. name@company.com"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#FF6B35] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#FF6B35]/90 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B35]/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Email"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] text-[#A1A1A1] uppercase tracking-widest font-black text-center border-t border-white/5 pt-4">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className="font-bold text-[#FF6B35] hover:underline underline-offset-4 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default ForgotPasswordPage;
