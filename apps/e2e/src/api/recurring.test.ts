import {
  RecurrenceType,
  TransactionKind,
  TransactionStatus,
} from "@budget-manager/schemas";
import { beforeAll, describe, expect, test } from "bun:test";

import { errorCodeOf, signUpClient, type ApiClient } from "../support/api";
import { requireServer } from "../support/env";
import {
  card,
  listTransactions,
  recurring,
  seedBasics,
} from "../support/fixtures";

let api: ApiClient;

beforeAll(async () => {
  await requireServer();
  api = (await signUpClient()).client;
});

async function freshUser() {
  const client = (await signUpClient()).client;
  const seed = await seedBasics(client);

  return { client, ...seed };
}

/**
 * A date `months` from today, on a safe day-of-month. Relative rather than
 * hardcoded: the generator only materializes a 12-month horizon, so a fixed
 * far-future date would silently produce nothing.
 */
function monthsFromToday(months: number, day = 5) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + months, day);

  return `${target.getFullYear()}-${`${target.getMonth() + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
}

async function seriesRows(client: ApiClient, name: string) {
  const rows = await listTransactions(client, { limit: 100 });

  return rows.filter((row) => row.name === name);
}

describe("recurring series", () => {
  test("is empty for a new user", async () => {
    const page = await api.recurring.getAll.query({});

    expect(page.rows).toEqual([]);
    expect(page.total).toBe(0);
  });

  test("a fixed series materializes exactly its installments", async () => {
    const { client, checking, groceries } = await freshUser();

    const created = await client.recurring.create.mutate(
      recurring({
        name: "Sofa 6x",
        walletId: checking.id,
        categoryId: groceries.id,
        recurrenceType: RecurrenceType.FIXED,
        installments: 6,
        startsOn: "2026-02-10",
      }),
    );

    expect(created.generated).toBe(6);

    const rows = await seriesRows(client, "Sofa 6x");

    expect(rows.length).toBe(6);
    expect(rows.map((r) => r.occurrenceDate).sort()).toEqual([
      "2026-02-10",
      "2026-03-10",
      "2026-04-10",
      "2026-05-10",
      "2026-06-10",
      "2026-07-10",
    ]);
    // Generated rows are scheduled, never pre-settled.
    expect(rows.every((r) => r.status === TransactionStatus.WAITING_PAYMENT)).toBe(
      true,
    );
  });

  test("clamps a month-end anchor rather than drifting", async () => {
    const { client, checking } = await freshUser();

    await client.recurring.create.mutate(
      recurring({
        name: "Rent 31st",
        walletId: checking.id,
        recurrenceType: RecurrenceType.FIXED,
        installments: 4,
        startsOn: "2026-01-31",
      }),
    );

    const dates = (await seriesRows(client, "Rent 31st"))
      .map((r) => r.occurrenceDate)
      .sort();

    expect(dates).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
    ]);
  });

  test("a monthly series stops at its end date", async () => {
    const { client, checking } = await freshUser();

    await client.recurring.create.mutate(
      recurring({
        name: "Gym",
        walletId: checking.id,
        recurrenceType: RecurrenceType.MONTHLY,
        installments: null,
        startsOn: "2026-06-15",
        endsOn: "2026-09-15",
      }),
    );

    expect((await seriesRows(client, "Gym")).length).toBe(4);
  });

  test("the generated rows carry the series' account and category", async () => {
    const { client, checking, groceries } = await freshUser();

    await client.recurring.create.mutate(
      recurring({
        name: "Streaming",
        walletId: checking.id,
        categoryId: groceries.id,
        recurrenceType: RecurrenceType.FIXED,
        installments: 2,
        startsOn: "2026-03-01",
      }),
    );

    const rows = await seriesRows(client, "Streaming");

    expect(rows[0]?.walletName).toBe("Checking");
    expect(rows[0]?.categoryName).toBe("Groceries");
    expect(rows[0]?.kind).toBe(TransactionKind.EXPENSE);
  });

  test("generated rows count toward the wallet projection, not the balance", async () => {
    const { client, checking } = await freshUser();

    await client.recurring.create.mutate(
      recurring({
        name: "Insurance",
        walletId: checking.id,
        amountCents: 20_000,
        recurrenceType: RecurrenceType.FIXED,
        installments: 3,
        startsOn: "2026-04-05",
      }),
    );

    const wallets = await client.wallet.getAll.query({});
    const row = wallets.rows.find((w) => w.id === checking.id);

    expect(row?.balanceCents).toBe(100_000);
    expect(row?.projectedBalanceCents).toBe(100_000 - 60_000);
  });

  test("lists the series with its schedule and a row count", async () => {
    const { client, checking } = await freshUser();

    await client.recurring.create.mutate(
      recurring({
        name: "Salary",
        kind: TransactionKind.INCOME,
        walletId: checking.id,
        recurrenceType: RecurrenceType.MONTHLY,
        installments: null,
        startsOn: "2026-07-01",
        endsOn: "2026-09-01",
      }),
    );

    const page = await client.recurring.getAll.query({});
    const series = page.rows[0];

    expect(page.total).toBe(1);
    expect(series?.recurrenceType).toBe(RecurrenceType.MONTHLY);
    expect(series?.interval).toBe(1);
    expect(series?.startsOn).toBe("2026-07-01");
    expect(series?.endsOn).toBe("2026-09-01");
    expect(series?.walletName).toBe("Checking");
    expect(series?.currencyCode).toBe("BRL");
    expect(series?.occurrenceCount).toBe(3);
  });
});

