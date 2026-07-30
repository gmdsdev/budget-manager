const DEFAULT_SERVER_URL = "http://localhost:3000";
const DEFAULT_WEB_URL = "http://localhost:3001";

function trimTrailingSlash(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const SERVER_URL = trimTrailingSlash(
  process.env.E2E_SERVER_URL ?? DEFAULT_SERVER_URL,
);

export const WEB_URL = trimTrailingSlash(
  process.env.E2E_WEB_URL ?? DEFAULT_WEB_URL,
);

async function isReachable(url: string) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(3000) });

    return true;
  } catch {
    return false;
  }
}

/**
 * Fails with an actionable message instead of letting every test time out
 * separately when the stack simply is not running.
 */
export async function requireServer() {
  if (await isReachable(`${SERVER_URL}/trpc/healthCheck`)) {
    return;
  }

  throw new Error(
    `No API server at ${SERVER_URL}. Start it with \`bun run dev\` (or \`bun run dev:server\`), and make sure Postgres is up via \`bun run db:start\`.`,
  );
}

export async function requireWeb() {
  await requireServer();

  if (await isReachable(WEB_URL)) {
    return;
  }

  throw new Error(
    `No web app at ${WEB_URL}. Start it with \`bun run dev\` (or \`bun run dev:web\`).`,
  );
}
