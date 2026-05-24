"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSignup } from "~/hooks/api/auth/useSignup";
import { trpc } from "~/trpc/client";

function signuppage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { createUserWithEmailAndPasswordAsync } = useSignup();
    const { data: googleOAuthUrl } = trpc.auth.getGoogleOAuthUrl.useQuery();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const {id} = await createUserWithEmailAndPasswordAsync({
            firstName,
            lastName,
            email,
            password
        })
        //redirect
        router.replace('/dashboard');
    };

    const handleGoogleSignIn = () => {
        if (googleOAuthUrl?.url) {
            window.location.href = googleOAuthUrl.url;
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md border-2 border-neutral-900 dark:border-neutral-100 bg-background p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-1 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
                    <h1 className="text-3xl font-extrabold tracking-tight uppercase">Signup</h1>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Create an account to get started</p>
                </div>
                
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name</label>
                            <input 
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="flex h-10 w-full rounded-none border-2 border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-neutral-900 dark:focus-visible:border-neutral-100 disabled:cursor-not-allowed disabled:opacity-50" 
                                placeholder="John" 
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Name</label>
                            <input 
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="flex h-10 w-full rounded-none border-2 border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-neutral-900 dark:focus-visible:border-neutral-100 disabled:cursor-not-allowed disabled:opacity-50" 
                                placeholder="Doe" 
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
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
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
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

                <div className="flex flex-col gap-3">
                    <button type="submit" className="inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-widest bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 h-11 px-4 py-2 w-full transition-colors cursor-pointer">
                        Sign Up
                    </button>

                    <div className="flex items-center my-1">
                        <div className="flex-grow border-t border-neutral-300 dark:border-neutral-700"></div>
                        <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Or</span>
                        <div className="flex-grow border-t border-neutral-300 dark:border-neutral-700"></div>
                    </div>

                    <button 
                        type="button" 
                        onClick={handleGoogleSignIn}
                        disabled={!googleOAuthUrl?.url}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-widest border-2 border-neutral-900 dark:border-white bg-transparent text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 h-11 px-4 py-2 w-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Continue with Google
                    </button>
                </div>
            </form>
        </div>
    )
}

export default signuppage;