import { createContext, useContext, useMemo } from "react";

import { getActiveLocale, setActiveLocale } from "./active";
import {
  type DateStyle,
  formatDate,
  formatDateString,
  formatMonthString,
} from "./format";
import { DEFAULT_LOCALE, type Locale } from "./locale";
import {
  type MessageKey,
  type Translate,
  type TranslateArgs,
  translate,
} from "./translate";

export type I18nValue = {
  locale: Locale;
  t: Translate;
  formatDate: (date: Date, style: DateStyle) => string;
  formatDateString: (value: string, style: DateStyle) => string;
  formatMonthString: (value: string, style: DateStyle) => string;
};

function valueFor(locale: Locale): I18nValue {
  return {
    locale,
    t: <K extends MessageKey>(key: K, ...args: TranslateArgs<K>) =>
      translate(locale, key, ...args),
    formatDate: (date, style) => formatDate(locale, date, style),
    formatDateString: (value, style) => formatDateString(locale, value, style),
    formatMonthString: (value, style) =>
      formatMonthString(locale, value, style),
  };
}

/**
 * Defaulted rather than left undefined so a primitive rendered outside the
 * provider — a unit test mounting one component, a Storybook-style harness —
 * still renders text instead of throwing.
 */
const I18nContext = createContext<I18nValue>(valueFor(DEFAULT_LOCALE));

/**
 * Controlled: the app owns where the locale comes from (the signed-in user's
 * preference, a stored fallback, the browser), so this package needs to know
 * nothing about sessions or storage.
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  // Set during render, not in an effect. The Zod messages in
  // `@budget-manager/schemas` read the active locale when a form *validates*,
  // and a form can validate on the same commit this provider first renders —
  // an effect would leave that first pass speaking the previous language.
  // Idempotent, so React's double-invoked renders cost nothing.
  if (getActiveLocale() !== locale) {
    setActiveLocale(locale);
  }

  const value = useMemo(() => valueFor(locale), [locale]);

  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

/** The common case: only the translator is needed. */
export function useTranslate(): Translate {
  return useContext(I18nContext).t;
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale;
}
