import { getServerUrl } from "@/lib/server-url";
import { env } from "@budget-manager/env/web";
import { USER_ADDITIONAL_FIELDS } from "@budget-manager/schemas";
import { polarClient } from "@polar-sh/better-auth/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // better-auth derives its route-matching base from this URL's path, so the
  // public auth path must equal the server-side mount (/api/auth everywhere)
  baseURL: new URL("/api/auth", getServerUrl(env.VITE_SERVER_URL)).toString(),
  plugins: [
    inferAdditionalFields({ user: USER_ADDITIONAL_FIELDS }),
    polarClient(),
  ],
});
