import type { Session, User } from "better-auth";
import type { BetterFetchError } from "better-auth/react";

import { authClient } from "@/lib/auth-client";

export type SessionData = { session: Session; user: User };

export type SessionResult =
  | { data: SessionData; error: null }
  | { data: null; error: BetterFetchError | null };

const TTL_MS = 10_000;

let cached: { at: number; result: SessionResult } | null = null;
let inFlight: Promise<SessionResult> | null = null;

export async function getCachedSession(): Promise<SessionResult> {
  if (cached && Date.now() - cached.at < TTL_MS) {
    return cached.result;
  }

  inFlight ??= (authClient.getSession() as Promise<SessionResult>)
    .then((result) => {
      cached = { at: Date.now(), result };
      return result;
    })
    .finally(() => {
      inFlight = null;
    });

  return await inFlight;
}

export function invalidateSessionCache() {
  cached = null;
  inFlight = null;
}
