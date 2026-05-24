import {z} from 'zod'

export const createUserWithEmailAndPasswordInput = z.object({
    firstName : z.string().min(2).describe('first name of user'),
    lastName : z.string().min(2).describe('last name of user'),
    email : z.string().email().describe("Email of user"),
    password : z.string().min(8).describe('password of user')
});


export type CreateUserWithEmailAndPasswordInput = z.infer<typeof createUserWithEmailAndPasswordInput>;

export const generateuserTokenPayload = z.object({
    id:z.string().describe("Id of the user")
})

export type GenerateUserTokenPayloadType = z.infer<typeof generateuserTokenPayload>;

export const signInWithEmailAndPasswordModel = z.object({
    email:z.string().email().describe("Users email"),
    password:z.string().describe("password of the user")
})

export type SignInWithEmailAndPasswordType = z.infer<typeof signInWithEmailAndPasswordModel>

export const continueWithGoogleInput = z.object({
    code: z.string().describe("Google authorization code")
});

export type ContinueWithGoogleInput = z.infer<typeof continueWithGoogleInput>;

export const forgotPasswordInput = z.object({
    email: z.string().email().describe("Email of user"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInput>;

export const resetPasswordInput = z.object({
    email: z.string().email().describe("Email of user"),
    code: z.string().length(6).describe("6-digit verification code"),
    newPassword: z.string().min(8).describe("New password of user"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInput>;

export const refreshTokensInput = z.object({
    refreshToken: z.string().describe("Refresh token value"),
});

export type RefreshTokensInput = z.infer<typeof refreshTokensInput>;

