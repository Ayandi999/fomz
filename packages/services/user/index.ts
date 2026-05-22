import {type CreateUserWithEmailAndPasswordInput,createUserWithEmailAndPasswordInput,generateuserTokenPayload, GenerateUserTokenPayloadType} from './model'
import {db,eq} from '@repo/database';
import {usersTable} from '@repo/database/models/user'
import {createHmac, randomBytes} from 'node:crypto'
import jwt from 'jsonwebtoken';
import { env } from '../env';
class userService{
    private async getUserByEmail(email:string){
        const result = await db.selectDistinct().from(usersTable).where(eq(usersTable.email,email))
        if(!result || result.length===0) return null
        return result;
    }
    private async generateToken(payload:GenerateUserTokenPayloadType){
        const data = await generateuserTokenPayload.parseAsync(payload)
        const token = jwt.sign({data},env.JWT_SECRET);
        return {token}; //This is so that we can extend this object in the future
    }
    public async createUserWithEmailAndPassword(payload : CreateUserWithEmailAndPasswordInput){
        const {email,password,fullName} = await createUserWithEmailAndPasswordInput.parseAsync(payload)
        //does email alredy exist?
        const existinUserWithEmail = await this.getUserByEmail(email);
        if(existinUserWithEmail) throw new Error('User with email alredy exists')
        //Calculate hash and salt
        const salt = randomBytes(16).toString('hex');
        const hash = createHmac('sha256',salt).update(password).digest('hex');

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
}

export default userService;