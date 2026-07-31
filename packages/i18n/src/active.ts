import { DEFAULT_LOCALE, type Locale } from "./locale";
import {
  type MessageKey,
  type Translate,
  type TranslateArgs,
  translate,
} from "./translate";

let activeLocale: Locale = DEFAULT_LOCALE;

/**
 * The locale used by code that cannot reach React context — chiefly the Zod
 * messages in `@budget-manager/schemas`, whose `error` callbacks run at *parse*
 * time rather than at definition time and so pick this up on every validation.
 * The web app sets it while it renders the provider; the server never does and
 * therefore always speaks {@link DEFAULT_LOCALE} unless a request localizes it.
 */
export function setActiveLocale(locale: Locale) {
  activeLocale = locale;
}

export function getActiveLocale(): Locale {
  return activeLocale;
}

/**
 * Translate in the active locale. React components must prefer `useI18n()`
 * (`@budget-manager/i18n/react`) instead: it subscribes to the locale, so the
 * text on screen re-renders when the language changes.
 */
export const t: Translate = <K extends MessageKey>(
  key: K,
  ...args: TranslateArgs<K>
) => translate(activeLocale, key, ...args);
