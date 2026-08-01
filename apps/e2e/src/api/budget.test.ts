import {
  BudgetStatus,
  CategoryType,
  RecurrenceType,
  TransactionStatus,
  WalletCurrency,
} from "@budget-manager/schemas";
import { beforeAll, describe, expect, test } from "bun:test";

import { errorCodeOf, signUpClient, type ApiClient } from "../support/api";
import { requireServer } from "../support/env";
import {
  budget,
  card,
  cardPurchase,
  category,
  dayIn,
  seedBasics,
  shiftMonthKey,
  transaction,
  wallet,
} from "../support/fixtures";

let api: ApiClient;

/**
 * The month the *server* thinks it is. `bun test` runs in UTC and the server in
 * the machine's own zone, so deriving this from the test process's clock makes
 * the suite fail on the last evening of every month.
 */
let today: string;

/** A month key `offset` months from the server's own current month. */
function month(offset = 0) {
  return shiftMonthKey(today, offset);
}

beforeAll(async () => {
  await requireServer();
  api = (await signUpClient()).client;
  today = (await api.budget.getMonth.query({})).month;
});

async function freshUser() {
  const client = (await signUpClient()).client;
  const seed = await seedBasics(client);

  return { client, ...seed };
}

async function monthRowFor(
  client: ApiClient,
  categoryId: string,
  month?: string,
) {
  const view = await client.budget.getMonth.query(month ? { month } : {});

  return view.rows.find((row) => row.categoryId === categoryId);
}

describe("budgets", () => {
  test("is empty for a new user", async () => {
    const page = await api.budget.getAll.query({});

    expect(page.rows).toEqual([]);
    expect(page.total).toBe(0);
  });

  test("a monthly budget materializes this month and the horizon ahead", async () => {
    const { client, groceries } = await freshUser();

    const created = await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 100_000, startsOn: month() }),
    );

    // The month it starts in, plus twelve.
    expect(created.generated).toBe(13);

    const periods = await client.budget.periods.query({ id: created.id });

    expect(periods.rows).toHaveLength(13);
    expect(periods.rows[0]?.periodMonth).toBe(month());
    expect(periods.rows.at(-1)?.periodMonth).toBe(month(12));
    // Every month follows the series until one is changed.
    expect(periods.rows.every((row) => row.limitCents === 100_000)).toBe(true);
    expect(periods.rows.every((row) => !row.isOverride)).toBe(true);
  });

  test("a fixed budget produces exactly its number of months", async () => {
    const { client, groceries } = await freshUser();

    const created = await client.budget.create.mutate(
      budget(groceries.id, {
        recurrenceType: RecurrenceType.FIXED,
        installments: 3,
        startsOn: month(),
      }),
    );

    expect(created.generated).toBe(3);

    const periods = await client.budget.periods.query({ id: created.id });

    expect(periods.rows.map((row) => row.periodMonth)).toEqual([
      month(),
      month(1),
      month(2),
    ]);
  });

  test("an interval skips the months in between", async () => {
    const { client, groceries } = await freshUser();

    const created = await client.budget.create.mutate(
      budget(groceries.id, {
        recurrenceType: RecurrenceType.FIXED,
        interval: 3,
        installments: 3,
        startsOn: month(),
      }),
    );

    const periods = await client.budget.periods.query({ id: created.id });

    expect(periods.rows.map((row) => row.periodMonth)).toEqual([
      month(),
      month(3),
      month(6),
    ]);
  });

  test("refuses a second budget for the same category and currency", async () => {
    const { client, groceries } = await freshUser();

    await client.budget.create.mutate(budget(groceries.id));

    expect(
      await errorCodeOf(client.budget.create.mutate(budget(groceries.id))),
    ).toBe("CONFLICT");
  });

  test("allows the same category in another currency", async () => {
    const { client, groceries } = await freshUser();

    await client.budget.create.mutate(budget(groceries.id));

    const second = await client.budget.create.mutate(
      budget(groceries.id, { currencyCode: WalletCurrency.USD }),
    );

    expect(second.generated).toBeGreaterThan(0);
  });

  test("refuses an income category", async () => {
    const { client, salary } = await freshUser();

    expect(
      await errorCodeOf(client.budget.create.mutate(budget(salary.id))),
    ).toBe("CONFLICT");
  });

  test("refuses an archived category", async () => {
    const { client } = await freshUser();
    const gym = await client.category.create.mutate(
      category({ name: "Gym", type: CategoryType.EXPENSE }),
    );

    await client.category.archive.mutate({ id: gym.id });

    expect(await errorCodeOf(client.budget.create.mutate(budget(gym.id)))).toBe(
      "CONFLICT",
    );
  });

  test("refuses a fixed budget with no month count", async () => {
    const { client, groceries } = await freshUser();

    expect(
      await errorCodeOf(
        client.budget.create.mutate(
          budget(groceries.id, {
            recurrenceType: RecurrenceType.FIXED,
            installments: null,
          }),
        ),
      ),
    ).toBe("BAD_REQUEST");
  });
});

