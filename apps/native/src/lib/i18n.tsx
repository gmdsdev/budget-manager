import {
  DEFAULT_LOCALE,
  type Locale,
  setActiveLocale,
  toLocale,
} from "@budget-manager/i18n";
import { I18nProvider } from "@budget-manager/i18n/react";
import { toPreferredLocale } from "@budget-manager/schemas";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

/**
 * The language is a property of the account (`user.preferredLocale`), but the session
 * arrives over the network and the login screen has none at all. This mirror is what
 * the app reads until then, so a returning user never sees a flash of English before
 * their session lands. Same key the web uses.
 */
const STORAGE_KEY = "kivo-locale";

function deviceLocale(): Locale {
  try {
    // `toLocale` matches on the language subtag, so a device set to `pt-PT` still
    // lands on the Brazilian catalog.
    return toLocale(getLocales()[0]?.languageTag);
  } catch {
    return DEFAULT_LOCALE;
  }
}

/**
 * The last language seen, held outside React so signing out — which drops the session
 * and with it the account's locale — falls back to what the user was reading rather
 * than to English.
 */
let fallbackLocale: Locale = deviceLocale();

// Applied before React mounts. `t()` in `@budget-manager/schemas` reads the active
// locale at *validation* time, and the tRPC client reads it to set the request's
// `x-locale`, so neither can be left speaking the wrong language on first paint.
setActiveLocale(fallbackLocale);

/**
 * Unlike localStorage, `AsyncStorage` cannot be read during that module-load pass, so
 * the stored choice arrives a tick later and has to reach React as state — otherwise a
 * signed-out reader whose device is in another language sees the wrong one until
 * something else happens to re-render.
 */
const storedLocale = AsyncStorage.getItem(STORAGE_KEY)
  .then((stored) => (stored ? toLocale(stored) : null))
  .catch(() => null);

export function AppI18nProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const [storedFallback, setStoredFallback] = useState<Locale>(fallbackLocale);

  useEffect(() => {
    let cancelled = false;

    void storedLocale.then((stored) => {
      if (stored && !cancelled) {
        setStoredFallback(stored);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Derived, not state: the session is the source of truth once it lands, and deriving
  // during render means no effect has to catch up to it. Read through the optional
  // chain, though: better-auth nulls a session payload out only when it is exactly
  // `{ session: null, user: null }`, so anything else the endpoint answers with lands
  // here as `data` — and this provider wraps the whole app, so an unexpected shape
  // would take it down at render instead of degrading to the last language read.
  const locale = session?.user
    ? toPreferredLocale(session.user.preferredLocale)
    : storedFallback;

  useEffect(() => {
    fallbackLocale = locale;
    void AsyncStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}
