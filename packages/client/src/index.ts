/**
 * The platform-agnostic half of the client: row shapes, filter state, the query
 * inputs that drop their sentinels, pagination and month arithmetic, and the error
 * copy every caller shows. No DOM and no React — `./react` is where the two hooks
 * that need it live.
 *
 * Both apps read this one copy. A filter that exists on the web and not on the phone
 * is a bug in a screen, not a difference in what the two know how to ask for.
 */
export * from "./budget";
export * from "./budget-repeats";
export * from "./category";
export * from "./credit-card";
export * from "./dashboard";
export * from "./date-range";
export * from "./errors";
export * from "./month";
export * from "./pagination";
export * from "./recurring";
export * from "./transaction";
export * from "./transaction-repeats";
export * from "./wallet";
