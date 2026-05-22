import {type CreateUserWithEmailAndPasswordInput,createUserWithEmailAndPasswordInput} from './model'
import {db,eq} from '@repo/database';
import {usersTable} from '@repo/database/models/user'
import {createHmac, randomBytes} from 'node:crypto'
import { userInfo } from 'node:os';

class userService{
    private async getUserByEmail(email:string){
        const result = await db.selectDistinct().from(usersTable).where(eq(usersTable.email,email))
        if(!result || result.length===0) return null
        return result;
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
        return {
            id:insertedUser[0]?.id
        }
    }
}

export default userService;