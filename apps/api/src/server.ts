import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import cookieParser from 'cookie-parser'
import rateLimit from "express-rate-limit";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";
import redis from "@repo/services/redis";

import { env } from "./env";

export const app = express();
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "Streamyst OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

app.use(cookieParser());

app.use(express.json());

const lenientLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." }
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts, please try again later." }
});

app.use((req, res, next) => {
  const isAuthPath = 
    req.path === "/api/verify-email" || 
    req.path === "/api/reset-password-verify" || 
    req.path.startsWith("/api/auth/") || 
    req.path.startsWith("/trpc/auth.");

  if (isAuthPath) {
    return strictLimiter(req, res, next);
  }
  return lenientLimiter(req, res, next);
});

app.get("/", (req, res) => {
  return res.json({ message: "Streamyst is up and running..." });
});

import UserService from "@repo/services/user";
const userService = new UserService();

import uploadRouter from "./routes/upload";
app.use("/api", uploadRouter);

app.get("/health", (req, res) => {
  return res.json({ message: "Streamyst server is healthy", healthy: true });
});

app.get("/api/verify-email", async (req, res) => {
  const { email, code } = req.query;

  if (!email || !code) {
    return res.status(400).send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1 style="color: #ef4444;">Verification Failed</h1>
        <p>Missing email or verification code in link.</p>
        <a href="http://localhost:3000/sign-up" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #171717; color: white; text-decoration: none; font-weight: bold; text-transform: uppercase;">Back to Signup</a>
      </div>
    `);
  }

  try {
    const { accessToken, refreshToken } = await userService.verifyEmailCode({
      email: String(email),
      code: String(code),
    });

    const isProd = process.env.NODE_ENV === "production";

    // Set the access-cookie
    res.cookie("access-cookie", accessToken, {
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    // Set the refresh-cookie
    res.cookie("refresh-cookie", refreshToken, {
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Redirect user directly to the makeshift dashboard page
    return res.redirect("http://localhost:3000/dashboard");
  } catch (error: any) {
    return res.status(400).send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1 style="color: #ef4444;">Verification Failed</h1>
        <p>${error.message || "Invalid or expired link."}</p>
        <a href="http://localhost:3000/sign-up" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #171717; color: white; text-decoration: none; font-weight: bold; text-transform: uppercase;">Back to Signup</a>
      </div>
    `);
  }
});

app.get("/api/reset-password-verify", async (req, res) => {
  const { email, code } = req.query;

  if (!email || !code) {
    return res.status(400).send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1 style="color: #ef4444;">Verification Failed</h1>
        <p>Missing email or verification code in link.</p>
        <a href="http://localhost:3000/sign-in" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #171717; color: white; text-decoration: none; font-weight: bold; text-transform: uppercase;">Back to Signin</a>
      </div>
    `);
  }

  try {
    // 1. Fetch code from Redis
    const storedCode = await redis.get(`reset-password:${email}`);
    if (!storedCode) throw new Error("Reset link expired or not found");

    // 2. Match verification code
    if (storedCode !== code) throw new Error("Invalid verification code");

    // 3. Redirect user directly to the reset password page on web
    return res.redirect(`http://localhost:3000/reset-password?email=${encodeURIComponent(String(email))}&code=${String(code)}`);
  } catch (error: any) {
    return res.status(400).send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1 style="color: #ef4444;">Verification Failed</h1>
        <p>${error.message || "Invalid or expired link."}</p>
        <a href="http://localhost:3000/sign-in" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #171717; color: white; text-decoration: none; font-weight: bold; text-transform: uppercase;">Back to Signin</a>
      </div>
    `);
  }
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
