import {z} from 'zod'

export const createUserWithEmailAndPasswordInput = z.object({
    fullName : z.string().describe('full name of user'),
    email : z.string().email().describe("Email of user"),
    password : z.string()
});


export type CreateUserWithEmailAndPasswordInput = z.infer<typeof createUserWithEmailAndPasswordInput>;