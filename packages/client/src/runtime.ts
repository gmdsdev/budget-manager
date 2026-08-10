import type { AppRouter } from "@budget-manager/api/routers/index";
import { getActiveLocale, t } from "@budget-manager/i18n";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { getErrorMessage, isUnauthorizedError } from "./errors";

/**
 * Taken off the link's own options rather than spelled as a DOM `fetch`: this package is
 * typechecked without DOM libs, because one of its two consumers is React Native.
 */
type LinkFetch = NonNullable<Parameters<typeof httpBatchLink>[0]["fetch"]>;

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      errorMessage?: string;
      suppressErrorToast?: boolean;
    };
  }
}

/**
 * How the client raises a message. The two apps show one very differently — sonner
 * in a corner, a plate over the top of a phone — but *when* to raise one is a client
 * rule, not a platform one, so the rule lives here and the rendering is injected.
 */
export type ToastAdapter = {
  success: (message: string) => void;
  error: (
    message: string,
    options?: { action?: { label: string; onAction: () => void } },
  ) => void;
};

/**
 * The two better-auth calls the settings screen makes. User settings are better-auth's,
 * not a tRPC module, so this is the one place the shared layer cannot reach the API
 * through the tRPC proxy — each app hands in its own client's methods, and *when* to
 * call them, what to toast and how to surface a failure stays shared.
 */
export type AuthActions = {
  updateUser: (values: {
    name?: string;
    preferredCurrency?: string;
    preferredLocale?: string;
    onboardingCompleted?: boolean;
  }) => Promise<AuthActionResult>;
  changePassword: (values: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions: boolean;
  }) => Promise<AuthActionResult>;
  /**
   * Called after a successful write. The web app drops its session cache here; a phone
   * has none to drop.
   */
  onSessionChanged?: () => void;
};

/**
 * The session, as the shared layer needs to read it. Each app owns its better-auth
 * client — the plugin lists differ — so the hook is handed in rather than imported, and
 * the rules that read it (a preference is a default, never a scope) stay shared.
 */
export type SessionAccessor = {
  useSession: () => {
    data?: {
      user: { preferredCurrency?: string | null; preferredLocale?: string | null };
    } | null;
  };
};

type AuthActionResult = {
  data: unknown;
  error: { message?: string; statusText?: string } | null;
};

export type ClientRuntimeOptions = {
  /** Absolute origin of the API, resolved by the app: only it knows where it runs. */
  serverUrl: string;
  /**
   * Extra headers, read per request rather than captured once. The native app sends
   * its stored session cookie here, since its fetch is not a browser's.
   */
  headers?: () => Record<string, string>;
  /**
   * The fetch the link should use. The web app passes one that sends credentials, since
   * the session cookie is the browser's to attach and the API is a different origin;
   * a phone has no cookie jar and sends the header above instead.
   */
  fetch?: LinkFetch;
  toast: ToastAdapter;
  auth: AuthActions;
  session: SessionAccessor;
};

export type ClientRuntime = {
  queryClient: QueryClient;
  trpcClient: ReturnType<typeof createTRPCClient<AppRouter>>;
  trpc: ReturnType<typeof createTRPCOptionsProxy<AppRouter>>;
  toast: ToastAdapter;
  auth: AuthActions;
  session: SessionAccessor;
};

let runtime: ClientRuntime | null = null;

/**
 * Builds the query client, the tRPC client and the options proxy every shared hook
 * reads, and holds them module-scoped — the same bargain `setActiveLocale` makes, and
 * for the same reason: a hook cannot be handed an app's instance through a dozen
 * signatures without the signatures becoming the abstraction.
 *
 * Called once per app, before anything renders.
 */
export function createClientRuntime(options: ClientRuntimeOptions): ClientRuntime {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        // An expired session will not un-expire on a retry, and retrying it three
        // times only delays the redirect to the login screen.
        retry: (failureCount, error) =>
          !isUnauthorizedError(error) && failureCount < 2,
      },
    },

    queryCache: new QueryCache({
      onError: (error, query) => {
        options.toast.error(getErrorMessage(error), {
          action: {
            label: t("common.retry"),
            onAction: () => {
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

        options.toast.error(mutation.meta?.errorMessage ?? getErrorMessage(error));
      },
    }),
  });

  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${options.serverUrl}/trpc`,
        // Read per request, not captured once: the server localizes the domain errors
        // it throws, the language can change mid-session, and a phone's cookie is
        // replaced on sign-in.
        headers: () => ({
          "x-locale": getActiveLocale(),
          ...options.headers?.(),
        }),
        fetch: options.fetch,
      }),
    ],
  });

  runtime = {
    queryClient,
    trpcClient,
    trpc: createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient }),
    toast: options.toast,
    auth: options.auth,
    session: options.session,
  };

  return runtime;
}

function current(): ClientRuntime {
  if (!runtime) {
    throw new Error(
      "The client runtime has not been created. Call createClientRuntime() before rendering.",
    );
  }

  return runtime;
}

/** The tRPC options proxy every shared query and mutation hook reads. */
export function api() {
  return current().trpc;
}

export function toast(): ToastAdapter {
  return current().toast;
}

export function authActions(): AuthActions {
  return current().auth;
}

export function sessionAccessor(): SessionAccessor {
  return current().session;
}
