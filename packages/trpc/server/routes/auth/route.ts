import {
  createUserWithEmailAndPasswordInputModel,
  createUserWithEmailAndPasswordOutputModel, 
  getUserInfoInputModel, 
  getUserInfoOutputModel, 
  siginInUserWithEmailAndPasswordInputModel, 
  siginInUserWithEmailAndPasswordOutputModel
} from "./model"
import { autheticatedProcedure, publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { userService } from "../../services";
import { getAuthenticationCookie, setAuthenticationCookie } from "../../utils/cookie";

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
  .mutation(async({input,ctx})=>{
    const {email,firstName,lastName,password} = input;
    const {id,token} = await userService.createUserWithEmailAndPassword({
      firstName,
      lastName,
      email,
      password
    });
    setAuthenticationCookie(ctx,token)
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

