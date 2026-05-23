"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "~/hooks/api/auth/useUser";

type FormStatus = "draft" | "published";

type FormItem = {
  id: string;
  title: string;
  status: FormStatus;
  responses: number;
  updatedAt: string;
};

const INITIAL_FORMS: FormItem[] = [
  {
    id: "1",
    title: "Customer feedback survey",
    status: "published",
    responses: 128,
    updatedAt: "2 days ago",
  },
  {
    id: "2",
    title: "Event registration",
    status: "draft",
    responses: 0,
    updatedAt: "5 days ago",
  },
];

const inputClass =
  "flex h-10 w-full rounded-none border-2 border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-neutral-900 dark:focus-visible:border-neutral-100 disabled:cursor-not-allowed disabled:opacity-50";

const buttonPrimaryClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-widest bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 h-11 px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const buttonSecondaryClass =
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-widest border-2 border-neutral-900 dark:border-neutral-100 bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 h-11 px-4 py-2 transition-colors";

const cardClass =
  "border-2 border-neutral-900 dark:border-neutral-100 bg-background p-6 flex flex-col gap-4";

function StatusBadge({ status }: { status: FormStatus }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border-2 ${
        status === "published"
          ? "border-neutral-900 dark:border-neutral-100 bg-neutral-900 text-white dark:bg-white dark:text-black"
          : "border-neutral-400 dark:border-neutral-600 text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { user, isLoading, isFetched } = useUser();
  const router = useRouter();

  const [forms, setForms] = useState<FormItem[]>(INITIAL_FORMS);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (isFetched && !isLoading && !user?.id) {
      router.replace("/sign-in");
    }
  }, [user, isLoading, isFetched, router]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    setForms((prev) => [
      {
        id: crypto.randomUUID(),
        title,
        status: "draft",
        responses: 0,
        updatedAt: "Just now",
      },
      ...prev,
    ]);
    setNewTitle("");
    setShowCreate(false);
  };

  const handleDelete = (id: string) => {
    setForms((prev) => prev.filter((f) => f.id !== id));
  };

  if (isLoading || !user?.id) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center p-4">
        <div className={`${cardClass} w-full max-w-md items-center`}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  const publishedCount = forms.filter((f) => f.status === "published").length;
  const totalResponses = forms.reduce((sum, f) => sum + f.responses, 0);

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 py-8">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* Header */}
        <header className={cardClass}>
          <div className="flex flex-col gap-1 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight uppercase">
                Dashboard
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                Welcome back, {user.fullName ?? user.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className={`${buttonPrimaryClass} w-full sm:w-auto`}
            >
              + New Form
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border-2 border-neutral-300 dark:border-neutral-700 p-4 flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Forms
              </span>
              <span className="text-2xl font-extrabold">{forms.length}</span>
            </div>
            <div className="border-2 border-neutral-300 dark:border-neutral-700 p-4 flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Published
              </span>
              <span className="text-2xl font-extrabold">{publishedCount}</span>
            </div>
            <div className="border-2 border-neutral-300 dark:border-neutral-700 p-4 flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Responses
              </span>
              <span className="text-2xl font-extrabold">{totalResponses}</span>
            </div>
          </div>
        </header>

        {/* Forms list */}
        <section className={cardClass}>
          <div className="flex flex-col gap-1 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
            <h2 className="text-xl font-extrabold tracking-tight uppercase">
              Your Forms
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Create, edit, and share conversational forms
            </p>
          </div>

          {forms.length === 0 ? (
            <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-8 flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                No forms yet — create your first one
              </p>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className={buttonPrimaryClass}
              >
                Create Form
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {forms.map((form) => (
                <li
                  key={form.id}
                  className="border-2 border-neutral-300 dark:border-neutral-700 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:border-neutral-900 dark:hover:border-neutral-100 transition-colors"
                >
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold uppercase tracking-tight truncate">
                        {form.title}
                      </h3>
                      <StatusBadge status={form.status} />
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {form.responses} responses · Updated {form.updatedAt}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button type="button" className={`${buttonSecondaryClass} h-9 px-3 text-xs`}>
                      Edit
                    </button>
                    <button type="button" className={`${buttonSecondaryClass} h-9 px-3 text-xs`}>
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(form.id)}
                      className={`${buttonSecondaryClass} h-9 px-3 text-xs border-red-600 dark:border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Create form modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setShowCreate(false)}
        >
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className={`${cardClass} w-full max-w-md gap-6`}
          >
            <div className="flex flex-col gap-1 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
              <h2 className="text-2xl font-extrabold tracking-tight uppercase">
                New Form
              </h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Give your form a name to get started
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Form Title
              </label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. Product launch survey"
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="submit" className={`${buttonPrimaryClass} flex-1`}>
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className={`${buttonSecondaryClass} flex-1`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
