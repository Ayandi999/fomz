import {email, parseAsync, string, z} from 'zod'

export const createUserWithEmailAndPasswordInputModel = z.object({
    firstName:z.string().min(2).describe("First name of the user"),
    lastName:z.string().min(2).describe("last name of the user"),
    email:z.string().email().describe("Email of the user"),
    password:z.string().min(8).describe("Password of the user")
})

export const createUserWithEmailAndPasswordOutputModel = z.object({
    id:z.string().describe("Id of the user")
})

// Sig in models
export const siginInUserWithEmailAndPasswordInputModel = z.object({
    email:z.string().email().describe("users email"),
    password: z.string().describe("Users password")
})

export const siginInUserWithEmailAndPasswordOutputModel = z.object({
    id:z.string().describe("User id")
})

// me/userinfo route
export const getUserInfoInputModel = z.undefined();
export const getUserInfoOutputModel = z.object({
    id:z.string().describe("User id"),
    email:z.string().email().describe("User's email"),
    firstName:z.string().describe("User's first name"),
    lastName:z.string().describe("User's last name"),
    profileImageUrl : z.string().describe("Users profile image").optional().nullable()
})

// Google Auth Models
export const getGoogleOAuthUrlOutputModel = z.object({
    url: z.string().describe("Google OAuth consent screen URL")
});

export const continueWithGoogleInputModel = z.object({
    code: z.string().describe("Google authorization code")
});

export const continueWithGoogleOutputModel = z.object({
    id: z.string().describe("Logged in user ID")
});

// Verification Code Models
export const verifyEmailCodeInputModel = z.object({
    email: z.string().email().describe("User's email"),
    code: z.string().length(6).describe("6-digit verification code")
});

export const verifyEmailCodeOutputModel = z.object({
    id: z.string().describe("Verified user ID")
});

// Forgot Password Models
export const forgotPasswordInputModel = z.object({
    email: z.string().email().describe("User's email")
});

export const forgotPasswordOutputModel = z.object({
    success: z.boolean().describe("Whether reset email was sent successfully")
});

// Reset Password Models
export const resetPasswordInputModel = z.object({
    email: z.string().email().describe("User's email"),
    code: z.string().length(6).describe("6-digit verification code"),
    newPassword: z.string().min(8).describe("New password")
});

export const resetPasswordOutputModel = z.object({
    success: z.boolean().describe("Whether password reset was successful")
});

// Sign Out Models
export const signOutInputModel = z.undefined();

export const signOutOutputModel = z.object({
    success: z.boolean().describe("Whether logout was successful")
});