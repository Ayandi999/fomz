"use client";

import { useState } from "react";
import Link from "next/link";
import { useSignin } from "~/hooks/api/auth/useSignin";
import { useRouter } from "next/navigation";

function signinpage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { siginInUserWithEmailAndPasswordAsync } = useSignin();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id } = await siginInUserWithEmailAndPasswordAsync({
      email,
      password,
    });
    //redirect to dashboard
    router.replace('/dashboard');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border-2 border-neutral-900 dark:border-neutral-100 bg-background p-8 flex flex-col gap-6"
      >
        <div className="flex flex-col gap-1 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight uppercase">Sign In</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Welcome back — enter your credentials
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-10 w-full rounded-none border-2 border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-neutral-900 dark:focus-visible:border-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
              type="email"
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-10 w-full rounded-none border-2 border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-neutral-900 dark:focus-visible:border-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-widest bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 h-11 px-4 py-2 w-full transition-colors"
        >
          Sign In
        </button>

        <p className="text-xs text-muted-foreground uppercase tracking-wider text-center border-t-2 border-neutral-900 dark:border-neutral-100 pt-4">
          New here?{" "}
          <Link
            href="/sign-up"
            className="font-bold text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
          >
            Sign up first
          </Link>
        </p>
      </form>
    </div>
  );
}

export default signinpage;
