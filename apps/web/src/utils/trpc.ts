import { getServerUrl } from "@/lib/server-url";
import { getErrorMessage, isUnauthorizedError } from "@/utils/error-message";
import type { AppRouter } from "@budget-manager/api/routers/index";
import { getActiveLocale, t } from "@budget-manager/i18n";
import { env } from "@budget-manager/env/web";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      errorMessage?: string;
      suppressErrorToast?: boolean;
    };
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) =>
        !isUnauthorizedError(error) && failureCount < 2,
    },
  },

  queryCache: new QueryCache({
    onError: (error, query) => {
      toast.error(getErrorMessage(error), {
        action: {
          label: t("common.retry"),
          onClick: () => {
            void query.invalidate();
          },
        },
      });
    },
  }),

  mutationCache: new MutationCache({
    onError: (error, _variables, _onMutateResult, mutation) => {
      if (mutation.meta?.suppressErrorToast) {
        return;
      }

      toast.error(mutation.meta?.errorMessage ?? getErrorMessage(error));
    },
  }),
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getServerUrl(env.VITE_SERVER_URL)}/trpc`,
      // Read per request, not captured once: the server localizes the domain
      // errors it throws, and the language can change mid-session.
      headers: () => ({ "x-locale": getActiveLocale() }),
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
