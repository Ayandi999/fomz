import type{CreateExpressContextOptions} from '@trpc/server/adapters/express'
import {cleareCookieFactory, createCookieFactory, getCookieFactory} from './utils/cookie'

export interface TRPCContext{
     createCookie: ReturnType<typeof createCookieFactory>;
     getCookie: ReturnType<typeof getCookieFactory>;
     cleareCookie : ReturnType<typeof cleareCookieFactory>
}

export async function createContext({req,res}:CreateExpressContextOptions):Promise<TRPCContext> {
     const ctx:TRPCContext={
          createCookie:createCookieFactory(res),
          getCookie:getCookieFactory(req),
          cleareCookie:cleareCookieFactory(res)
     }
     return ctx
}
export type Context = Awaited<ReturnType<typeof createContext>>;
