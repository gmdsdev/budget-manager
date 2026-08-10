import { db as sharedDb, type Db } from "@budget-manager/db";
import * as schema from "@budget-manager/db/schema/auth";
import { env } from "@budget-manager/env/server";
import { USER_ADDITIONAL_FIELDS } from "@budget-manager/schemas";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

/**
 * The native app has no browser origin: `@better-auth/expo` identifies itself
 * with an `expo-origin` header carrying the app's scheme, which has to be
 * trusted the same way `CORS_ORIGIN` is.
 */
const NATIVE_SCHEME = "kivo://";

/**
 * Expo Go cannot register a custom scheme, so `Linking.createURL` there ignores
 * `kivo` and reports the bundler instead (`exp://127.0.0.1:8081`) — which is the
 * origin the plugin then sends, and an untrusted one is a `403 Invalid origin` on
 * the sign-in request itself. `@better-auth/expo` trusts this scheme on its own,
 * but only when `process.env.NODE_ENV` is literally `"development"`, and nothing
 * in this repo sets it; `packages/env` only *defaults* its own `NODE_ENV` to that
 * value. Trusted here instead so the allowance keys off the validated env rather
 * than a variable the dev scripts would have to remember to export.
 */
const EXPO_GO_SCHEME = "exp://";

function trustedOrigins() {
  return env.NODE_ENV === "development"
    ? [env.CORS_ORIGIN, NATIVE_SCHEME, EXPO_GO_SCHEME]
    : [env.CORS_ORIGIN, NATIVE_SCHEME];
}

export function createAuth(db: Db = sharedDb) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins: trustedOrigins(),
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    user: {
      additionalFields: USER_ADDITIONAL_FIELDS,
    },
    // No `user.create` hook seeding categories any more: the default set is
    // written by `category.ensureDefaults` when onboarding saves the language,
    // so it can carry the names of the language the user actually picked.
    advanced: {
      database: {
        generateId: false,
      },
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [expo()],
  });
}

export const auth = createAuth();
