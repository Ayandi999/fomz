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
