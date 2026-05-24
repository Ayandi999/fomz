"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "~/trpc/client";
import Link from "next/link";

function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const code = searchParams.get("code") || "";
  const router = useRouter();

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (!email || !code) {
      setErrorMsg("Invalid reset link. Please check your email and try again.");
      setLoading(false);
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        email,
        code,
        newPassword,
      });
      router.push("/sign-in?success=reset");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border-2 border-neutral-900 dark:border-neutral-100 bg-background p-8 flex flex-col gap-6"
      >
        <div className="flex flex-col gap-1 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight uppercase">Reset Password</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Enter your new password below
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-100 dark:bg-red-950/30 border-2 border-red-500 text-red-800 dark:text-red-400 p-3 text-xs font-bold uppercase tracking-wider text-center">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 bg-neutral-100 dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">
            Resetting password for:<br/>
            <strong className="text-neutral-900 dark:text-white break-all text-xs tracking-wide">{email}</strong>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              New Password
            </label>
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex h-10 w-full rounded-none border-2 border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-neutral-900 dark:focus-visible:border-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
              type="password"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Confirm Password
            </label>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex h-10 w-full rounded-none border-2 border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-neutral-900 dark:focus-visible:border-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
              type="password"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-widest bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 h-11 px-4 py-2 w-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground uppercase tracking-wider text-center border-t-2 border-neutral-900 dark:border-neutral-100 pt-4">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className="font-bold text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default ResetPasswordPage;
