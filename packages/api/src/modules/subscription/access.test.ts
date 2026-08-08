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

function row(overrides: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    trialEndsAt: daysFromNow(7),
    status: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    polarCustomerId: null,
    polarSubscriptionId: null,
    ...overrides,
  };
}

describe("deriveSubscriptionAccess", () => {
  test("a running trial grants access and counts whole days down", () => {
    const access = deriveSubscriptionAccess(
      row({ trialEndsAt: daysFromNow(7) }),
      NOW,
    );

    expect(access.state).toBe(SubscriptionAccessState.TRIALING);
    expect(access.hasAccess).toBe(true);
    expect(access.trialDaysRemaining).toBe(7);
  });

  test("a trial with hours left still grants access, and reads as zero days", () => {
    const access = deriveSubscriptionAccess(
      row({ trialEndsAt: new Date(NOW.getTime() + 3 * 60 * 60 * 1000) }),
      NOW,
    );

    expect(access.hasAccess).toBe(true);
    expect(access.trialDaysRemaining).toBe(0);
  });

  test("an expired trial with nothing paid is the paywall", () => {
    const access = deriveSubscriptionAccess(
      row({ trialEndsAt: daysFromNow(-1) }),
      NOW,
    );

    expect(access.state).toBe(SubscriptionAccessState.EXPIRED);
    expect(access.hasAccess).toBe(false);
    expect(access.trialDaysRemaining).toBe(0);
  });

  test("an active subscription outranks the trial that is still running", () => {
    const access = deriveSubscriptionAccess(
      row({
        trialEndsAt: daysFromNow(3),
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: daysFromNow(30),
      }),
      NOW,
    );

    expect(access.state).toBe(SubscriptionAccessState.ACTIVE);
    expect(access.hasAccess).toBe(true);
  });

  test("an active subscription outlives the trial", () => {
    const access = deriveSubscriptionAccess(
      row({
        trialEndsAt: daysFromNow(-100),
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: daysFromNow(12),
      }),
      NOW,
    );

    expect(access.hasAccess).toBe(true);
  });

  test("a Polar trial counts as paid access", () => {
    const access = deriveSubscriptionAccess(
      row({
        trialEndsAt: daysFromNow(-100),
        status: SubscriptionStatus.TRIALING,
        currentPeriodEnd: daysFromNow(5),
      }),
      NOW,
    );

    expect(access.state).toBe(SubscriptionAccessState.ACTIVE);
    expect(access.hasAccess).toBe(true);
  });

  test("past_due keeps access inside the period it was paid for", () => {
    const access = deriveSubscriptionAccess(
      row({
        trialEndsAt: daysFromNow(-100),
        status: SubscriptionStatus.PAST_DUE,
        currentPeriodEnd: daysFromNow(2),
      }),
      NOW,
    );

    expect(access.state).toBe(SubscriptionAccessState.PAST_DUE);
    expect(access.hasAccess).toBe(true);
  });

  test("past_due past its period falls through to the paywall, with nothing scheduled to shut it off", () => {
    const access = deriveSubscriptionAccess(
      row({
        trialEndsAt: daysFromNow(-100),
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
        trialEndsAt: daysFromNow(-100),
        status: SubscriptionStatus.CANCELED,
        currentPeriodEnd: daysFromNow(20),
      }),
      NOW,
    );

    expect(access.hasAccess).toBe(false);
  });

  test("a subscription cancelled at period end keeps access until that date", () => {
    const access = deriveSubscriptionAccess(
      row({
        trialEndsAt: daysFromNow(-100),
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: daysFromNow(9),
        cancelAtPeriodEnd: true,
      }),
      NOW,
    );

    expect(access.hasAccess).toBe(true);
    expect(access.cancelAtPeriodEnd).toBe(true);
  });

  test("an incomplete checkout grants nothing on its own", () => {
    const access = deriveSubscriptionAccess(
      row({
        trialEndsAt: daysFromNow(-1),
        status: SubscriptionStatus.INCOMPLETE,
        currentPeriodEnd: daysFromNow(30),
      }),
      NOW,
    );

    expect(access.hasAccess).toBe(false);
  });

  test("a paid subscription with no period end is open-ended", () => {
    const access = deriveSubscriptionAccess(
      row({
        trialEndsAt: daysFromNow(-100),
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: null,
      }),
      NOW,
    );

    expect(access.hasAccess).toBe(true);
  });
});
