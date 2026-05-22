import { publicProcedure, router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";

import {z} from 'zod'

export const serverRouter = router({
  auth: authRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
