import type { AppRouter } from "@budget-manager/api/routers/index";
import { Locale } from "@budget-manager/i18n";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { SeedConfig } from "./config";

export type ApiClient = ReturnType<typeof createClient>;

/**
 * Everything the script writes goes through this client, so a renamed procedure
 * or a changed input is a compile error here rather than a silently broken seed.
 */
export function createClient({
  serverUrl,
  cookie,
}: {
  serverUrl: string;
  cookie: string;
}) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${serverUrl}/trpc`,
        headers: () => ({ cookie }),
      }),
    ],
  });
}

async function isReachable(url: string) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(3000) });

    return true;
  } catch {
    return false;
  }
}

export async function requireServer(serverUrl: string) {
  if (await isReachable(`${serverUrl}/trpc/healthCheck`)) {
    return;
  }

  throw new Error(
    `No API server at ${serverUrl}. Start it with \`bun run dev\` (or \`bun run dev:server\`), and make sure Postgres is up via \`bun run db:start\`.`,
  );
}

/**
 * Signs the demo user up through better-auth rather than inserting a row, then
 * walks the two writes onboarding makes: `category.ensureDefaults` (sign-up no
 * longer seeds them — the flow does, in the language the user picked) and the
 * completion flag, so opening the demo account lands on the dashboard rather
 * than on the onboarding gate.
 */
export async function signUp(config: SeedConfig) {
  const response = await fetch(`${config.serverUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: config.webUrl },
    body: JSON.stringify({
      email: config.email,
      password: config.password,
      name: config.name,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Sign-up failed (${response.status}): ${await response.text()}`,
    );
  }

  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");

  if (!cookie) {
    throw new Error("Sign-up returned no session cookie");
  }

  const client = createClient({ serverUrl: config.serverUrl, cookie });

  await client.category.ensureDefaults.mutate({ locale: Locale.EN });

  const completed = await fetch(`${config.serverUrl}/api/auth/update-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: config.webUrl,
      cookie,
    },
    body: JSON.stringify({ onboardingCompleted: true }),
  });

  if (!completed.ok) {
    throw new Error(
      `Completing onboarding failed (${completed.status}): ${await completed.text()}`,
    );
  }

  return client;
}
