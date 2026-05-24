import {
  createUserWithEmailAndPasswordInputModel,
  createUserWithEmailAndPasswordOutputModel, 
  getUserInfoInputModel, 
  getUserInfoOutputModel, 
  siginInUserWithEmailAndPasswordInputModel, 
  siginInUserWithEmailAndPasswordOutputModel,
  getGoogleOAuthUrlOutputModel,
  continueWithGoogleInputModel,
  continueWithGoogleOutputModel,
  verifyEmailCodeInputModel,
  verifyEmailCodeOutputModel
} from "./model"
import { autheticatedProcedure, publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { userService } from "../../services";
import { getAuthenticationCookie, setAuthenticationCookie } from "../../utils/cookie";
import { googleOAuth2Client } from "@repo/services/clients/google-oauth";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
  createUserWithEmailAndPassword: publicProcedure
  .meta({openapi:{
    method:'POST',
    path:'/createUserWithEmailAndPassword',
    tags:TAGS
  }})
  .input(createUserWithEmailAndPasswordInputModel)
  .output(createUserWithEmailAndPasswordOutputModel)
  .mutation(async({input})=>{
    const {email,firstName,lastName,password} = input;
    const {id} = await userService.createUserWithEmailAndPassword({
      firstName,
      lastName,
      email,
      password
    });
    return {id}
  }),

  siginInUserWithEmailAndPassword: publicProcedure
  .meta({
    openapi:{
      method:'POST',
      path:'/siginInUserWithEmailAndPassword',
      tags:TAGS
    }
  })
  .input(siginInUserWithEmailAndPasswordInputModel)
  .output(siginInUserWithEmailAndPasswordOutputModel)
  .mutation(async({input,ctx})=>{
    const {email,password} = input;
    const {id,token} = await userService.signInWithEmailAndPassword({email,password});
    setAuthenticationCookie(ctx,token)
    return{
      id
    }
  }),

  getGoogleOAuthUrl: publicProcedure
  .meta({openapi:{
    method:'GET',
    path:'/getGoogleOAuthUrl',
    tags:TAGS
  }})
  .input(getUserInfoInputModel)
  .output(getGoogleOAuthUrlOutputModel)
  .query(() => {
    const url = googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent'
    });
    return { url };
  }),

  continueWithGoogle: publicProcedure
  .meta({openapi:{
    method:'POST',
    path:'/continueWithGoogle',
    tags:TAGS
  }})
  .input(continueWithGoogleInputModel)
  .output(continueWithGoogleOutputModel)
  .mutation(async({input,ctx})=>{
    const {code} = input;
    const {id,token} = await userService.continueWithGoogle({code});
    setAuthenticationCookie(ctx,token)
    return {id}
  }),

  verifyEmailCode: publicProcedure
  .meta({openapi:{
    method:'GET',
    path:'/verifyEmailCode',
    tags:TAGS
  }})
  .input(verifyEmailCodeInputModel)
  .output(verifyEmailCodeOutputModel)
  .query(async({input,ctx})=>{
    const {email,code} = input;
    const {id,token} = await userService.verifyEmailCode({email,code});
    setAuthenticationCookie(ctx,token)
    return {id}
  }),

  getUserInfoFromToken: autheticatedProcedure
  .meta({openapi:{
    method:'GET',
    path:'/getUserInfo',
    tags:TAGS
  }})
  .input(getUserInfoInputModel)
  .output(getUserInfoOutputModel)
  .query(async({ctx})=>{
    const {id,email,profileImageUrl,firstName,lastName} = await userService.verifyUserToken(ctx.user.id);
    return{
      id,
      email,
      profileImageUrl,
      firstName,
      lastName
    }
  })
});

