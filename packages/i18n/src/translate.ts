import { DEFAULT_LOCALE, type Locale } from "./locale";
import { messages } from "./messages";

export type MessageKey = keyof typeof messages;

/**
 * The placeholders a message declares, read off the English literal. Adding
 * `{count}` to a message immediately makes every call site that omits it a type
 * error, and a call site that passes a name the message does not use is one
 * too — so a renamed placeholder cannot silently render as `{oldName}`.
 */
type Placeholders<S extends string> =
  S extends `${string}{${infer Name}}${infer Rest}`
    ? Name | Placeholders<Rest>
    : never;

export type MessageParams<K extends MessageKey> = Placeholders<
  (typeof messages)[K]["en"]
>;

/**
 * A placeholder that is itself translatable. Needed where a sentence embeds a
 * domain word — "A {categoryType} category cannot be used…" — because the
 * thrower (a service, an error) knows the enum but not the reader's language.
 */
export type MessageRef = { $key: MessageKey };

export function ref(key: MessageKey): MessageRef {
  return { $key: key };
}

export type MessageValue = string | number | MessageRef;

export type TranslateArgs<K extends MessageKey> = [MessageParams<K>] extends [
  never,
]
  ? []
  : [params: Record<MessageParams<K>, MessageValue>];

const PLACEHOLDER = /\{(\w+)\}/g;

function isRef(value: MessageValue): value is MessageRef {
  return typeof value === "object" && value !== null && "$key" in value;
}

/**
 * `translate` without the placeholder checking, for a caller holding a key and
 * a params bag that only exist as values — a domain error travelling up through
 * a middleware. Prefer {@link translate} anywhere the key is written literally.
 */
export function translateMessage(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, MessageValue>,
): string {
  const entry: Record<Locale, string> = messages[key];
  const template = entry[locale] || entry[DEFAULT_LOCALE];

  if (!params) {
    return template;
  }

  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = params[name];

    if (value === undefined) {
      return match;
    }

    return isRef(value)
      ? translateMessage(locale, value.$key)
      : String(value);
  });
}

export function translate<K extends MessageKey>(
  locale: Locale,
  key: K,
  ...args: TranslateArgs<K>
): string {
  return translateMessage(locale, key, args[0]);
}

/** `translate` with the locale already bound. Written as an interface because a
 * conditional type cannot carry the `K` type parameter through, and losing it
 * would take the placeholder checking with it. */
export interface Translate {
  <K extends MessageKey>(key: K, ...args: TranslateArgs<K>): string;
}
