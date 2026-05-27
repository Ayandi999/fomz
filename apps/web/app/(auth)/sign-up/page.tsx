"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSignup } from "~/hooks/api/auth/useSignup";
import { trpc } from "~/trpc/client";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { createUserWithEmailAndPasswordAsync } = useSignup();
  const { data: googleOAuthUrl } = trpc.auth.getGoogleOAuthUrl.useQuery();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id } = await createUserWithEmailAndPasswordAsync({
        firstName,
        lastName,
        email,
        password,
      });
      router.replace(`/verify-pending?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      if (error.message?.includes("Too many requests")) {
        toast.error("Too many requests! Please try again later.");
      } else if (error.message?.includes("already exists")) {
        toast.error("A user with this email already exists!");
      } else {
        toast.error(error.message || "An internal server error occurred.");
      }
    }
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
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            Sign Up
          </h1>
          <p className="text-[10px] text-[#A1A1A1] uppercase tracking-widest font-black">
            Create an account to get started
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#FF6B35]">
                First Name
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B35] transition-colors placeholder:text-[#444]"
                placeholder="John"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#FF6B35]">
                Last Name
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B35] transition-colors placeholder:text-[#444]"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#FF6B35]">
              Email Address
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B35] transition-colors placeholder:text-[#444]"
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
              className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B35] transition-colors placeholder:text-[#444]"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            className="w-full py-3.5 bg-[#FF6B35] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#FF6B35]/90 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B35]/10 cursor-pointer"
          >
            Sign Up <ArrowRight className="w-4 h-4" />
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
          Already have an account?{" "}
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

export default SignupPage;