describe("editing a series", () => {
  test("re-lays future rows but keeps settled history", async () => {
    const { client, checking } = await freshUser();

    const created = await client.recurring.create.mutate(
      recurring({
        name: "Water",
        walletId: checking.id,
        amountCents: 10_000,
        recurrenceType: RecurrenceType.FIXED,
        installments: 12,
        startsOn: "2020-01-15",
      }),
    );

    const before = await seriesRows(client, "Water");
    const past = before.find((r) => r.occurrenceDate === "2020-01-15");

    if (!past) throw new Error("expected a past row");

    // Settle one of the past rows.
    await client.transaction.markPaid.mutate({ id: past.id });

    await client.recurring.update.mutate({
      ...recurring({
        name: "Water",
        walletId: checking.id,
        amountCents: 25_000,
        recurrenceType: RecurrenceType.FIXED,
        installments: 12,
        startsOn: "2020-01-15",
      }),
      id: created.id,
    });

    const after = await seriesRows(client, "Water");
    const settled = after.find((r) => r.id === past.id);

    // The paid row survives untouched at its original amount.
    expect(settled?.status).toBe(TransactionStatus.PAID);
    expect(settled?.amountCents).toBe(10_000);
    // Every row is in the past here, so nothing was re-laid.
    expect(after.length).toBe(12);
  });

  test("changing the amount re-prices only future rows", async () => {
    const { client, checking } = await freshUser();

    const created = await client.recurring.create.mutate(
      recurring({
        name: "Cloud",
        walletId: checking.id,
        amountCents: 5_000,
        recurrenceType: RecurrenceType.MONTHLY,
        installments: null,
        startsOn: monthsFromToday(2),
        endsOn: monthsFromToday(5),
      }),
    );

    await client.recurring.update.mutate({
      ...recurring({
        name: "Cloud",
        walletId: checking.id,
        amountCents: 9_000,
        recurrenceType: RecurrenceType.MONTHLY,
        installments: null,
        startsOn: monthsFromToday(2),
        endsOn: monthsFromToday(5),
      }),
      id: created.id,
    });

    const rows = await seriesRows(client, "Cloud");

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.amountCents === 9_000)).toBe(true);
  });

  test("shortening the series removes the rows beyond the new end", async () => {
    const { client, checking } = await freshUser();

    const created = await client.recurring.create.mutate(
      recurring({
        name: "Trial",
        walletId: checking.id,
        recurrenceType: RecurrenceType.MONTHLY,
        installments: null,
        startsOn: monthsFromToday(1),
        endsOn: monthsFromToday(6),
      }),
    );

    const before = (await seriesRows(client, "Trial")).length;

    await client.recurring.update.mutate({
      ...recurring({
        name: "Trial",
        walletId: checking.id,
        recurrenceType: RecurrenceType.MONTHLY,
        installments: null,
        startsOn: monthsFromToday(1),
        endsOn: monthsFromToday(3),
      }),
      id: created.id,
    });

    const after = (await seriesRows(client, "Trial")).length;

    expect(before).toBe(6);
    expect(after).toBe(3);
  });

  test("regenerating is idempotent", async () => {
    const { client, checking } = await freshUser();

    const payload = recurring({
      name: "Idempotent",
      walletId: checking.id,
      recurrenceType: RecurrenceType.FIXED,
      installments: 5,
      startsOn: "2026-02-01",
    });

    const created = await client.recurring.create.mutate(payload);

    await client.recurring.update.mutate({ ...payload, id: created.id });
    await client.recurring.update.mutate({ ...payload, id: created.id });

    expect((await seriesRows(client, "Idempotent")).length).toBe(5);
  });
});

