"use client";

import { useState } from "react";
import Link from "next/link";
import { useSignin } from "~/hooks/api/auth/useSignin";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { siginInUserWithEmailAndPasswordAsync } = useSignin();
  const { data: googleOAuthUrl } = trpc.auth.getGoogleOAuthUrl.useQuery();
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id } = await siginInUserWithEmailAndPasswordAsync({
      email,
      password,
    });
    const callbackUrl = searchParams.get("callbackUrl");
    router.replace(callbackUrl || "/dashboard");
  };

  const handleGoogleSignIn = () => {
    if (googleOAuthUrl?.url) {
      window.location.href = googleOAuthUrl.url;
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
          <h1 className="text-2xl font-black text-white tracking-tight mt-2 flex items-center gap-1.5 justify-center">
            Sign In
          </h1>
          <p className="text-[10px] text-[#A1A1A1] uppercase tracking-widest font-black">
            Welcome back — enter your credentials
          </p>
        </div>

        {success === "reset" && (
          <div className="bg-[#FF6B35]/10 border border-[#FF6B35] text-white p-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-center flex items-center gap-2 justify-center">
            <ShieldCheck className="w-4 h-4 text-[#FF6B35]" /> Password reset successful! Please sign in.
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
              placeholder="e.g. you@company.com"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#FF6B35]">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B35] transition-colors placeholder:text-[#444] disabled:opacity-50 disabled:cursor-not-allowed"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex justify-end mt-1">
            <Link
              href="/forgot-password"
              className="text-[11px] font-black uppercase tracking-widest text-[#A1A1A1] hover:text-white underline underline-offset-4 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            className="w-full py-3.5 bg-[#FF6B35] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#FF6B35]/90 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B35]/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign In <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center my-1.5">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-widest text-[#444]">Or</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleSignIn}
            disabled={!googleOAuthUrl?.url}
            className="w-full py-3.5 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[#A1A1A1] hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with Google
          </button>
        </div>

        <p className="text-[10px] text-[#A1A1A1] uppercase tracking-widest font-black text-center border-t border-white/5 pt-4">
          New here?{" "}
          <Link
            href="/sign-up"
            className="font-bold text-[#FF6B35] hover:underline underline-offset-4 transition-colors"
          >
            Sign up first
          </Link>
        </p>
      </form>
    </div>
  );
}

export default SigninPage;
