import type { CookieOptions,Request,Response } from "express"
import { TRPCContext } from "../context";

//These are just default options for cookie no stress
const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;
const ONE_MONTH = ONE_DAY * 30;
const ONE_YEAR = ONE_MONTH * 12;

const defaultCookieOption: CookieOptions = {
     path:'/',
     httpOnly:true,
     secure:true,
     sameSite:"strict",
     maxAge: ONE_YEAR,
}
//------------------------------------------------------
export function createCookieFactory(res:Response){
     return function createCookie(
          name:string,
          value:string,
          options: CookieOptions = defaultCookieOption
     ){
          res.cookie(name,value,options);
     }
}
 
export function getCookieFactory(req:Request){
     return function getCookie(name:string){
          return req.cookies?.[name];
     }
}

export function cleareCookieFactory(res:Response){
     return function cleareCookie(name:string){
          res.clearCookie(name)
     }
}
//-----------------Authentication cookie------------------
const AUTH_COOKIE_NAME = 'authentication-cookie';
export function setAuthenticationCookie(ctx:TRPCContext,accessToken:string){
     ctx.createCookie(AUTH_COOKIE_NAME,accessToken);
}

export function getAuthenticationCookie(ctx:TRPCContext){
     return ctx.getCookie(AUTH_COOKIE_NAME)
}

export function clearAuthenticationCookie(ctx:TRPCContext){
     ctx.cleareCookie(AUTH_COOKIE_NAME)
}
