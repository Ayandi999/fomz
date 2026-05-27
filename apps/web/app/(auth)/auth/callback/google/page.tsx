"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "~/trpc/client";

function GoogleCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get("code");
    const utils = trpc.useUtils();
    
    // Prevent multiple parallel callback triggers in React Strict Mode
    const triggerRef = useRef(false);

    const { mutate: continueWithGoogle, error } = trpc.auth.continueWithGoogle.useMutation({
        onSuccess: async () => {
            await utils.auth.getUserInfoFromToken.invalidate();
            router.replace("/dashboard");
        }
    });

    useEffect(() => {
        if (code && !triggerRef.current) {
            triggerRef.current = true;
            continueWithGoogle({ code });
        }
    }, [code, continueWithGoogle]);

    if (error) {
        return (
            <div className="min-h-screen w-full flex flex-col justify-center items-center p-4">
                <div className="w-full max-w-md border-2 border-red-500 bg-background p-8 flex flex-col gap-6 text-center">
                    <h1 className="text-2xl font-extrabold uppercase tracking-tight text-red-500">Authentication Failed</h1>
                    <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                        {error.message || "An unexpected error occurred during Google authentication."}
                    </p>
                    <button 
                        onClick={() => router.replace("/sign-up")}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-widest bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 h-11 px-4 py-2 w-full transition-colors cursor-pointer"
                    >
                        Back to Signup
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md border-2 border-neutral-900 dark:border-neutral-100 bg-background p-8 flex flex-col gap-6 text-center">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-extrabold uppercase tracking-tight animate-pulse">Authenticating</h1>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Completing your secure sign-in with Google...</p>
                </div>
                <div className="flex justify-center py-4">
                    <div className="h-8 w-8 animate-spin rounded-none border-2 border-t-transparent border-neutral-900 dark:border-neutral-100"></div>
                </div>
            </div>
        </div>
    );
}

function GoogleCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex flex-col justify-center items-center p-4">
                <div className="w-full max-w-md border-2 border-neutral-900 dark:border-neutral-100 bg-background p-8 flex flex-col gap-6 text-center">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-extrabold uppercase tracking-tight animate-pulse">Loading</h1>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Please wait...</p>
                    </div>
                </div>
            </div>
        }>
            <GoogleCallbackContent />
        </Suspense>
    );
}

export default GoogleCallbackPage;
