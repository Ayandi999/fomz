"use client";

import { useEffect } from 'react';
import { useUser } from '../hooks/api/auth/useUser'
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && user.id) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-zinc-950 text-white font-sans">
        <p className="text-sm font-medium tracking-widest uppercase animate-pulse">Loading Streamyst...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-between bg-zinc-950 text-white font-sans antialiased">
      {/* Header / Nav */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent uppercase">
            Streamyst
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium hover:text-violet-400 transition-colors">
            Sign In
          </Link>
          <Link href="/sign-up" className="bg-white text-black text-sm font-bold px-4 py-2 hover:bg-zinc-200 transition-colors">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-4 max-w-3xl mx-auto py-16">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Create Conversational Forms <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            Effortlessly.
          </span>
        </h1>
        <p className="mt-6 text-zinc-400 text-lg sm:text-xl max-w-xl">
          Build engaging, interactive conversational forms and collect responses beautifully in real time.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/sign-up" className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 transition-colors text-sm uppercase tracking-wider">
            Create Free Form
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-500 uppercase tracking-widest">
        &copy; {new Date().getFullYear()} Streamyst. All rights reserved.
      </footer>
    </main>
  );
}

