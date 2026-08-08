import { createContext } from "@budget-manager/api/context";
import { appRouter } from "@budget-manager/api/routers/index";
import { auth } from "@budget-manager/auth";
import { env } from "@budget-manager/env/server";
import { rejectCheckoutBody } from "@budget-manager/schemas";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-locale",
      // `@better-auth/expo` identifies the native app with this instead of an
      // Origin, which a request from a phone does not carry.
      "expo-origin",
    ],
    credentials: true,
  }),
);

app.post("/api/auth/checkout", async (c) => {
  const raw = await c.req.raw.text();

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }

  const rejection = rejectCheckoutBody(parsed);

  if (rejection) {
    console.warn("Rejected a checkout body", rejection);

    return c.json({ message: "Invalid checkout request" }, 400);
  }

  return auth.handler(
    new Request(c.req.raw.url, {
      method: "POST",
      headers: c.req.raw.headers,
      body: raw,
    }),
  );
});

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
    onError({ error, path, type, input }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`[trpc] ${type} ${path ?? "<no-path>"}`, {
          input,
          error,
          cause: error.cause,
        });
      }
    },
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
