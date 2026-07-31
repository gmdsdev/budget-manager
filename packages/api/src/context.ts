import { auth } from "@budget-manager/auth";
import { toLocale } from "@budget-manager/i18n";
import type { Context as HonoContext } from "hono";
import { services } from "./containers";

export type CreateContextOptions = {
  context: HonoContext;
};

/**
 * The header the web client sends, carrying the language the *user* chose. It
 * takes precedence over `Accept-Language`, which reports what the browser is
 * installed in — a different thing, and only a fallback for a caller with no
 * preference of its own (the e2e API suite, a script).
 */
const LOCALE_HEADER = "x-locale";

export async function createContext({ context }: CreateContextOptions) {
  const headers = context.req.raw.headers;
  const session = await auth.api.getSession({ headers });

  return {
    session,
    services,
    locale: toLocale(
      headers.get(LOCALE_HEADER) ?? headers.get("accept-language"),
    ),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
