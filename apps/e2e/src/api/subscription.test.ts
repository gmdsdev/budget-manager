import {
  SubscriptionAccessState,
  TRIAL_DAYS,
} from "@budget-manager/schemas";
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
  test("a new account is put on the trial by the sign-up hook", async () => {
    const status = await api.subscription.status.query();

    expect(status.state).toBe(SubscriptionAccessState.TRIALING);
    expect(status.hasAccess).toBe(true);
    expect(status.status).toBeNull();
    expect(status.trialDays).toBe(TRIAL_DAYS);
  });

  test("the trial runs the full fortnight from sign-up", async () => {
    const status = await api.subscription.status.query();
    const daysLeft =
      (new Date(status.trialEndsAt).getTime() - Date.now()) / 86_400_000;

    expect(daysLeft).toBeGreaterThan(TRIAL_DAYS - 1);
    expect(daysLeft).toBeLessThanOrEqual(TRIAL_DAYS);
    expect(status.trialDaysRemaining).toBe(TRIAL_DAYS - 1);
  });

  test("the trial lets every gated route through", async () => {
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
    expect(await errorCodeOf(anonymousClient().subscription.status.query())).toBe(
      "UNAUTHORIZED",
    );
  });

  test("a signed-out caller is refused before the paywall ever runs", async () => {
    expect(await errorCodeOf(anonymousClient().wallet.getAll.query({}))).toBe(
      "UNAUTHORIZED",
    );
  });
});
