"use client";

import { useSearchParams } from "next/navigation";

function VerifyPendingPage() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";
    const type = searchParams.get("type") || "signup";

    return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md border-2 border-neutral-900 dark:border-neutral-100 bg-background p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-1 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
                    <h1 className="text-3xl font-extrabold tracking-tight uppercase">
                        {type === "reset" ? "Reset Password" : "Verify Email"}
                    </h1>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {type === "reset" ? "Check your inbox to reset password" : "Check your inbox to complete signup"}
                    </p>
                </div>

                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {type === "reset" ? "Reset Link Sent To:" : "Verification Link Sent To:"}
                        </span>
                        <div className="bg-neutral-100 dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 px-4 py-3 text-center font-extrabold text-neutral-900 dark:text-white rounded-none break-all select-all text-sm tracking-wide">
                            {email}
                        </div>
                    </div>

                    <div className="border-t-2 border-neutral-900 dark:border-neutral-100 pt-4 flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-white">
                            Action Required
                        </span>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest leading-relaxed">
                            {type === "reset" 
                                ? "Click the button inside the email to reset your password. You will be redirected automatically to the password reset page." 
                                : "Click the button inside the email to instantly activate your account. You will be redirected automatically to your dashboard."
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VerifyPendingPage;
