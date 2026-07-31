import type { Locale } from "../locale";

/**
 * A namespace holds every language for a key side by side rather than shipping
 * one file per locale. Two catalogs in two files drift the moment a key is
 * added to one of them; here a missing translation is a *compile* error on the
 * line that added the key, which is the same bargain the rest of the repo makes
 * with `AppRouter` and the e2e client.
 */
export type MessageTable = Record<string, Record<Locale, string>>;
