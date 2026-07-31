import { authClient } from "@/lib/auth-client";
import {
  DEFAULT_LOCALE,
  type Locale,
  setActiveLocale,
  toLocale,
} from "@budget-manager/i18n";
import { I18nProvider } from "@budget-manager/i18n/react";
import { toPreferredLocale } from "@budget-manager/schemas";
import { useEffect } from "react";

/**
 * The language is a property of the account (`user.preferredLocale`), but the
 * session arrives over the network and the login screen has none at all. This
 * mirror is what the app reads until then, so a returning user never sees a
 * flash of English before their session lands.
 */
const STORAGE_KEY = "kivo-locale";

function readStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    // Nothing stored yet: the browser's own language is a better first guess
    // than the default, and `toLocale` matches on the language subtag, so
    // `pt-PT` still lands on the Portuguese catalog.
    return toLocale(stored ?? window.navigator.language);
  } catch {
    return DEFAULT_LOCALE;
  }
}

function writeStoredLocale(locale: Locale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // A blocked localStorage costs the pre-session guess, nothing more.
  }
}

/**
 * The last language seen, held outside React so signing out — which drops the
 * session and with it `sessionLocale` — falls back to what the user was reading
 * rather than to English.
 */
let fallbackLocale = readStoredLocale();

// Applied before React mounts. `t()` in `@budget-manager/schemas` reads the
// active locale at *validation* time, and the tRPC client reads it to set the
// request's `x-locale`, so neither can be left speaking English on first paint.
setActiveLocale(fallbackLocale);

export function AppI18nProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();

  // Derived, not state: the session is the source of truth once it lands, and
  // deriving during render means no effect has to catch up to it.
  const locale = session
    ? toPreferredLocale(session.user.preferredLocale)
    : fallbackLocale;

  useEffect(() => {
    fallbackLocale = locale;
    writeStoredLocale(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}
