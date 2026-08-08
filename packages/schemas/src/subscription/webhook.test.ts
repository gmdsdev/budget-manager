import { describe, expect, test } from "bun:test";

import { SubscriptionStatus } from "./subscription.schema";
import {
  type IncomingSubscription,
  type MirroredSubscription,
  shouldApplyPolarSubscription,
} from "./webhook";

const EARLIER = new Date("2026-08-01T10:00:00.000Z");
const LATER = new Date("2026-08-01T10:05:00.000Z");

function stored(
  overrides: Partial<MirroredSubscription> = {},
): MirroredSubscription {
  return {
    polarSubscriptionId: "sub_a",
    polarModifiedAt: LATER,
    status: SubscriptionStatus.ACTIVE,
    ...overrides,
  };
}

function incoming(
  overrides: Partial<IncomingSubscription> = {},
): IncomingSubscription {
  return {
    polarSubscriptionId: "sub_a",
    polarModifiedAt: LATER,
    status: SubscriptionStatus.ACTIVE,
    ...overrides,
  };
}

describe("shouldApplyPolarSubscription", () => {
  test("the first event for an account is always applied", () => {
    expect(shouldApplyPolarSubscription(null, incoming())).toBe(true);
  });

  test("a row that carries no subscription id yet is adopted", () => {
    expect(
      shouldApplyPolarSubscription(
        stored({ polarSubscriptionId: null }),
        incoming(),
      ),
    ).toBe(true);
  });

  test("a retried event carrying older state is ignored", () => {
    expect(
      shouldApplyPolarSubscription(
        stored({ polarModifiedAt: LATER, status: SubscriptionStatus.ACTIVE }),
        incoming({
          polarModifiedAt: EARLIER,
          status: SubscriptionStatus.INCOMPLETE,
        }),
      ),
    ).toBe(false);
  });

  test("a newer event for the same subscription is applied", () => {
    expect(
      shouldApplyPolarSubscription(
        stored({ polarModifiedAt: EARLIER }),
        incoming({ polarModifiedAt: LATER }),
      ),
    ).toBe(true);
  });

  test("a redelivery of the very same event is applied, since it changes nothing", () => {
    expect(shouldApplyPolarSubscription(stored(), incoming())).toBe(true);
  });

  test("a dead sibling subscription never overwrites a live one", () => {
    expect(
      shouldApplyPolarSubscription(
        stored({ polarSubscriptionId: "sub_new", status: SubscriptionStatus.ACTIVE }),
        incoming({
          polarSubscriptionId: "sub_old",
          status: SubscriptionStatus.CANCELED,
        }),
      ),
    ).toBe(false);
  });

  test("a live sibling subscription replaces a dead one", () => {
    expect(
      shouldApplyPolarSubscription(
        stored({
          polarSubscriptionId: "sub_old",
          status: SubscriptionStatus.CANCELED,
        }),
        incoming({
          polarSubscriptionId: "sub_new",
          status: SubscriptionStatus.TRIALING,
        }),
      ),
    ).toBe(true);
  });

  test("a live sibling replaces another live one, whichever arrives last", () => {
    expect(
      shouldApplyPolarSubscription(
        stored({ polarSubscriptionId: "sub_old" }),
        incoming({
          polarSubscriptionId: "sub_new",
          status: SubscriptionStatus.ACTIVE,
        }),
      ),
    ).toBe(true);
  });

  test("a dead sibling replaces a dead one, so the newest refusal is what is stored", () => {
    expect(
      shouldApplyPolarSubscription(
        stored({
          polarSubscriptionId: "sub_old",
          status: SubscriptionStatus.CANCELED,
        }),
        incoming({
          polarSubscriptionId: "sub_new",
          status: SubscriptionStatus.UNPAID,
        }),
      ),
    ).toBe(true);
  });

  test("an event with no timestamp is applied rather than dropped", () => {
    expect(
      shouldApplyPolarSubscription(
        stored(),
        incoming({ polarModifiedAt: null }),
      ),
    ).toBe(true);
  });
});
