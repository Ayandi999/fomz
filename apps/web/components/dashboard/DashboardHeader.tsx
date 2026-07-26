"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, User as UserIcon } from "lucide-react";

interface DashboardHeaderProps {
  user: {
    firstName?: string;
    lastName?: string;
  } | null;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="w-full border-b border-border bg-[#0F0F0F]">
      <div className="w-full max-w-none px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <img src="/som.svg" alt="Fomz! App Logo" className="h-10 w-auto" />
        </div>
        <div className="flex items-center gap-4 relative z-50">
          {/* User Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 bg-secondary border-none hover:bg-surface-hover transition-all duration-200 p-1 pr-3 rounded-full cursor-pointer"
            >
              <div className="h-7 w-7 rounded-full bg-[#FF6B35] text-white font-bold text-xs flex items-center justify-center">
                {user?.firstName ? user.firstName.substring(0, 2).toUpperCase() : "AP"}
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Ayandip Pal"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl z-50 flex flex-col p-1.5 animate-fade-in">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    router.push("/dashboard");
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-lg flex items-center gap-2 border-none bg-transparent cursor-pointer transition-colors duration-200"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#FF6B35]" /> Workspace
                </button>
                <div className="border-t border-border w-full my-1.5"></div>
                <a
                  href="/sign-in"
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 border-none bg-transparent cursor-pointer no-underline transition-colors duration-200"
                >
                  Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
