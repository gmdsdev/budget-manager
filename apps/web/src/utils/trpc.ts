import { getErrorMessage, isUnauthorizedError } from "@/utils/error-message";
import type { AppRouter } from "@budget-manager/api/routers/index";
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

function getServerUrl(url: string) {
  const normalized = url.endsWith("/") ? url.slice(0, -1) : url;

  if (!normalized.startsWith("/")) {
    return normalized;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}${normalized}`;
  }

  const processEnv = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env;
  const vercelUrl =
    processEnv?.VERCEL_ENV === "production"
      ? (processEnv?.VERCEL_PROJECT_PRODUCTION_URL ?? processEnv?.VERCEL_URL)
      : (processEnv?.VERCEL_URL ?? processEnv?.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercelUrl) {
    const origin = vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
    return `${origin}${normalized}`;
  }

  return `http://localhost:3000${normalized}`;
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
          label: "Retry",
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
