import {email, parseAsync, string, z} from 'zod'

export const createUserWithEmailAndPasswordInputModel = z.object({
    fullName:z.string().describe("Full name of the user"),
    email:z.string().email().describe("Email of the user"),
    password:z.string().describe("Password of the user")
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
    fullName:z.string().describe("Users full name"),
    profileImageUrl : z.string().describe("Users profile image").optional().nullable()
})