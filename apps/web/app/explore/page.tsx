"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetExploreForms } from "~/hooks/api/forms/useGetExploreForms";
import { 
  FileText, Search, ArrowLeft, ExternalLink, MessageSquare, 
  Clock, User, Sparkles, AlertCircle, RefreshCw
} from "lucide-react";

const getColorAndInitials = (id: string, firstName?: string | null, lastName?: string | null) => {
  const colors = [
    "bg-red-500/10 text-red-400 border border-red-500/20",
    "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    "bg-pink-500/10 text-pink-400 border border-pink-500/20",
    "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIdx = Math.abs(hash) % colors.length;
  
  let initials = "FM";
  if (firstName && lastName) {
    initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  } else if (firstName) {
    initials = firstName.substring(0, 2).toUpperCase();
  }

  return {
    colorClass: colors[colorIdx]!,
    initials,
  };
};

export default function ExplorePage() {
  const { forms, isLoading, isError, refetch } = useGetExploreForms();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const filteredForms = (forms || []).filter((form) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      form.title.toLowerCase().includes(query) ||
      (form.description && form.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0F0F0F] text-foreground antialiased font-sans pb-16">
      
      {/* Navbar */}
      <header className="w-full border-b border-border bg-[#0F0F0F] sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/som.svg" alt="Fomz App Logo" className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/sign-in"
              className="text-xs font-bold uppercase tracking-widest text-[#A1A1A1] hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up"
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-widest transition-colors shadow-sm"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Main Explore Container */}
      <main className="w-full max-w-7xl mx-auto px-6 py-12 flex flex-col gap-10">
        
        {/* Back navigation */}
        <div className="flex items-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#A1A1A1] hover:text-white uppercase transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back Home
          </Link>
        </div>

        {/* Hero title block */}
        <div className="flex flex-col gap-3 max-w-2xl">
          <span className="text-xs uppercase tracking-widest text-[#FF6B35] font-black flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6B35] animate-pulse" /> Community Flows
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">
            Explore Fomz Creations.
          </h1>
          <p className="text-sm text-[#A1A1A1] mt-1 leading-relaxed">
            Browse and fill out published conversational layouts created by the Fomz community. Test features, leave feedback, and find inspiration.
          </p>
        </div>

        {/* Search Toolbar & Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-md bg-[#161616] border border-border rounded-xl p-1 flex items-center shadow-lg focus-within:border-primary/50 transition-colors">
            <Search className="w-4 h-4 text-[#666] ml-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search public forms..."
              className="w-full h-10 bg-transparent text-sm text-foreground focus:outline-none px-3 placeholder:text-[#666]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-wider font-bold mr-3 border-none bg-transparent cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center justify-center p-3 rounded-xl bg-[#161616] border border-border hover:border-primary/50 text-[#666] hover:text-white transition-all shadow-lg group disabled:opacity-50"
            title="Refresh Explore Feed"
          >
            <RefreshCw className={`w-5 h-5 ${(isRefreshing || isLoading) ? "animate-spin text-[#FF6B35]" : "group-hover:text-[#FF6B35]"}`} />
          </button>
        </div>

        {/* Loading and Error states */}
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#FF6B35] border-t-transparent animate-spin"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#666] animate-pulse">Loading explore board...</p>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-3 border border-red-500/20 bg-red-500/5 p-4 rounded-xl max-w-lg">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-xs font-semibold text-red-400">Failed to load public forms from community feed.</p>
          </div>
        )}

        {/* Form Card Grid */}
        {!isLoading && !isError && (
          <>
            {filteredForms.length === 0 ? (
              <div className="border border-dashed border-border rounded-2xl py-24 px-6 flex flex-col items-center justify-center gap-3 text-center bg-card/20 max-w-lg">
                <FileText className="w-8 h-8 text-neutral-600" />
                <p className="text-sm font-bold uppercase tracking-widest text-[#666]">No public forms found</p>
                <p className="text-xs text-[#555] uppercase tracking-wider -mt-1">
                  Try adjusting your search query or publish a form with "PUBLIC" visibility.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredForms.map((form) => {
                  const { colorClass, initials } = getColorAndInitials(form.id, form.creatorFirstName, form.creatorLastName);
                  return (
                    <a
                      key={form.id}
                      href={`/share/${form.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-[#161616] hover:bg-[#1A1A1A] border border-border/40 hover:border-primary/40 p-6 rounded-2xl flex flex-col justify-between gap-6 transition-all duration-300 cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:scale-[1.01] no-underline"
                    >
                      <div className="flex flex-col gap-4">
                        
                        {/* Header Details */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#0F0F0F] flex items-center justify-center shrink-0 border border-border/10">
                            <FileText className="w-5 h-5 text-[#FF6B35]" />
                          </div>
                          
                          {/* Response Count Pill */}
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider rounded-full shrink-0">
                            <MessageSquare className="w-3 h-3" /> {form.responses} responses
                          </div>
                        </div>

                        {/* Text Details */}
                        <div className="flex flex-col gap-1.5">
                          <h3 className="text-[18px] font-bold text-white tracking-tight group-hover:text-primary transition-colors truncate">
                            {form.title}
                          </h3>
                          <p className="text-[13px] text-[#A1A1A1] leading-relaxed line-clamp-3">
                            {form.description || "A dynamic conversational form flow created on Fomz."}
                          </p>
                        </div>
                      </div>

                      {/* Footer Details */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/30">
                        {/* Creator Info */}
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] uppercase ${colorClass}`}>
                            {initials}
                          </div>
                          <span className="text-[11px] font-bold tracking-wide text-zinc-400">
                            {form.creatorFirstName ? `${form.creatorFirstName} ${form.creatorLastName || ""}` : "Community Creator"}
                          </span>
                        </div>

                        {/* Date details */}
                        <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                          <Clock className="w-3.5 h-3.5" />
                          {form.createdAt ? new Date(form.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Recently"}
                        </div>
                      </div>

                    </a>
                  );
                })}
              </div>
            )}
          </>
        )}

      </main>

    </div>
  );
}
