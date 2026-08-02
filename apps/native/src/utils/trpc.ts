import { createClientRuntime } from "@budget-manager/client/runtime";

import { authClient, getStoredCookie } from "@/lib/auth-client";
import { getServerUrl } from "@/lib/server-url";
import { toast } from "@/lib/toast";

/**
 * The client layer itself is shared with the web app (`@budget-manager/client`): the
 * query and mutation hooks, the invalidation lists, the retry rule and the cache error
 * handlers all live there. What is native-specific is what this file passes in — where
 * the API is, how the cookie gets sent, and what a toast looks like.
 */
const { trpc, queryClient, trpcClient } = createClientRuntime({
  serverUrl: getServerUrl(),
  // A phone has no cookie jar of the browser's kind: better-auth's own fetch goes
  // through the Expo plugin, and this separate one has to be handed the stored cookie.
  headers: () => ({ cookie: getStoredCookie() }),
  toast: {
    success: (message) => toast.success(message),
    error: (message, options) =>
      toast.error(
        message,
        options?.action
          ? {
              action: {
                label: options.action.label,
                onPress: options.action.onAction,
              },
            }
          : undefined,
      ),
  },
  session: { useSession: authClient.useSession },
  auth: {
    updateUser: (values) => authClient.updateUser(values),
    changePassword: (values) => authClient.changePassword(values),
    // No session cache to drop: better-auth's own store is what the app reads.
  },
});

export { queryClient, trpc, trpcClient };
