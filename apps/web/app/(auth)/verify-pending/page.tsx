"use client";

import { useSearchParams } from "next/navigation";

function VerifyPendingPage() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md border-2 border-neutral-900 dark:border-neutral-100 bg-background p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-1 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
                    <h1 className="text-3xl font-extrabold tracking-tight uppercase">Verify Email</h1>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Almost there — check your inbox
                    </p>
                </div>

                <div className="flex flex-col gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <p>
                        We sent a secure **instant-verification link** to your email:
                    </p>
                    <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-center font-bold text-neutral-900 dark:text-white rounded-none break-all select-all">
                        {email}
                    </div>
                    <p className="text-sm font-medium uppercase tracking-wider text-neutral-900 dark:text-white mt-2">
                        👉 Please click the button inside the email to instantly activate your account and access your dashboard.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default VerifyPendingPage;
