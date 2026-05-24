import {
    type CreateUserWithEmailAndPasswordInput,
    createUserWithEmailAndPasswordInput,
    generateuserTokenPayload, 
    GenerateUserTokenPayloadType,
    SignInWithEmailAndPasswordType,
    signInWithEmailAndPasswordModel,
    type ContinueWithGoogleInput,
    continueWithGoogleInput,
    forgotPasswordInput,
    type ForgotPasswordInput,
    resetPasswordInput,
    type ResetPasswordInput
} from './model'
import * as argon2 from 'argon2'
import {db,eq,and,lt} from '@repo/database';
import {usersTable} from '@repo/database/models/user'
import * as JWT from 'jsonwebtoken';
import { env } from '../env';
import { googleOAuth2Client } from '../clients/google-oauth';
import redis from '../redis';
import { sendVerificationCodeEmail, sendForgotPasswordEmail } from '../mail';

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
        //Calculate hash
        const hash = await argon2.hash(password);

        // 1. Generate 6-digit verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Save code and user info in Redis with 5-minute TTL
        const pendingUserPayload = JSON.stringify({ email, firstName, lastName, password: hash });
        await redis.set(`verification:${email}`, code, "EX", 300);
        await redis.set(`signup:pending:${email}`, pendingUserPayload, "EX", 300);

        // 3. Send email to user
        await sendVerificationCodeEmail(email, code);
        
        return {
            id: "pending"
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
                    emailVerified: true,
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

    public async verifyEmailCode(payload: { email: string; code: string }) {
        const { email, code } = payload;
        
        // 1. Fetch code from Redis
        const storedCode = await redis.get(`verification:${email}`);
        if (!storedCode) throw new Error("Verification code expired or not found");

        // 2. Match verification code
        if (storedCode !== code) throw new Error("Invalid verification code");

        // 3. Fetch pending user payload from Redis
        const storedUserPayload = await redis.get(`signup:pending:${email}`);
        if (!storedUserPayload) throw new Error("Pending registration expired or not found");

        const { firstName, lastName, password } = JSON.parse(storedUserPayload);

        // 4. Create verified user in PostgreSQL database
        const insertedUser = await db.insert(usersTable).values({
            email,
            firstName,
            lastName,
            password, // already hashed
            profileImageUrl: null,
            emailVerified: true
        }).returning({ id: usersTable.id });

        if (!insertedUser || insertedUser.length === 0 || !insertedUser[0]) {
            throw new Error("Failed to create user in database");
        }

        // 5. Clean up Redis entries
        await redis.del(`verification:${email}`);
        await redis.del(`signup:pending:${email}`);

        // 6. Generate and return token
        const userId = insertedUser[0].id;
        const { token } = await this.generateToken({ id: userId });

        return {
            id: userId,
            token
        };
    }

    public async forgotPassword(payload: ForgotPasswordInput) {
        const { email } = await forgotPasswordInput.parseAsync(payload);
        
        // Check if user exists
        const user = await this.getUserByEmail(email);
        if (!user || user.length === 0 || !user[0]) {
            throw new Error("No account found with this email");
        }

        // Generate 6-digit verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Save code in Redis with 15-minute TTL
        await redis.set(`reset-password:${email}`, code, "EX", 900);

        // Send forgot password email
        await sendForgotPasswordEmail(email, code);

        return {
            success: true
        };
    }

    public async resetPassword(payload: ResetPasswordInput) {
        const { email, code, newPassword } = await resetPasswordInput.parseAsync(payload);

        // Match verification code from Redis
        const storedCode = await redis.get(`reset-password:${email}`);
        if (!storedCode) throw new Error("Reset code expired or not found");
        if (storedCode !== code) throw new Error("Invalid reset code");

        // Fetch user from DB
        const users = await this.getUserByEmail(email);
        if (!users || users.length === 0 || !users[0]) {
            throw new Error("User not found");
        }
        const user = users[0];

        // Hash new password
        const hash = await argon2.hash(newPassword);

        // Update password in DB
        await db.update(usersTable)
            .set({ password: hash })
            .where(eq(usersTable.id, user.id));

        // Clean up Redis entry
        await redis.del(`reset-password:${email}`);

        return {
            success: true
        };
    }
    
}

export default userService;