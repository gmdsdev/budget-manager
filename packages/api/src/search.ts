import { z } from "zod";

export const SEARCH_TERM_MAX_LENGTH = 120;

export const SearchTermInput = z
  .string()
  .trim()
  .max(SEARCH_TERM_MAX_LENGTH)
  .optional();

/**
 * A LIKE/ILIKE pattern matching rows that contain `term`. Wildcards in the term
 * are escaped, so searching for "50%" looks for that text rather than matching
 * everything after "50".
 */
export function containsPattern(term: string) {
  return `%${term.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}
