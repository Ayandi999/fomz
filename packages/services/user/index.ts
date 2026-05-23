import {
    type CreateUserWithEmailAndPasswordInput,
    createUserWithEmailAndPasswordInput,
    generateuserTokenPayload, 
    GenerateUserTokenPayloadType,
    SignInWithEmailAndPasswordType,
    signInWithEmailAndPasswordModel
} from './model'
import {db,eq} from '@repo/database';
import {usersTable} from '@repo/database/models/user'
import {createHmac, randomBytes} from 'node:crypto'
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
    private async generateHash(salt:string,password:string){
        return createHmac('sha256',salt).update(password).digest('hex')
    }
    private async getUsetInfoById(id:string){
        const user = await db.select({
            id:usersTable.id,
            email:usersTable.email,
            fullName:usersTable.fullName,
            profileImageUrl:usersTable.profileImageUrl
        }).from(usersTable).where(eq(usersTable.id,id))
        if(!user || user.length === 0 || !user[0]) throw new Error("User not found")
        return user[0];
    }
    public async verifyUserToken(token:string):Promise<{
        id:string,
        email:string,
        fullName:string,
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
        const {email,password,fullName} = await createUserWithEmailAndPasswordInput.parseAsync(payload)
        //does email alredy exist?
        const existinUserWithEmail = await this.getUserByEmail(email);
        if(existinUserWithEmail) throw new Error('User with email alredy exists')
        //Calculate hash and salt
        const salt = randomBytes(16).toString('hex');
        const hash = await this.generateHash(salt,password);

        const insertedUser = await db.insert(usersTable).values({
            email,
            fullName,
            password:hash,
            salt
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
        if(!user[0].password || !user[0].salt) throw new Error("Invalid authentication method")
        //check if password is correct
        const hashedPasswordNew = await this.generateHash(user[0].salt,password);
        if(hashedPasswordNew !== user[0].password) throw new Error("User email / password is wrong");
        //make tokens
        const {token} = await this.generateToken({id:user[0].id});       
        return {
            id:user[0].id,
            token
        }
    }
}

export default userService;