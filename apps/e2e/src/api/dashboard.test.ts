import {
  TransactionKind,
  TransactionStatus,
  WalletCurrency,
} from "@budget-manager/schemas";
import { beforeAll, describe, expect, test } from "bun:test";

import { errorCodeOf, signUpClient, type ApiClient } from "../support/api";
import { requireServer } from "../support/env";
import {
  card,
  cardPayment,
  cardPurchase,
  seedBasics,
  transaction,
  transfer,
  wallet,
} from "../support/fixtures";

const BRL_CODE: string = WalletCurrency.BRL;
const USD_CODE: string = WalletCurrency.USD;

const MONTH = "2026-07";
const IN_MONTH = "2026-07-10";
const NEXT_MONTH = "2026-08-10";

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

function brl<T extends { currencyCode: string }>(summaries: T[]) {
  return summaries.find((s) => s.currencyCode === BRL_CODE);
}

const brl_ = brl;

describe("dashboard", () => {
  test("is empty for a user with nothing", async () => {
    const client = (await signUpClient()).client;
    const summary = await client.dashboard.getSummary.query({});

    expect(summary.currencies).toEqual([]);
    expect(summary.pending).toEqual([]);
  });

  test("resolves the month range inclusively", async () => {
    const summary = await api.dashboard.getSummary.query({ month: MONTH });

    expect(summary.month).toBe(MONTH);
    expect(summary.monthStart).toBe("2026-07-01");
    expect(summary.monthEnd).toBe("2026-07-31");
  });

  test("defaults to the current month when none is given", async () => {
    const summary = await api.dashboard.getSummary.query({});

    expect(summary.month).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });

  test("rejects a malformed month", async () => {
    expect(
      await errorCodeOf(api.dashboard.getSummary.query({ month: "2026-13" })),
    ).toBe("BAD_REQUEST");
    expect(
      await errorCodeOf(api.dashboard.getSummary.query({ month: "07-2026" })),
    ).toBe("BAD_REQUEST");
  });

  test("reports balances and nets income against expense", async () => {
    const { client, checking, salary, groceries } = await freshUser();

    await client.transaction.create.mutate(
      transaction(checking.id, {
        kind: TransactionKind.INCOME,
        amountCents: 500_000,
        categoryId: salary.id,
        occurrenceDate: IN_MONTH,
      }),
    );
    await client.transaction.create.mutate(
      transaction(checking.id, {
        amountCents: 120_000,
        categoryId: groceries.id,
        occurrenceDate: IN_MONTH,
      }),
    );

    const summary = await client.dashboard.getSummary.query({ month: MONTH });
    const row = brl(summary.currencies);

    expect(row?.walletCount).toBe(2);
    expect(row?.incomeCents).toBe(500_000);
    expect(row?.expenseCents).toBe(120_000);
    expect(row?.netCents).toBe(380_000);
    // Two wallets opening 100_000 + 0, plus 500_000 income - 120_000 expense.
    expect(row?.balanceCents).toBe(480_000);
  });

  test("keeps other months out of the totals", async () => {
    const { client, checking } = await freshUser();

    await client.transaction.create.mutate(
      transaction(checking.id, {
        amountCents: 77_000,
        occurrenceDate: NEXT_MONTH,
      }),
    );

    const july = await client.dashboard.getSummary.query({ month: MONTH });
    const august = await client.dashboard.getSummary.query({
      month: "2026-08",
    });

    expect(brl(july.currencies)?.expenseCents).toBe(0);
    expect(brl(august.currencies)?.expenseCents).toBe(77_000);
    // The balance is not month-scoped, so it moves either way.
    expect(brl(july.currencies)?.balanceCents).toBe(100_000 - 77_000);
  });

  test("excludes transfers from income and expense but not from balances", async () => {
    const { client, checking, savings } = await freshUser();

    await client.transaction.createTransfer.mutate(
      transfer(checking.id, savings.id, {
        amountCents: 40_000,
        occurrenceDate: IN_MONTH,
      }),
    );

    const summary = await client.dashboard.getSummary.query({ month: MONTH });
    const row = brl(summary.currencies);

    expect(row?.incomeCents).toBe(0);
    expect(row?.expenseCents).toBe(0);
    expect(row?.netCents).toBe(0);
    // Money only moved between the user's own wallets.
    expect(row?.balanceCents).toBe(100_000);
  });

  test("excludes cancelled rows and includes pending ones", async () => {
    const { client, checking } = await freshUser();

    await client.transaction.create.mutate(
      transaction(checking.id, {
        amountCents: 90_000,
        status: TransactionStatus.CANCELLED,
        occurrenceDate: IN_MONTH,
      }),
    );
    await client.transaction.create.mutate(
      transaction(checking.id, {
        amountCents: 15_000,
        status: TransactionStatus.WAITING_PAYMENT,
        occurrenceDate: IN_MONTH,
      }),
    );

    const row = brl(
      (await client.dashboard.getSummary.query({ month: MONTH })).currencies,
    );

    expect(row?.expenseCents).toBe(15_000);
    expect(row?.balanceCents).toBe(100_000);
    expect(row?.projectedBalanceCents).toBe(85_000);
  });

  test("never merges two currencies into one total", async () => {
    const { client, checking } = await freshUser();
    const usd = await client.wallet.create.mutate(
      wallet({
        name: "Dollars",
        currencyCode: WalletCurrency.USD,
        openingBalanceCents: 700,
      }),
    );

    await client.transaction.create.mutate(
      transaction(checking.id, {
        kind: TransactionKind.INCOME,
        amountCents: 1_000,
        occurrenceDate: IN_MONTH,
      }),
    );
    await client.transaction.create.mutate(
      transaction(usd.id, {
        kind: TransactionKind.INCOME,
        amountCents: 2_000,
        occurrenceDate: IN_MONTH,
      }),
    );

    const summary = await client.dashboard.getSummary.query({ month: MONTH });
    const usdRow = summary.currencies.find((s) => s.currencyCode === USD_CODE);

    expect(summary.currencies.map((s) => s.currencyCode)).toEqual([
      "BRL",
      "USD",
    ]);
    expect(brl(summary.currencies)?.incomeCents).toBe(1_000);
    expect(usdRow?.incomeCents).toBe(2_000);
    expect(usdRow?.balanceCents).toBe(2_700);
  });

  test("ranks spending categories and buckets uncategorized spend", async () => {
    const { client, checking, groceries } = await freshUser();

    await client.transaction.create.mutate(
      transaction(checking.id, {
        amountCents: 60_000,
        categoryId: groceries.id,
        occurrenceDate: IN_MONTH,
      }),
    );
    await client.transaction.create.mutate(
      transaction(checking.id, {
        amountCents: 10_000,
        categoryId: null,
        occurrenceDate: IN_MONTH,
      }),
    );

    const row = brl(
      (await client.dashboard.getSummary.query({ month: MONTH })).currencies,
    );

    expect(row?.topCategories.map((c) => [c.name, c.amountCents])).toEqual([
      ["Groceries", 60_000],
      ["Uncategorized", 10_000],
    ]);
  });

  test("excludes archived wallets from the summary", async () => {
    const { client, checking, savings } = await freshUser();

    await client.wallet.archive.mutate({ id: savings.id });

    const row = brl(
      (await client.dashboard.getSummary.query({ month: MONTH })).currencies,
    );

    expect(row?.walletCount).toBe(1);
    expect(row?.balanceCents).toBe(100_000);
    expect(checking.id).toBeTruthy();
  });

  test("lists pending items oldest first, including overdue, omitting settled", async () => {
    const { client, checking } = await freshUser();
    const future = "2099-12-31";
    const sooner = "2099-01-01";
    const overdue = "2020-01-01";

    await client.transaction.create.mutate(
      transaction(checking.id, {
        name: "Later bill",
        occurrenceDate: future,
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    );
    await client.transaction.create.mutate(
      transaction(checking.id, {
        name: "Sooner bill",
        occurrenceDate: sooner,
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    );
    await client.transaction.create.mutate(
      transaction(checking.id, {
        name: "Already paid",
        occurrenceDate: sooner,
        status: TransactionStatus.PAID,
      }),
    );

    await client.transaction.create.mutate(
      transaction(checking.id, {
        name: "Overdue bill",
        occurrenceDate: overdue,
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    );

    const summary = await client.dashboard.getSummary.query({});
    const names = summary.pending.map((item) => item.name);

    // Overdue first: hiding a past-due bill is the opposite of useful.
    expect(names).toEqual(["Overdue bill", "Sooner bill", "Later bill"]);
    expect(summary.pending[0]?.walletName).toBe("Checking");
    expect(summary.pending[0]?.walletCurrencyCode).toBe(BRL_CODE);
    expect(summary.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(summary.pending[0]!.occurrenceDate < summary.today).toBe(true);
  });

  test("nets card debt against wallet money, per currency", async () => {
    const { client, checking } = await freshUser();
    const visa = await client.creditCard.create.mutate(
      card({ limitCents: 500_000, defaultBillingWalletId: checking.id }),
    );

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(visa.id, {
        amountCents: 120_000,
        occurrenceDate: IN_MONTH,
      }),
    );

    const brl = brl_(
      (await client.dashboard.getSummary.query({ month: MONTH })).currencies,
    );

    expect(brl?.cardCount).toBe(1);
    expect(brl?.cardOutstandingCents).toBe(120_000);
    expect(brl?.cardAvailableCents).toBe(380_000);
    // Two wallets opening 100_000 + 0, untouched by the card purchase.
    expect(brl?.balanceCents).toBe(100_000);
    // The position accounts for the debt: 1.000 - 1.200 = -200.
    expect(brl?.netWorthCents).toBe(-20_000);
  });

  test("keeps a card's debt out of another currency's position", async () => {
    const { client } = await freshUser();
    const usdCard = await client.creditCard.create.mutate(
      card({
        name: "USD card",
        currencyCode: WalletCurrency.USD,
        defaultBillingWalletId: null,
      }),
    );

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(usdCard.id, {
        amountCents: 50_000,
        occurrenceDate: IN_MONTH,
      }),
    );

    const summary = await client.dashboard.getSummary.query({ month: MONTH });
    const brl = brl_(summary.currencies);
    const usd = summary.currencies.find((c) => c.currencyCode === USD_CODE);

    expect(brl?.cardOutstandingCents).toBe(0);
    expect(brl?.netWorthCents).toBe(100_000);
    expect(usd?.cardOutstandingCents).toBe(50_000);
    expect(usd?.netWorthCents).toBe(-50_000);
  });

  test("lists unpaid statements, soonest due first", async () => {
    const { client, checking } = await freshUser();
    const visa = await client.creditCard.create.mutate(
      card({ closeDay: 10, dueDay: 20, defaultBillingWalletId: checking.id }),
    );

    // Two cycles: one long overdue, one later.
    await client.transaction.createCardPurchase.mutate(
      cardPurchase(visa.id, {
        amountCents: 40_000,
        occurrenceDate: "2020-03-04",
      }),
    );
    await client.transaction.createCardPurchase.mutate(
      cardPurchase(visa.id, {
        amountCents: 25_000,
        occurrenceDate: "2020-05-04",
      }),
    );

    const { statements, today } = await client.dashboard.getSummary.query({});

    expect(statements.length).toBe(2);
    expect(statements[0]?.dueAt).toBe("2020-03-20");
    expect(statements[1]?.dueAt).toBe("2020-05-20");
    expect(statements[0]?.creditCardName).toBe("Visa");
    expect(statements[0]?.currencyCode).toBe("BRL");
    expect(statements[0]?.remainingCents).toBe(40_000);
    expect(statements[0]!.dueAt < today).toBe(true);
  });

  test("a settled statement drops off the list", async () => {
    const { client, checking } = await freshUser();
    const visa = await client.creditCard.create.mutate(
      card({ closeDay: 10, dueDay: 20, defaultBillingWalletId: checking.id }),
    );

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(visa.id, {
        amountCents: 40_000,
        occurrenceDate: "2020-03-04",
      }),
    );

    const before = await client.dashboard.getSummary.query({});
    const bill = before.statements[0];

    if (!bill) throw new Error("no statement");

    await client.transaction.createCardPayment.mutate(
      cardPayment(visa.id, checking.id, {
        amountCents: 40_000,
        occurrenceDate: "2020-03-18",
        creditCardBillId: bill.id,
      }),
    );

    const after = await client.dashboard.getSummary.query({});

    expect(after.statements).toEqual([]);
  });

  test("a partly paid statement stays, showing only what is left", async () => {
    const { client, checking } = await freshUser();
    const visa = await client.creditCard.create.mutate(
      card({ closeDay: 10, dueDay: 20, defaultBillingWalletId: checking.id }),
    );

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(visa.id, {
        amountCents: 40_000,
        occurrenceDate: "2020-03-04",
      }),
    );

    const bill = (await client.dashboard.getSummary.query({})).statements[0];

    if (!bill) throw new Error("no statement");

    await client.transaction.createCardPayment.mutate(
      cardPayment(visa.id, checking.id, {
        amountCents: 15_000,
        occurrenceDate: "2020-03-18",
        creditCardBillId: bill.id,
      }),
    );

    const after = (await client.dashboard.getSummary.query({})).statements[0];

    expect(after?.remainingCents).toBe(25_000);
    expect(after?.paidCents).toBe(15_000);
    expect(after?.status).toBe("awaiting_payment");
  });

  test("archiving a card hides its statements and its debt", async () => {
    const { client, checking } = await freshUser();
    const visa = await client.creditCard.create.mutate(
      card({ defaultBillingWalletId: checking.id }),
    );

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(visa.id, {
        amountCents: 40_000,
        occurrenceDate: "2020-03-04",
      }),
    );
    await client.creditCard.archive.mutate({ id: visa.id });

    const summary = await client.dashboard.getSummary.query({ month: MONTH });

    expect(summary.statements).toEqual([]);
    expect(brl_(summary.currencies)?.cardOutstandingCents).toBe(0);
  });

  test("requires authentication", async () => {
    const { anonymousClient } = await import("../support/api");

    expect(
      await errorCodeOf(anonymousClient().dashboard.getSummary.query({})),
    ).toBe("UNAUTHORIZED");
  });

  test("shows a different user nothing of ours", async () => {
    const mine = await freshUser();
    await mine.client.transaction.create.mutate(
      transaction(mine.checking.id, { occurrenceDate: IN_MONTH }),
    );

    const stranger = (await signUpClient()).client;
    const summary = await stranger.dashboard.getSummary.query({ month: MONTH });

    expect(summary.currencies).toEqual([]);
  });
});
