import { useCallback, useSyncExternalStore } from "react";

/** Everything below Tailwind's `md` (48rem). */
const COMPACT_QUERY = "(max-width: 47.99rem)";

function supported() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

function evaluate(query: string) {
  return supported() ? window.matchMedia(query).matches : false;
}

const NOOP = () => {};

export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!supported()) return NOOP;

      const list = window.matchMedia(query);

      if (typeof list.addEventListener !== "function") return NOOP;

      list.addEventListener("change", onChange);

      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => evaluate(query),
    () => false,
  );
}

/**
 * Below Tailwind's `md`. Layouts that swap one element for another — a table for
 * a card list — have to branch in JS rather than with `md:hidden`: rendering
 * both would duplicate every cell for screen readers and for any query that
 * expects a single match.
 *
 * It reads false when `matchMedia` is missing, so a non-browser environment gets
 * the wide layout.
 */
export function useIsCompact() {
  return useMediaQuery(COMPACT_QUERY);
}
