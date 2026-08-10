import type { AppRouter } from "@budget-manager/api/routers/index";
import { Locale } from "@budget-manager/i18n";
import { TRPCClientError, createTRPCClient, httpBatchLink } from "@trpc/client";
import { SERVER_URL, WEB_URL } from "./env";

export type ApiClient = ReturnType<typeof createClient>;

export function createClient(cookie: string) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${SERVER_URL}/trpc`,
        headers: () => (cookie ? { cookie } : {}),
      }),
    ],
  });
}

let counter = 0;

/**
 * Signs up a throwaway user and returns a client bound to its session. Each test
 * file gets its own user so suites never see each other's rows.
 *
 * Sign-up no longer seeds the default categories — the onboarding flow does,
 * with the language the user picked — so this walks the same two writes
 * onboarding makes and hands back an account in the state every suite assumes:
 * defaults present, in English, flow completed. A suite about onboarding
 * itself passes `onboarded: false` to get the account as sign-up leaves it.
 */
export async function signUpClient(options?: { onboarded?: boolean }) {
  counter += 1;

  const email = `e2e-${Date.now()}-${counter}-${Math.floor(Math.random() * 1e6)}@example.com`;

  const res = await fetch(`${SERVER_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: WEB_URL },
    body: JSON.stringify({
      email,
      password: "SuperSecret123!",
      name: "E2E User",
    }),
  });

  if (!res.ok) {
    throw new Error(`sign-up failed (${res.status}): ${await res.text()}`);
  }

  const cookie = res.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");

  if (!cookie) {
    throw new Error("sign-up returned no session cookie");
  }

  const client = createClient(cookie);

  if (options?.onboarded !== false) {
    await client.category.ensureDefaults.mutate({ locale: Locale.EN });
    await completeOnboarding(cookie);
  }

  return { client, cookie, email };
}

/** The write the onboarding screen's finish (and skip) button makes. */
export async function completeOnboarding(cookie: string) {
  const res = await fetch(`${SERVER_URL}/api/auth/update-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: WEB_URL, cookie },
    body: JSON.stringify({ onboardingCompleted: true }),
  });

  if (!res.ok) {
    throw new Error(
      `complete-onboarding failed (${res.status}): ${await res.text()}`,
    );
  }
}

export const anonymousClient = () => createClient("");

/**
 * Asserts a call is rejected and returns the tRPC error code, so tests can say
 * `expect(await errorCodeOf(...)).toBe("CONFLICT")`.
 */
export async function errorCodeOf(call: Promise<unknown>): Promise<string> {
  try {
    await call;
  } catch (error) {
    if (error instanceof TRPCClientError) {
      const code = (error.data as { code?: string } | null)?.code;

      return code ?? `NO_CODE:${error.message}`;
    }

    return `NOT_TRPC_ERROR:${String(error)}`;
  }

  return "NO_ERROR_THROWN";
}
