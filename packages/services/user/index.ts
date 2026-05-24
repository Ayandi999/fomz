import {
    type CreateUserWithEmailAndPasswordInput,
    createUserWithEmailAndPasswordInput,
    generateuserTokenPayload, 
    GenerateUserTokenPayloadType,
    SignInWithEmailAndPasswordType,
    signInWithEmailAndPasswordModel
} from './model'
import * as argon2 from 'argon2'
import {db,eq} from '@repo/database';
import {usersTable} from '@repo/database/models/user'
import * as JWT from 'jsonwebtoken';
import { env } from '../env';

class userService{
    private async getUserByEmail(email:string){
        const result = await db.selectDistinct().from(usersTable).where(eq(usersTable.email,email))
        if(!result || result.length===0) return null
        return result;
    }
    private async generateToken(payload:GenerateUserTokenPayloadType){
        const data = await generateuserTokenPayload.parseAsync(payload)
        const token = JWT.sign({data},env.JWT_SECRET);
        return {token}; //This is so that we can extend this object in the future
    }
    private async getUsetInfoById(id:string){
        const user = await db.select({
            id:usersTable.id,
            email:usersTable.email,
            firstName:usersTable.firstName,
            lastName:usersTable.lastName,
            profileImageUrl:usersTable.profileImageUrl
        }).from(usersTable).where(eq(usersTable.id,id))
        if(!user || user.length === 0 || !user[0]) throw new Error("User not found")
        return user[0];
    }
    public async verifyUserToken(token:string):Promise<{
        id:string,
        email:string,
        firstName:string,
        lastName:string,
        profileImageUrl:string | null
    }>{
        try{
            const decoded = JWT.verify(token,env.JWT_SECRET) as { data: GenerateUserTokenPayloadType };
            const {id} = decoded.data
            const userInfo = await this.getUsetInfoById(id);
            return userInfo
        }catch(error){
            //Why throw a different error? because i don't want anyone to know that i am using this library
            throw new Error("Invalid Token")
        }
    }
    public async createUserWithEmailAndPassword(payload : CreateUserWithEmailAndPasswordInput){
        const {email,password,firstName,lastName} = await createUserWithEmailAndPasswordInput.parseAsync(payload)
        //does email alredy exist?
        const existinUserWithEmail = await this.getUserByEmail(email);
        if(existinUserWithEmail) throw new Error('User with email alredy exists')
        //Calculate hash and salt
        const hash = await argon2.hash(password);

        const insertedUser = await db.insert(usersTable).values({
            email,
            firstName,
            lastName,
            password:hash,
            profileImageUrl:null
        }).returning({id:usersTable.id})

        if(!insertedUser || insertedUser.length === 0 || !insertedUser[0]?.id) throw new Error("Somentinh went wrong while making user");
        const userId = insertedUser[0].id;
        const {token} = await this.generateToken({id:userId});
        
        return {
            id:userId,
            token
        }
    }
    public async signInWithEmailAndPassword(payload:SignInWithEmailAndPasswordType){
        const {email,password} = await signInWithEmailAndPasswordModel.parseAsync(payload);
        
        //check if email exist
        const user = await this.getUserByEmail(email);
        if(!user || user.length===0 || !user[0]) throw new Error("account doesn't exist");
        //What if the user used google auth
        if(!user[0].password) throw new Error("Invalid authentication method")
        //check if password is correct
        const isPasswordValid = await argon2.verify(user[0].password, password);
        if(!isPasswordValid) throw new Error("User email / password is wrong");
        //make tokens
        const {token} = await this.generateToken({id:user[0].id});       
        return {
            id:user[0].id,
            token
        }
    }
}

export default userService;