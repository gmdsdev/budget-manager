import { env } from "@budget-manager/env/native";
import Constants from "expo-constants";

const DEV_SERVER_PORT = 3000;

/**
 * The native twin of the web's `getServerUrl`. A phone has no origin to resolve
 * a relative path against, so `EXPO_PUBLIC_SERVER_URL` is the answer whenever it
 * is set — and in development, when it usually is not, the Metro host is: a
 * device on the same network reaches the API at the machine running the bundler,
 * which `localhost` would resolve to the phone itself.
 *
 * Resolved here rather than at each call site because both the tRPC link and
 * better-auth read it, and two copies could drift into pointing the API and the
 * auth cookie at different origins — the split a session does not survive.
 */
export function getServerUrl(): string {
  const configured = env.EXPO_PUBLIC_SERVER_URL;

  if (configured) {
    return configured.endsWith("/") ? configured.slice(0, -1) : configured;
  }

  const host = metroHost();

  return host
    ? `http://${host}:${DEV_SERVER_PORT}`
    : `http://localhost:${DEV_SERVER_PORT}`;
}

function metroHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)
      ?.debuggerHost;

  return hostUri?.split(":")[0] ?? null;
}
