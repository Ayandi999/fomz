import {
  createUserWithEmailAndPasswordInputModel,
  createUserWithEmailAndPasswordOutputModel, 
  siginInUserWithEmailAndPasswordInputModel, 
  siginInUserWithEmailAndPasswordOutputModel
} from "./model"
import { publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { userService } from "../../services";
import { setAuthenticationCookie } from "../../utils/cookie";

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
    const {email,fullName,password} = input;
    const {id,token} = await userService.createUserWithEmailAndPassword({
      fullName,
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
  })
});