describe("budget month view", () => {
  test("counts settled and scheduled spending, and reports what is left", async () => {
    const { client, checking, groceries } = await freshUser();

    await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 100_000, startsOn: month() }),
    );

    await client.transaction.create.mutate(
      transaction(checking.id, {
        name: "Market",
        amountCents: 30_000,
        categoryId: groceries.id,
        occurrenceDate: dayIn(month(), 3),
        status: TransactionStatus.PAID,
      }),
    );
    await client.transaction.create.mutate(
      transaction(checking.id, {
        name: "Market later",
        amountCents: 25_000,
        categoryId: groceries.id,
        occurrenceDate: dayIn(month(), 20),
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    );

    const row = await monthRowFor(client, groceries.id);

    expect(row?.spentCents).toBe(30_000);
    expect(row?.projectedSpentCents).toBe(55_000);
    // What is still spendable is measured against the commitment.
    expect(row?.remainingCents).toBe(45_000);
    expect(row?.status).toBe(BudgetStatus.ON_TRACK);
  });

  test("a card purchase spends its category's budget", async () => {
    const { client, checking, groceries } = await freshUser();

    const visa = await client.creditCard.create.mutate(
      card({ defaultBillingWalletId: checking.id }),
    );

    await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 100_000, startsOn: month() }),
    );
    await client.transaction.createCardPurchase.mutate(
      cardPurchase(visa.id, {
        name: "Market on card",
        amountCents: 40_000,
        categoryId: groceries.id,
        occurrenceDate: dayIn(month(), 4),
      }),
    );

    const row = await monthRowFor(client, groceries.id);

    expect(row?.projectedSpentCents).toBe(40_000);
    expect(row?.remainingCents).toBe(60_000);
  });

  test("spending in another currency never touches the budget", async () => {
    const { client, groceries } = await freshUser();

    const dollars = await client.wallet.create.mutate(
      wallet({ name: "Dollars", currencyCode: WalletCurrency.USD }),
    );

    await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 100_000, startsOn: month() }),
    );
    await client.transaction.create.mutate(
      transaction(dollars.id, {
        name: "US market",
        amountCents: 90_000,
        categoryId: groceries.id,
        occurrenceDate: dayIn(month(), 6),
      }),
    );

    const row = await monthRowFor(client, groceries.id);

    expect(row?.projectedSpentCents).toBe(0);
    expect(row?.remainingCents).toBe(100_000);
  });

  test("last month's spending stays in last month", async () => {
    const { client, checking, groceries } = await freshUser();

    await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 100_000, startsOn: month(-1) }),
    );
    await client.transaction.create.mutate(
      transaction(checking.id, {
        name: "Old market",
        amountCents: 70_000,
        categoryId: groceries.id,
        occurrenceDate: dayIn(month(-1), 9),
      }),
    );

    const thisMonth = await monthRowFor(client, groceries.id);
    const lastMonth = await monthRowFor(client, groceries.id, month(-1));

    expect(thisMonth?.projectedSpentCents).toBe(0);
    expect(lastMonth?.projectedSpentCents).toBe(70_000);
  });

  test("overspending reads as a negative remainder", async () => {
    const { client, checking, groceries } = await freshUser();

    await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 50_000, startsOn: month() }),
    );
    await client.transaction.create.mutate(
      transaction(checking.id, {
        name: "Big shop",
        amountCents: 80_000,
        categoryId: groceries.id,
        occurrenceDate: dayIn(month(), 7),
      }),
    );

    const row = await monthRowFor(client, groceries.id);

    expect(row?.remainingCents).toBe(-30_000);
    expect(row?.status).toBe(BudgetStatus.EXCEEDED);
  });

  test("totals are reported per currency and never summed across them", async () => {
    const { client, groceries } = await freshUser();
    const gym = await client.category.create.mutate(
      category({ name: "Gym", type: CategoryType.EXPENSE }),
    );

    await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 100_000, startsOn: month() }),
    );
    await client.budget.create.mutate(
      budget(gym.id, {
        amountCents: 40_000,
        currencyCode: WalletCurrency.USD,
        startsOn: month(),
      }),
    );

    const view = await client.budget.getMonth.query({});

    expect(view.totals.map((row) => row.currencyCode)).toEqual(["BRL", "USD"]);
    expect(view.totals[0]?.limitCents).toBe(100_000);
    expect(view.totals[1]?.limitCents).toBe(40_000);
  });
});