describe("card purchase series", () => {
  test("files each occurrence against the statement for its own date", async () => {
    const { client, checking } = await freshUser();
    const visa = await client.creditCard.create.mutate(
      card({ closeDay: 10, dueDay: 20, defaultBillingWalletId: checking.id }),
    );

    await client.recurring.create.mutate(
      recurring({
        name: "Netflix",
        kind: TransactionKind.CREDIT_CARD_PURCHASE,
        walletId: null,
        creditCardId: visa.id,
        amountCents: 5_000,
        recurrenceType: RecurrenceType.FIXED,
        installments: 3,
        startsOn: "2026-02-15",
      }),
    );

    const rows = await seriesRows(client, "Netflix");

    expect(rows.length).toBe(3);
    expect(rows.every((r) => r.creditCardName === "Visa")).toBe(true);
    expect(rows.every((r) => r.walletName === null)).toBe(true);
    // Three dates in three different cycles, so three statements.
    expect(new Set(rows.map((r) => r.creditCardBillId)).size).toBe(3);

    const bills = await client.creditCard.bills.query({
      creditCardId: visa.id,
    });

    expect(bills.total).toBe(3);
    expect(bills.rows.every((b) => b.statementTotalCents === 5_000)).toBe(true);
  });

  test("a card series leaves wallet balances alone", async () => {
    const { client, checking } = await freshUser();
    const visa = await client.creditCard.create.mutate(
      card({ defaultBillingWalletId: checking.id }),
    );

    await client.recurring.create.mutate(
      recurring({
        name: "Music",
        kind: TransactionKind.CREDIT_CARD_PURCHASE,
        walletId: null,
        creditCardId: visa.id,
        amountCents: 3_000,
        recurrenceType: RecurrenceType.FIXED,
        installments: 4,
        startsOn: "2026-03-03",
      }),
    );

    const wallets = await client.wallet.getAll.query({});
    const wallet = wallets.rows.find((w) => w.id === checking.id);

    expect(wallet?.balanceCents).toBe(100_000);
    expect(wallet?.projectedBalanceCents).toBe(100_000);
  });
});

describe("validation and access", () => {
  test("requires a wallet for an expense series", async () => {
    const { client } = await freshUser();

    expect(
      await errorCodeOf(
        client.recurring.create.mutate(
          recurring({ walletId: null, creditCardId: null }),
        ),
      ),
    ).toBe("BAD_REQUEST");
  });

  test("requires a card for a card purchase series", async () => {
    const { client, checking } = await freshUser();

    expect(
      await errorCodeOf(
        client.recurring.create.mutate(
          recurring({
            kind: TransactionKind.CREDIT_CARD_PURCHASE,
            walletId: checking.id,
            creditCardId: null,
          }),
        ),
      ),
    ).toBe("BAD_REQUEST");
  });

  test("requires an installment count for a fixed series", async () => {
    const { client, checking } = await freshUser();

    expect(
      await errorCodeOf(
        client.recurring.create.mutate(
          recurring({
            walletId: checking.id,
            recurrenceType: RecurrenceType.FIXED,
            installments: null,
          }),
        ),
      ),
    ).toBe("BAD_REQUEST");
  });

  test("rejects an end date before the start", async () => {
    const { client, checking } = await freshUser();

    expect(
      await errorCodeOf(
        client.recurring.create.mutate(
          recurring({
            walletId: checking.id,
            recurrenceType: RecurrenceType.MONTHLY,
            installments: null,
            startsOn: "2026-06-01",
            endsOn: "2026-05-01",
          }),
        ),
      ),
    ).toBe("BAD_REQUEST");
  });

  test("rejects a category that contradicts the kind", async () => {
    const { client, checking, salary } = await freshUser();

    expect(
      await errorCodeOf(
        client.recurring.create.mutate(
          recurring({ walletId: checking.id, categoryId: salary.id }),
        ),
      ),
    ).toBe("CONFLICT");
  });

  test("rejects another user's wallet", async () => {
    const { client } = await freshUser();
    const stranger = await freshUser();

    expect(
      await errorCodeOf(
        client.recurring.create.mutate(
          recurring({ walletId: stranger.checking.id }),
        ),
      ),
    ).toBe("NOT_FOUND");
  });

  test("a stranger sees and touches nothing", async () => {
    const mine = await freshUser();
    const created = await mine.client.recurring.create.mutate(
      recurring({ walletId: mine.checking.id }),
    );

    const stranger = (await signUpClient()).client;

    expect((await stranger.recurring.getAll.query({})).rows).toEqual([]);
    expect(
      await errorCodeOf(stranger.recurring.delete.mutate({ id: created.id })),
    ).toBe("NOT_FOUND");
  });

  test("requires authentication", async () => {
    const { anonymousClient } = await import("../support/api");

    expect(await errorCodeOf(anonymousClient().recurring.getAll.query({}))).toBe(
      "UNAUTHORIZED",
    );
  });
});

