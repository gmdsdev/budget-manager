import { createClientRuntime } from "@budget-manager/client/runtime";
import { env } from "@budget-manager/env/web";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { getServerUrl } from "@/lib/server-url";
import { invalidateSessionCache } from "@/lib/session";

/**
 * The client layer itself is shared with the native app (`@budget-manager/client`): the
 * query and mutation hooks, the invalidation lists, the retry rule and the cache error
 * handlers all live there. What is web-specific is what this file passes in — where the
 * API is, how the cookie gets sent, and what a toast looks like.
 */
const { trpc, queryClient, trpcClient } = createClientRuntime({
  serverUrl: getServerUrl(env.VITE_SERVER_URL),
  // The session cookie is the browser's to attach, and in development the API is a
  // different origin.
  fetch: (url, options) => fetch(url, { ...options, credentials: "include" }),
  toast: {
    success: (message) => toast.success(message),
    error: (message, options) =>
      toast.error(message, {
        action: options?.action
          ? { label: options.action.label, onClick: options.action.onAction }
          : undefined,
      }),
  },
  session: { useSession: authClient.useSession },
  auth: {
    updateUser: (values) => authClient.updateUser(values),
    changePassword: (values) => authClient.changePassword(values),
    // The `_auth` layout reads the session through a 10s cache, which a write to the
    // `user` row has just made stale.
    onSessionChanged: invalidateSessionCache,
  },
});

export { queryClient, trpc, trpcClient };
