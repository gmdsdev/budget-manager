/**
 * The languages the app ships. The values are BCP-47 tags rather than bare
 * language codes so `Intl` and `document.documentElement.lang` can take them
 * unchanged — a locale that needs a region to format dates correctly must not
 * have to be mapped to one at every call site.
 */
export enum Locale {
  EN = "en",
  PT_BR = "pt-BR",
}

export const LOCALES = Object.values(Locale);

/**
 * English is the default, and the e2e suite reads the app in it. Changing this
 * changes what every unlocalized visitor and every browser test sees.
 */
export const DEFAULT_LOCALE = Locale.EN;

/**
 * Each language names itself. A speaker looking for their own language in a
 * list they cannot read finds "Português", never "Portuguese".
 */
export const LocaleLabelMap: Record<Locale, string> = {
  [Locale.EN]: "English",
  [Locale.PT_BR]: "Português (Brasil)",
};

const LOCALE_VALUES = new Set<string>(LOCALES);

export function isLocale(value: string): value is Locale {
  return LOCALE_VALUES.has(value);
}

/**
 * Narrows a stored or negotiated value to a supported locale. Falls back rather
 * than throwing: a code that was dropped from the enum must not be able to
 * reach a `<Select>` as a value with no matching item, and an
 * `Accept-Language` header is attacker-controlled input.
 *
 * Matching is done on the language subtag too, so `pt`, `pt-PT` and `pt-br`
 * all resolve to the Brazilian Portuguese catalog instead of silently
 * falling back to English.
 */
export function toLocale(value: string | null | undefined): Locale {
  if (!value) {
    return DEFAULT_LOCALE;
  }

  const normalized = value.trim();

  if (isLocale(normalized)) {
    return normalized;
  }

  const language = normalized.toLowerCase().split("-")[0];

  return (
    LOCALES.find((locale) => locale.toLowerCase().split("-")[0] === language) ??
    DEFAULT_LOCALE
  );
}