describe("editing a single month", () => {
  test("changing one month leaves the rest of the series alone", async () => {
    const { client, groceries } = await freshUser();

    const created = await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 100_000, startsOn: month() }),
    );
    const before = await client.budget.periods.query({ id: created.id });
    const next = before.rows.find((row) => row.periodMonth === month(1));

    await client.budget.setPeriodAmount.mutate({
      id: next?.periodId ?? "",
      amountCents: 250_000,
    });

    const after = await client.budget.periods.query({ id: created.id });
    const changed = after.rows.find((row) => row.periodMonth === month(1));
    const untouched = after.rows.find((row) => row.periodMonth === month(2));

    expect(changed?.limitCents).toBe(250_000);
    expect(changed?.isOverride).toBe(true);
    expect(untouched?.limitCents).toBe(100_000);
  });

  test("editing the series does not overwrite a month set by hand", async () => {
    const { client, groceries } = await freshUser();

    const created = await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 100_000, startsOn: month() }),
    );
    const before = await client.budget.periods.query({ id: created.id });
    const pinned = before.rows.find((row) => row.periodMonth === month(1));

    await client.budget.setPeriodAmount.mutate({
      id: pinned?.periodId ?? "",
      amountCents: 250_000,
    });

    // "A new limit for all future months."
    await client.budget.update.mutate({
      id: created.id,
      ...budget(groceries.id, { amountCents: 70_000, startsOn: month() }),
    });

    const after = await client.budget.periods.query({ id: created.id });

    expect(
      after.rows.find((row) => row.periodMonth === month(1))?.limitCents,
    ).toBe(250_000);
    expect(
      after.rows.find((row) => row.periodMonth === month(2))?.limitCents,
    ).toBe(70_000);
    expect(
      after.rows.find((row) => row.periodMonth === month())?.limitCents,
    ).toBe(70_000);
  });

  test("a month handed back to the series takes the series' current limit", async () => {
    const { client, groceries } = await freshUser();

    const created = await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 100_000, startsOn: month() }),
    );
    const before = await client.budget.periods.query({ id: created.id });
    const pinned = before.rows.find((row) => row.periodMonth === month(1));

    await client.budget.setPeriodAmount.mutate({
      id: pinned?.periodId ?? "",
      amountCents: 250_000,
    });
    await client.budget.update.mutate({
      id: created.id,
      ...budget(groceries.id, { amountCents: 70_000, startsOn: month() }),
    });
    await client.budget.resetPeriod.mutate({ id: pinned?.periodId ?? "" });

    const after = await client.budget.periods.query({ id: created.id });
    const released = after.rows.find((row) => row.periodMonth === month(1));

    expect(released?.limitCents).toBe(70_000);
    expect(released?.isOverride).toBe(false);
  });

  test("refuses a limit of zero", async () => {
    const { client, groceries } = await freshUser();

    const created = await client.budget.create.mutate(budget(groceries.id));
    const periods = await client.budget.periods.query({ id: created.id });

    expect(
      await errorCodeOf(
        client.budget.setPeriodAmount.mutate({
          id: periods.rows[0]?.periodId ?? "",
          amountCents: 0,
        }),
      ),
    ).toBe("BAD_REQUEST");
  });
});

