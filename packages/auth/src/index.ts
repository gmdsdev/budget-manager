import { db as sharedDb, type Db } from "@budget-manager/db";
import { ensureDefaultCategories } from "@budget-manager/db/defaults/categories";
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

export function createAuth(db: Db = sharedDb) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN, NATIVE_SCHEME],
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    user: {
      additionalFields: USER_ADDITIONAL_FIELDS,
    },
    databaseHooks: {
      user: {
        create: {
          after: async (createdUser) => {
            try {
              await ensureDefaultCategories({ db, userId: createdUser.id });
            } catch (error) {
              console.error(
                `Failed to create default categories for user ${createdUser.id}`,
                error,
              );
            }
          },
        },
      },
    },
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
