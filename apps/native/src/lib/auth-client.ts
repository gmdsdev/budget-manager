import { expoClient } from "@better-auth/expo/client";
import { USER_ADDITIONAL_FIELDS } from "@budget-manager/schemas";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { getServerUrl } from "@/lib/server-url";

/**
 * What the Expo plugin contributes, stated by hand because its published
 * declarations cannot be used as they are: `@better-auth/expo` narrows
 * `getActions`' first parameter to a `BetterFetch<CreateFetchOption>`, which is
 * not assignable to the plugin contract's plain `BetterFetch`. Left as shipped it
 * poisons the whole plugin tuple, and with it the `inferAdditionalFields`
 * inference that gives the session its `preferredCurrency` and `preferredLocale`.
 *
 * Declaring the one action the app actually calls keeps `authClient.getCookie()`
 * typed and the session inference intact. The `any` is the plugin contract's own
 * signature, which is what has to be satisfied for the tuple to check.
 */
type ExpoCookiePlugin = {
  id: "expo";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getActions: (...args: any[]) => { getCookie: () => string };
};

/**
 * The plugin is what makes a cookie session work without a browser: it keeps the
 * `set-cookie` better-auth issues in the OS keychain and replays it on every
 * request, and identifies the app to the server with an `expo-origin` header —
 * which is why `packages/auth` trusts the `kivo://` scheme and the Hono CORS
 * config allows that header.
 */
const expoPlugin = expoClient({
  scheme: "kivo",
  storagePrefix: "kivo",
  storage: SecureStore,
}) as unknown as ExpoCookiePlugin;

/**
 * `inferAdditionalFields` is fed the same `USER_ADDITIONAL_FIELDS` the server
 * instance is, so a field's name, optionality and default cannot drift between
 * the two — the same bargain the web client makes.
 */
export const authClient = createAuthClient({
  baseURL: new URL("/api/auth", getServerUrl()).toString(),
  plugins: [expoPlugin, inferAdditionalFields({ user: USER_ADDITIONAL_FIELDS })],
});

/**
 * The cookie the tRPC link has to send. better-auth's own fetch goes through the
 * Expo plugin, but the tRPC client is a separate `fetch` and has to be handed the
 * stored cookie explicitly.
 */
export function getStoredCookie(): string {
  return authClient.getCookie();
}
