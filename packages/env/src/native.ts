import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Optional, unlike the web's `VITE_SERVER_URL`. A phone has no origin of its
 * own to resolve a relative `/api` against, so the app derives the dev server's
 * LAN address from Expo instead (`lib/server-url.ts`) and this variable is what
 * overrides it for a real build.
 *
 * `runtimeEnv` names the variable literally because Expo inlines
 * `process.env.EXPO_PUBLIC_*` at build time — a computed lookup would read
 * nothing.
 */
export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_SERVER_URL: z.url().optional(),
  },
  runtimeEnv: {
    EXPO_PUBLIC_SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
