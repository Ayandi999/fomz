import {createUserWithEmailAndPasswordInputModel,createUserWithEmailAndPasswordOutputModel} from "./model"
import { publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { userService } from "../../services";

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
    const {email,fullName,password} = input;
    const {id} = await userService.createUserWithEmailAndPassword({fullName,email,password});
    return {id}
  })
});
