import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import cookieParser from 'cookie-parser'

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

//This is seting cookies for different origins
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  return res.json({ message: "Streamyst is up and running..." });
});

import UserService from "@repo/services/user";
const userService = new UserService();

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
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    // Set the refresh-cookie
    res.cookie("refresh-cookie", refreshToken, {
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
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
