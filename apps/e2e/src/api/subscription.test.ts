import { SubscriptionAccessState, TRIAL_DAYS } from "@budget-manager/schemas";
import { beforeAll, describe, expect, test } from "bun:test";

import {
  anonymousClient,
  errorCodeOf,
  signUpClient,
  type ApiClient,
} from "../support/api";
import { requireServer } from "../support/env";

let api: ApiClient;

beforeAll(async () => {
  await requireServer();
  api = (await signUpClient()).client;
});

describe("subscription", () => {
  test("a new account has no subscription of its own: the trial is Polar's to start", async () => {
    const status = await api.subscription.status.query();

    expect(status.status).toBeNull();
    expect(status.trialEndsAt).toBeNull();
    expect(status.trialDaysRemaining).toBe(0);
    expect(status.trialDays).toBe(TRIAL_DAYS);
  });

  test("a deployment that cannot sell does not refuse an account Polar has never reported on", async () => {
    const status = await api.subscription.status.query();

    expect(status.billingEnabled).toBe(false);
    expect(status.state).toBe(SubscriptionAccessState.UNMANAGED);
    expect(status.hasAccess).toBe(true);
  });

  test("every gated route is reachable with access", async () => {
    await Promise.all([
      api.wallet.getAll.query({}),
      api.category.getAll.query({}),
      api.creditCard.getAll.query({}),
      api.transaction.getAll.query({}),
      api.budget.getAll.query({}),
      api.dashboard.getSummary.query({}),
    ]);
  });

  test("the status route is not itself behind the paywall", async () => {
    expect(
      await errorCodeOf(anonymousClient().subscription.status.query()),
    ).toBe("UNAUTHORIZED");
  });

  test("a signed-out caller is refused before the paywall ever runs", async () => {
    expect(await errorCodeOf(anonymousClient().wallet.getAll.query({}))).toBe(
      "UNAUTHORIZED",
    );
  });
});
