import {z} from 'zod'

export const createUserWithEmailAndPasswordInput = z.object({
    fullName : z.string().describe('full name of user'),
    email : z.string().email().describe("Email of user"),
    password : z.string()
});


export type CreateUserWithEmailAndPasswordInput = z.infer<typeof createUserWithEmailAndPasswordInput>;

export const generateuserTokenPayload = z.object({
    id:z.string().describe("Id of the user")
})

export type GenerateUserTokenPayloadType = z.infer<typeof generateuserTokenPayload>;