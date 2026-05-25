import type { CookieOptions,Request,Response } from "express"
import { TRPCContext } from "../context";
import * as JWT from "jsonwebtoken";

//These are just default options for cookie no stress
const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;
const ONE_MONTH = ONE_DAY * 30;
const ONE_YEAR = ONE_MONTH * 12;

const defaultCookieOption: CookieOptions = {
     path:'/',
     httpOnly:true,
     secure: process.env.NODE_ENV === "production",
     sameSite:"lax",
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
//-----------------Authentication cookies------------------
const AUTH_COOKIE_NAME = 'authentication-cookie';
const ACCESS_COOKIE_NAME = 'access-cookie';
const REFRESH_COOKIE_NAME = 'refresh-cookie';

export function setAuthenticationCookie(ctx:TRPCContext, accessToken:string, refreshToken?: string){
     const isProd = process.env.NODE_ENV === "production";

     // 1. Set Access Token (expires in 30 days)
     ctx.createCookie(ACCESS_COOKIE_NAME, accessToken, {
          path: '/',
          httpOnly: true,
          secure: isProd,
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
     });

     if (refreshToken) {
          // 2. Set Refresh Token (expires in 30 days)
          ctx.createCookie(REFRESH_COOKIE_NAME, refreshToken, {
               path: '/',
               httpOnly: true,
               secure: isProd,
               sameSite: "lax",
               maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          });
     }
}

export function getAuthenticationCookie(ctx:TRPCContext){
     return ctx.getCookie(ACCESS_COOKIE_NAME) || ctx.getCookie(AUTH_COOKIE_NAME);
}

export function clearAuthenticationCookie(ctx:TRPCContext){
     ctx.cleareCookie(ACCESS_COOKIE_NAME);
     ctx.cleareCookie(REFRESH_COOKIE_NAME);
     ctx.cleareCookie(AUTH_COOKIE_NAME);
}
