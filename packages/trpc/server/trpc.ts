import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { createContext } from "./context";
import { getAuthenticationCookie } from "./utils/cookie";

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<typeof createContext>()
  .create({});

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

//This is my authenticated route
export const autheticatedProcedure=tRPCContext.procedure.use(options=>{
  const {ctx} = options;
  const userToken = getAuthenticationCookie(ctx);
  if(!userToken) throw new Error('User is not logged in');
  return options.next({
    ctx:{...ctx,user:{token: userToken}}
  });
})