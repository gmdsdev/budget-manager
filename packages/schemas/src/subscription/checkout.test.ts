import { describe, expect, test } from "bun:test";

import { rejectCheckoutBody, SUBSCRIPTION_SLUG } from "./checkout";

describe("rejectCheckoutBody", () => {
  test("accepts the only body the app ever sends", () => {
    expect(rejectCheckoutBody({ slug: SUBSCRIPTION_SLUG })).toBeNull();
    expect(
      rejectCheckoutBody({ slug: SUBSCRIPTION_SLUG, redirect: false }),
    ).toBeNull();
  });

  test("refuses a caller-chosen product", () => {
    expect(rejectCheckoutBody({ products: ["prod_something_cheaper"] })).toEqual({
      reason: "unknownKeys",
      keys: ["products"],
    });
  });

  test("refuses a caller-chosen trial", () => {
    expect(
      rejectCheckoutBody({
        slug: SUBSCRIPTION_SLUG,
        allowTrial: true,
        trialInterval: "year",
        trialIntervalCount: 1000,
      }),
    ).toEqual({
      reason: "unknownKeys",
      keys: ["allowTrial", "trialInterval", "trialIntervalCount"],
    });
  });

  test("refuses a caller-chosen discount", () => {
    expect(
      rejectCheckoutBody({ slug: SUBSCRIPTION_SLUG, discountId: "disc_free" }),
    ).toEqual({ reason: "unknownKeys", keys: ["discountId"] });
  });

  test("refuses caller-chosen redirect targets and metadata", () => {
    expect(
      rejectCheckoutBody({
        slug: SUBSCRIPTION_SLUG,
        successUrl: "https://evil.example",
        metadata: { plan: "free" },
      }),
    ).toEqual({ reason: "unknownKeys", keys: ["successUrl", "metadata"] });
  });

  test("refuses a slug that is not the one product we sell", () => {
    expect(rejectCheckoutBody({ slug: "enterprise" })).toEqual({
      reason: "unknownSlug",
    });
    expect(rejectCheckoutBody({})).toEqual({ reason: "unknownSlug" });
  });

  test("refuses anything that is not a plain object", () => {
    expect(rejectCheckoutBody(null)).toEqual({ reason: "malformed" });
    expect(rejectCheckoutBody([{ slug: SUBSCRIPTION_SLUG }])).toEqual({
      reason: "malformed",
    });
    expect(rejectCheckoutBody("slug=subscription")).toEqual({
      reason: "malformed",
    });
  });
});
