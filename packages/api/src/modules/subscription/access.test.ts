import {
  DAY_MS,
  SubscriptionAccessState,
  SubscriptionStatus,
} from "@budget-manager/schemas";
import { describe, expect, test } from "bun:test";

import { deriveSubscriptionAccess, type SubscriptionRow } from "./access";

const NOW = new Date("2026-08-07T12:00:00.000Z");

function daysFromNow(days: number) {
  return new Date(NOW.getTime() + days * DAY_MS);
}

const OUR_PRODUCT = "prod_kivo";

function row(overrides: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    status: SubscriptionStatus.ACTIVE,
    polarProductId: OUR_PRODUCT,
    trialStartsAt: null,
    trialEndsAt: null,
    currentPeriodEnd: daysFromNow(30),
    cancelAtPeriodEnd: false,
    polarCustomerId: "cus_1",
    polarSubscriptionId: "sub_1",
    ...overrides,
  };
}

describe("deriveSubscriptionAccess", () => {
  test("an account Polar has never reported on has nothing to go on", () => {
    const access = deriveSubscriptionAccess(null, NOW);

    expect(access.state).toBe(SubscriptionAccessState.NONE);
    expect(access.hasAccess).toBe(false);
    expect(access.trialEndsAt).toBeNull();
  });

  test("a running Polar trial grants access and counts whole days down", () => {
    const access = deriveSubscriptionAccess(
      row({
        status: SubscriptionStatus.TRIALING,
        trialStartsAt: daysFromNow(-7),
        trialEndsAt: daysFromNow(7),
      }),
      NOW,
    );

    expect(access.state).toBe(SubscriptionAccessState.TRIALING);
    expect(access.hasAccess).toBe(true);
    expect(access.trialDaysRemaining).toBe(7);
  });

  test("a trial with hours left still grants access, and reads as zero days", () => {
    const access = deriveSubscriptionAccess(
      row({
        status: SubscriptionStatus.TRIALING,
        trialEndsAt: new Date(NOW.getTime() + 3 * 60 * 60 * 1000),
      }),
      NOW,
    );

    expect(access.hasAccess).toBe(true);
    expect(access.trialDaysRemaining).toBe(0);
  });

  test("a trial whose end date has passed is refused, even before Polar says so", () => {
    const access = deriveSubscriptionAccess(
      row({
        status: SubscriptionStatus.TRIALING,
        trialEndsAt: daysFromNow(-1),
      }),
      NOW,
    );

    expect(access.state).toBe(SubscriptionAccessState.EXPIRED);
    expect(access.hasAccess).toBe(false);
  });

  test("an active subscription grants access and counts no trial days", () => {
    const access = deriveSubscriptionAccess(
      row({ status: SubscriptionStatus.ACTIVE, trialEndsAt: daysFromNow(-30) }),
      NOW,
    );

    expect(access.state).toBe(SubscriptionAccessState.ACTIVE);
    expect(access.hasAccess).toBe(true);
    expect(access.trialDaysRemaining).toBe(0);
  });

  test("past_due keeps access inside the period it was paid for", () => {
    const access = deriveSubscriptionAccess(
      row({
        status: SubscriptionStatus.PAST_DUE,
        currentPeriodEnd: daysFromNow(2),
      }),
      NOW,
    );

    expect(access.state).toBe(SubscriptionAccessState.PAST_DUE);
    expect(access.hasAccess).toBe(true);
  });

  test("past_due past its period falls through, with nothing scheduled to shut it off", () => {
    const access = deriveSubscriptionAccess(
      row({
        status: SubscriptionStatus.PAST_DUE,
        currentPeriodEnd: daysFromNow(-1),
      }),
      NOW,
    );

    expect(access.state).toBe(SubscriptionAccessState.EXPIRED);
    expect(access.hasAccess).toBe(false);
  });

  test("a cancelled subscription is refused even inside its old period", () => {
    const access = deriveSubscriptionAccess(
      row({
        status: SubscriptionStatus.CANCELED,
        currentPeriodEnd: daysFromNow(20),
      }),
      NOW,
    );

    expect(access.hasAccess).toBe(false);
  });

  test("a subscription cancelled at period end keeps access until that date", () => {
    const access = deriveSubscriptionAccess(
      row({ currentPeriodEnd: daysFromNow(9), cancelAtPeriodEnd: true }),
      NOW,
    );

    expect(access.hasAccess).toBe(true);
    expect(access.cancelAtPeriodEnd).toBe(true);
  });

  test("an abandoned checkout grants nothing", () => {
    const access = deriveSubscriptionAccess(
      row({ status: SubscriptionStatus.INCOMPLETE }),
      NOW,
    );

    expect(access.hasAccess).toBe(false);
  });

  test("an unpaid subscription grants nothing", () => {
    const access = deriveSubscriptionAccess(
      row({ status: SubscriptionStatus.UNPAID }),
      NOW,
    );

    expect(access.hasAccess).toBe(false);
  });

  test("a paid subscription with no period end is open-ended", () => {
    const access = deriveSubscriptionAccess(
      row({ currentPeriodEnd: null }),
      NOW,
    );

    expect(access.hasAccess).toBe(true);
  });

  test("a subscription to another product in the organisation grants nothing", () => {
    const access = deriveSubscriptionAccess(
      row({ polarProductId: "prod_something_else" }),
      NOW,
      OUR_PRODUCT,
    );

    expect(access.state).toBe(SubscriptionAccessState.EXPIRED);
    expect(access.hasAccess).toBe(false);
  });

  test("a trialing subscription to another product grants nothing either", () => {
    const access = deriveSubscriptionAccess(
      row({
        status: SubscriptionStatus.TRIALING,
        trialEndsAt: daysFromNow(7),
        polarProductId: "prod_something_else",
      }),
      NOW,
      OUR_PRODUCT,
    );

    expect(access.hasAccess).toBe(false);
  });

  test("a row with no product recorded is refused once a product is configured", () => {
    expect(
      deriveSubscriptionAccess(row({ polarProductId: null }), NOW, OUR_PRODUCT)
        .hasAccess,
    ).toBe(false);
  });

  test("our own product is honoured", () => {
    expect(deriveSubscriptionAccess(row(), NOW, OUR_PRODUCT).hasAccess).toBe(true);
  });

  test("with no product configured the check does not apply", () => {
    expect(
      deriveSubscriptionAccess(row({ polarProductId: "anything" }), NOW).hasAccess,
    ).toBe(true);
  });

  test("a trial reports its own end date, not the billing period's", () => {
    const trialEndsAt = daysFromNow(4);
    const access = deriveSubscriptionAccess(
      row({
        status: SubscriptionStatus.TRIALING,
        trialEndsAt,
        currentPeriodEnd: daysFromNow(34),
      }),
      NOW,
    );

    expect(access.trialEndsAt).toEqual(trialEndsAt);
    expect(access.currentPeriodEnd).toEqual(daysFromNow(34));
  });
});
