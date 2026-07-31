import { TransactionKind, TransactionStatus } from "@budget-manager/schemas";
import { describe, expect, test } from "bun:test";
import {
  buildTransactionSummary,
  type CurrencyMovementTotal,
  type SummaryWallet,
} from "./summary";

const CHECKING: SummaryWallet = {
  id: "wallet-brl",
  currencyCode: "BRL",
  openingBalanceCents: 100_000,
};

const DOLLAR: SummaryWallet = {
  id: "wallet-usd",
  currencyCode: "USD",
  openingBalanceCents: 50_000,
};

function movement(
  overrides: Partial<CurrencyMovementTotal> = {},
): CurrencyMovementTotal {
  return {
    currencyCode: "BRL",
    kind: TransactionKind.EXPENSE,
    status: TransactionStatus.PAID,
    totalCents: 10_000,
    ...overrides,
  };
}

function build({
  wallets = [CHECKING],
  walletMovements = [],
  rangeMovements = [],
}: Partial<Parameters<typeof buildTransactionSummary>[0]> = {}) {
  return buildTransactionSummary({ wallets, walletMovements, rangeMovements });
}

describe("buildTransactionSummary", () => {
  test("reports a currency the user holds even with no movements", () => {
    expect(build()).toEqual([
      {
        currencyCode: "BRL",
        balanceCents: 100_000,
        projectedBalanceCents: 100_000,
        incomeCents: 0,
        projectedIncomeCents: 0,
        expenseCents: 0,
        projectedExpenseCents: 0,
        netCents: 0,
        projectedNetCents: 0,
      },
    ]);
  });

  test("splits settled from pending on both balances and both totals", () => {
    const [row] = build({
      walletMovements: [
        {
          walletId: CHECKING.id,
          kind: TransactionKind.INCOME,
          status: TransactionStatus.PAID,
          totalCents: 500_000,
        },
        {
          walletId: CHECKING.id,
          kind: TransactionKind.EXPENSE,
          status: TransactionStatus.WAITING_PAYMENT,
          totalCents: 30_000,
        },
      ],
      rangeMovements: [
        movement({ kind: TransactionKind.INCOME, totalCents: 500_000 }),
        movement({
          status: TransactionStatus.WAITING_PAYMENT,
          totalCents: 30_000,
        }),
      ],
    });

    expect(row).toMatchObject({
      balanceCents: 600_000,
      projectedBalanceCents: 570_000,
      incomeCents: 500_000,
      projectedIncomeCents: 500_000,
      expenseCents: 0,
      projectedExpenseCents: 30_000,
      netCents: 500_000,
      projectedNetCents: 470_000,
    });
  });

  test("never adds figures across currencies", () => {
    const rows = build({
      wallets: [CHECKING, DOLLAR],
      rangeMovements: [
        movement({ totalCents: 10_000 }),
        movement({ currencyCode: "USD", totalCents: 4_000 }),
      ],
    });

    expect(rows.map((row) => row.currencyCode)).toEqual(["BRL", "USD"]);
    expect(rows[0]).toMatchObject({
      balanceCents: 100_000,
      expenseCents: 10_000,
    });
    expect(rows[1]).toMatchObject({
      balanceCents: 50_000,
      expenseCents: 4_000,
    });
  });

  test("counts a card purchase as spending and the bill payment as neither", () => {
    const [row] = build({
      rangeMovements: [
        movement({
          kind: TransactionKind.CREDIT_CARD_PURCHASE,
          totalCents: 30_000,
        }),
        movement({
          kind: TransactionKind.CREDIT_CARD_PAYMENT,
          totalCents: 30_000,
        }),
      ],
    });

    expect(row).toMatchObject({ expenseCents: 30_000, netCents: -30_000 });
  });

  test("leaves transfers out of income and expenses", () => {
    const [row] = build({
      rangeMovements: [
        movement({ kind: TransactionKind.TRANSFER_OUT, totalCents: 40_000 }),
        movement({ kind: TransactionKind.TRANSFER_IN, totalCents: 40_000 }),
      ],
    });

    expect(row).toMatchObject({
      incomeCents: 0,
      expenseCents: 0,
      projectedIncomeCents: 0,
      projectedExpenseCents: 0,
    });
  });

  test("ignores cancelled rows everywhere", () => {
    const [row] = build({
      walletMovements: [
        {
          walletId: CHECKING.id,
          kind: TransactionKind.EXPENSE,
          status: TransactionStatus.CANCELLED,
          totalCents: 90_000,
        },
      ],
      rangeMovements: [
        movement({ status: TransactionStatus.CANCELLED, totalCents: 90_000 }),
      ],
    });

    expect(row).toMatchObject({
      balanceCents: 100_000,
      projectedBalanceCents: 100_000,
      expenseCents: 0,
      projectedExpenseCents: 0,
    });
  });

  test("reports a currency that only movements reach", () => {
    const rows = build({
      wallets: [],
      rangeMovements: [movement({ currencyCode: "EUR", totalCents: 7_000 })],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      currencyCode: "EUR",
      balanceCents: 0,
      expenseCents: 7_000,
    });
  });

  test("drops a movement whose owning account resolved to no currency", () => {
    const [row] = build({
      rangeMovements: [movement({ currencyCode: null, totalCents: 7_000 })],
    });

    expect(row).toMatchObject({ currencyCode: "BRL", expenseCents: 0 });
  });

  test("leaves an archived wallet's movements out of the balance", () => {
    const [row] = build({
      walletMovements: [
        {
          walletId: "archived-wallet",
          kind: TransactionKind.EXPENSE,
          status: TransactionStatus.PAID,
          totalCents: 20_000,
        },
      ],
    });

    expect(row).toMatchObject({
      balanceCents: 100_000,
      projectedBalanceCents: 100_000,
    });
  });
});
