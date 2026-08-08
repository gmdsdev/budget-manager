export const SUBSCRIPTION_SLUG = "subscription";

export const CHECKOUT_BODY_KEYS = ["slug", "redirect"] as const;

const ALLOWED = new Set<string>(CHECKOUT_BODY_KEYS);

export type CheckoutBodyRejection =
  | { reason: "malformed" }
  | { reason: "unknownKeys"; keys: string[] }
  | { reason: "unknownSlug" };

export function rejectCheckoutBody(body: unknown): CheckoutBodyRejection | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { reason: "malformed" };
  }

  const keys = Object.keys(body).filter((key) => !ALLOWED.has(key));

  if (keys.length > 0) {
    return { reason: "unknownKeys", keys };
  }

  if ((body as { slug?: unknown }).slug !== SUBSCRIPTION_SLUG) {
    return { reason: "unknownSlug" };
  }

  return null;
}
