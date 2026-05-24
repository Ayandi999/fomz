import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: Response | PromiseLike<Response>) => void;
  reject: (reason?: any) => void;
  url: RequestInfo | URL;
  options: RequestInit | undefined;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      fetch(prom.url, { ...prom.options, credentials: "include" })
        .then((res) => prom.resolve(res))
        .catch((err) => prom.reject(err));
    }
  });
  failedQueue = [];
};

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  const baseUrl = env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/trpc";

  return c({
    url: baseUrl,
    async fetch(url, options) {
      const response = await fetch(url, {
        ...options,
        credentials: "include",
      });

      // Read response body as text to avoid stream-cloning/locking bugs in Next.js/browsers
      const text = await response.text();
      let hasAuthError = false;

      try {
        const body = JSON.parse(text);
        const errors = Array.isArray(body) ? body : [body];
        hasAuthError = errors.some(
          (item) =>
            item?.error?.message === "User is not logged in" ||
            item?.error?.message === "Invalid Token"
        );
      } catch {
        // Not a JSON response
      }

      // Re-create Response so tRPC can consume the body stream downstream
      const newResponse = new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      if (hasAuthError && !url.toString().includes("auth.refreshTokens")) {
        if (isRefreshing) {
          return new Promise<Response>((resolve, reject) => {
            failedQueue.push({ resolve, reject, url, options });
          });
        }

        isRefreshing = true;

        try {
          const refreshRes = await fetch(`${baseUrl}/auth.refreshTokens`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
            credentials: "include",
          });

          if (refreshRes.ok) {
            isRefreshing = false;
            const retriedResponse = await fetch(url, {
              ...options,
              credentials: "include",
            });
            processQueue(null);
            return retriedResponse;
          } else {
            throw new Error("Refresh failed");
          }
        } catch (err) {
          isRefreshing = false;
          processQueue(new Error("Session expired"));
          return newResponse;
        }
      }

      return newResponse;
    },
  });
};


