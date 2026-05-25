import { z } from "zod";

const envSchema = z.object({
  JWT_SECRET : z.string().describe("jwt secret key"),
  GOOGLE_OAUTH_CLIENT_ID: z.string().describe("google oauth client id"),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().describe("google oauth client secret"),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().describe("google oauth redirect uri"),
  REDIS_URL: z.string().describe("redis url"),
  SMTP_USER: z.string().optional().describe("Ethereal SMTP user"),
  SMTP_PASS: z.string().optional().describe("Ethereal SMTP password"),
  RESEND_API_KEY: z.string().optional().describe("Resend email delivery API key"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
