import {
    type CreateUserWithEmailAndPasswordInput,
    createUserWithEmailAndPasswordInput,
    generateuserTokenPayload, 
    GenerateUserTokenPayloadType,
    SignInWithEmailAndPasswordType,
    signInWithEmailAndPasswordModel,
    type ContinueWithGoogleInput,
    continueWithGoogleInput
} from './model'
import * as argon2 from 'argon2'
import {db,eq} from '@repo/database';
import {usersTable} from '@repo/database/models/user'
import * as JWT from 'jsonwebtoken';
import { env } from '../env';
import { googleOAuth2Client } from '../clients/google-oauth';

class userService{
    private async getUserByEmail(email:string){
        const result = await db.selectDistinct().from(usersTable).where(eq(usersTable.email,email))
        if(!result || result.length===0) return null
        return result;
    }
    private async getUserByGoogleId(googleId: string) {
        const result = await db.selectDistinct().from(usersTable).where(eq(usersTable.googleId, googleId));
        if (!result || result.length === 0) return null;
        return result[0];
    }
    public async continueWithGoogle(payload: ContinueWithGoogleInput) {
        const { code } = await continueWithGoogleInput.parseAsync(payload);
        
        // 1. Exchange authorization code for tokens
        const { tokens } = await googleOAuth2Client.getToken(code);
        if (!tokens.id_token) throw new Error("Failed to retrieve ID token from Google");

        // 2. Verify the ID token
        const ticket = await googleOAuth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: env.GOOGLE_OAUTH_CLIENT_ID,
        });
        const googleUser = ticket.getPayload();
        if (!googleUser || !googleUser.email || !googleUser.sub) {
            throw new Error("Invalid Google user payload");
        }

        const googleId = googleUser.sub;
        const email = googleUser.email;
        const firstName = googleUser.given_name || "Google";
        const lastName = googleUser.family_name || "User";
        const profileImageUrl = googleUser.picture || null;

        // 3. Find existing user by googleId
        let user = await this.getUserByGoogleId(googleId);

        if (!user) {
            // 4. Find existing user by email
            const existingUsers = await this.getUserByEmail(email);
            const existingUser = existingUsers?.[0];

            if (existingUser) {
                // Link Google account to existing email account
                const updated = await db.update(usersTable)
                    .set({ 
                        googleId, 
                        profileImageUrl: existingUser.profileImageUrl || profileImageUrl 
                    })
                    .where(eq(usersTable.id, existingUser.id))
                    .returning({ id: usersTable.id });
                
                if (!updated || updated.length === 0) throw new Error("Failed to link Google account");
                user = existingUser;
            } else {
                // 5. Create a new user with Google details
                const inserted = await db.insert(usersTable).values({
                    email,
                    firstName,
                    lastName,
                    googleId,
                    profileImageUrl,
                    password: null,
                }).returning({ id: usersTable.id });

                if (!inserted || inserted.length === 0 || !inserted[0]?.id) {
                    throw new Error("Failed to create user with Google details");
                }

                user = { id: inserted[0].id } as any;
            }
        }

        if (!user || !user.id) throw new Error("User not found");
        const { token } = await this.generateToken({ id: user.id });
        return {
            id: user.id,
            token
        };
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