describe("editing, pausing and deleting a series", () => {
  test("a past month keeps the limit it was lived through with", async () => {
    const { client, groceries } = await freshUser();

    const created = await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 100_000, startsOn: month(-2) }),
    );

    await client.budget.update.mutate({
      id: created.id,
      ...budget(groceries.id, { amountCents: 70_000, startsOn: month(-2) }),
    });

    const after = await client.budget.periods.query({ id: created.id });

    expect(
      after.rows.find((row) => row.periodMonth === month(-2))?.limitCents,
    ).toBe(100_000);
    expect(
      after.rows.find((row) => row.periodMonth === month(-1))?.limitCents,
    ).toBe(100_000);
    // The month in progress counts as still ahead.
    expect(
      after.rows.find((row) => row.periodMonth === month())?.limitCents,
    ).toBe(70_000);
  });

  test("pausing clears the months not yet started and resuming lays them again", async () => {
    const { client, groceries } = await freshUser();

    const created = await client.budget.create.mutate(
      budget(groceries.id, { startsOn: month(-1) }),
    );

    const paused = await client.budget.setActive.mutate({
      id: created.id,
      isActive: false,
    });

    expect(paused.removed).toBe(13);

    const whilePaused = await client.budget.periods.query({ id: created.id });

    expect(whilePaused.rows.map((row) => row.periodMonth)).toEqual([
      month(-1),
    ]);

    const resumed = await client.budget.setActive.mutate({
      id: created.id,
      isActive: true,
    });

    expect(resumed.generated).toBe(13);
  });

  test("deleting keeps history and drops what has not started", async () => {
    const { client, groceries } = await freshUser();

    const created = await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 100_000, startsOn: month(-1) }),
    );

    const deleted = await client.budget.delete.mutate({ id: created.id });

    expect(deleted.removed).toBe(13);
    expect(await errorCodeOf(client.budget.periods.query({ id: created.id }))).toBe(
      "NOT_FOUND",
    );

    // The month already lived through survives, pointing at no series.
    const lastMonth = await monthRowFor(client, groceries.id, month(-1));

    expect(lastMonth?.limitCents).toBe(100_000);
    expect(lastMonth?.budgetId).toBeNull();
  });

  test("a new budget adopts an orphaned month rather than colliding with it", async () => {
    const { client, groceries } = await freshUser();

    const first = await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 100_000, startsOn: month(-1) }),
    );

    await client.budget.delete.mutate({ id: first.id });

    const second = await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 60_000, startsOn: month(-1) }),
    );

    const periods = await client.budget.periods.query({ id: second.id });

    expect(periods.rows).toHaveLength(14);
    expect(
      periods.rows.find((row) => row.periodMonth === month(-1))?.limitCents,
    ).toBe(60_000);
  });
});

describe("budget filters and the dashboard", () => {
  test("filters by category, currency and state", async () => {
    const { client, groceries } = await freshUser();
    const gym = await client.category.create.mutate(
      category({ name: "Gym", type: CategoryType.EXPENSE }),
    );

    await client.budget.create.mutate(budget(groceries.id));
    const paused = await client.budget.create.mutate(
      budget(gym.id, { currencyCode: WalletCurrency.USD }),
    );

    await client.budget.setActive.mutate({ id: paused.id, isActive: false });

    expect(
      (await client.budget.getAll.query({ categoryId: gym.id })).total,
    ).toBe(1);
    expect(
      (await client.budget.getAll.query({ currencyCode: WalletCurrency.BRL }))
        .total,
    ).toBe(1);
    expect((await client.budget.getAll.query({ isActive: false })).total).toBe(
      1,
    );
    expect((await client.budget.getAll.query({ search: "Gym" })).total).toBe(1);
  });

  test("the dashboard reports the same figures as the budget page", async () => {
    const { client, checking, groceries } = await freshUser();

    await client.budget.create.mutate(
      budget(groceries.id, { amountCents: 100_000, startsOn: month() }),
    );
    await client.transaction.create.mutate(
      transaction(checking.id, {
        name: "Market",
        amountCents: 35_000,
        categoryId: groceries.id,
        occurrenceDate: dayIn(month(), 8),
      }),
    );

    const [page, dashboard] = await Promise.all([
      monthRowFor(client, groceries.id),
      client.dashboard.getSummary.query({}),
    ]);

    const brl = dashboard.currencies.find((entry) => entry.currencyCode === "BRL");
    const widget = brl?.budgets.find((row) => row.categoryId === groceries.id);

    expect(widget?.limitCents).toBe(page?.limitCents);
    expect(widget?.projectedSpentCents).toBe(page?.projectedSpentCents);
    expect(widget?.remainingCents).toBe(page?.remainingCents);
    expect(brl?.budgetTotals?.remainingCents).toBe(65_000);
  });

  test("another user's budget is invisible", async () => {
    const { client, groceries } = await freshUser();
    const created = await client.budget.create.mutate(budget(groceries.id));

    const stranger = (await signUpClient()).client;

    expect((await stranger.budget.getAll.query({})).total).toBe(0);
    expect(
      await errorCodeOf(stranger.budget.periods.query({ id: created.id })),
    ).toBe("NOT_FOUND");
    expect(
      await errorCodeOf(stranger.budget.delete.mutate({ id: created.id })),
    ).toBe("NOT_FOUND");
  });
});