describe("pausing a series", () => {
  test("pausing removes upcoming rows and keeps the past", async () => {
    const { client, checking } = await freshUser();

    const created = await client.recurring.create.mutate(
      recurring({
        name: "Pausable",
        walletId: checking.id,
        recurrenceType: RecurrenceType.MONTHLY,
        installments: null,
        startsOn: "2020-01-12",
        endsOn: monthsFromToday(6, 12),
      }),
    );

    const before = await seriesRows(client, "Pausable");
    const today = new Date().toISOString().slice(0, 10);
    const past = before.filter((r) => r.occurrenceDate <= today).length;

    const paused = await client.recurring.setActive.mutate({
      id: created.id,
      isActive: false,
    });

    expect(paused.removed).toBeGreaterThan(0);

    const after = await seriesRows(client, "Pausable");

    expect(after.length).toBe(past);
    expect((await client.recurring.getAll.query({})).rows[0]?.isActive).toBe(
      false,
    );
  });

  test("editing a paused series does not re-schedule it", async () => {
    const { client, checking } = await freshUser();

    const created = await client.recurring.create.mutate(
      recurring({
        name: "Still paused",
        walletId: checking.id,
        recurrenceType: RecurrenceType.MONTHLY,
        installments: null,
        startsOn: monthsFromToday(1, 12),
        endsOn: monthsFromToday(5, 12),
      }),
    );

    await client.recurring.setActive.mutate({
      id: created.id,
      isActive: false,
    });

    const result = await client.recurring.update.mutate({
      ...recurring({
        name: "Still paused",
        walletId: checking.id,
        amountCents: 55_000,
        recurrenceType: RecurrenceType.MONTHLY,
        installments: null,
        startsOn: monthsFromToday(1, 12),
        endsOn: monthsFromToday(5, 12),
      }),
      id: created.id,
    });

    expect(result.generated).toBe(0);
    expect((await seriesRows(client, "Still paused")).length).toBe(0);
  });

  test("resuming re-schedules from today forward", async () => {
    const { client, checking } = await freshUser();

    const created = await client.recurring.create.mutate(
      recurring({
        name: "Resumable",
        walletId: checking.id,
        recurrenceType: RecurrenceType.MONTHLY,
        installments: null,
        startsOn: monthsFromToday(1, 12),
        endsOn: monthsFromToday(4, 12),
      }),
    );

    const initial = (await seriesRows(client, "Resumable")).length;

    await client.recurring.setActive.mutate({
      id: created.id,
      isActive: false,
    });
    expect((await seriesRows(client, "Resumable")).length).toBe(0);

    const resumed = await client.recurring.setActive.mutate({
      id: created.id,
      isActive: true,
    });

    expect(resumed.generated).toBe(initial);
    expect((await client.recurring.getAll.query({})).rows[0]?.isActive).toBe(
      true,
    );
  });

  test("a stranger cannot pause my series", async () => {
    const mine = await freshUser();
    const created = await mine.client.recurring.create.mutate(
      recurring({ walletId: mine.checking.id }),
    );
    const stranger = (await signUpClient()).client;

    expect(
      await errorCodeOf(
        stranger.recurring.setActive.mutate({
          id: created.id,
          isActive: false,
        }),
      ),
    ).toBe("NOT_FOUND");
  });
});

describe("deleting a series", () => {
  test("drops future rows and keeps the past", async () => {
    const { client, checking } = await freshUser();

    const created = await client.recurring.create.mutate(
      recurring({
        name: "Mixed",
        walletId: checking.id,
        recurrenceType: RecurrenceType.MONTHLY,
        installments: null,
        // Straddles today so there is both history and a future.
        startsOn: "2020-01-08",
        endsOn: monthsFromToday(6, 8),
      }),
    );

    const before = await seriesRows(client, "Mixed");
    const today = new Date().toISOString().slice(0, 10);
    const past = before.filter((r) => r.occurrenceDate <= today).length;

    expect(before.length).toBeGreaterThan(past);

    const result = await client.recurring.delete.mutate({ id: created.id });

    expect(result.removed).toBeGreaterThan(0);

    const after = await seriesRows(client, "Mixed");

    // History survives; the schedule ahead is gone.
    expect(after.length).toBe(past);
    expect(after.every((r) => r.occurrenceDate <= today)).toBe(true);
    expect((await client.recurring.getAll.query({})).total).toBe(0);
  });
});
