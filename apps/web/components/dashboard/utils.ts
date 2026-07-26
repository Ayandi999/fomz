export type FormStatus = "draft" | "published";

export const inputClass =
  "flex h-10 w-full rounded-none border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

export const buttonPrimaryClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-semibold bg-primary text-primary-foreground hover:bg-accent-hover h-10 px-4 py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer";

export const buttonSecondaryClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-medium border border-border bg-card text-foreground hover:bg-surface-hover h-10 px-4 py-2 transition-all duration-200 cursor-pointer";

export const cardClass =
  "border border-border bg-card rounded-none p-6 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.3)]";

export const isPlaceholderName = (name: string) => {
  return /^[A-Z0-9]{7}$/.test(name) || name.startsWith("temp_") || name.length === 0;
};

export const getColorAndInitials = (id: string) => {
  const colors = [
    "bg-red-500/10 text-red-400 border border-red-500/20",
    "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    "bg-blue-600/10 text-blue-500 border border-blue-600/20",
    "bg-pink-500/10 text-pink-400 border border-pink-500/20",
    "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  ];
  const initialsList = ["JD", "EM", "SK", "TH", "WL", "RN", "FB", "MT", "KP", "HL", "GR", "OC"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIdx = Math.abs(hash) % colors.length;
  const initialIdx = Math.abs(hash) % initialsList.length;
  return {
    colorClass: colors[colorIdx]!,
    initials: initialsList[initialIdx]!,
  };
};

export const getStatusDot = (id: string) => {
  const statuses = [
    { color: "bg-emerald-500", label: "Complete" },
    { color: "bg-emerald-500", label: "Complete" },
    { color: "bg-amber-500", label: "Partial" },
    { color: "bg-red-500", label: "Abandoned" },
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return statuses[Math.abs(hash) % statuses.length]!;
};

export const mockViews = (id: string, responses: number) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (responses || 0) * 3 + (Math.abs(hash) % 15) + 5;
};
