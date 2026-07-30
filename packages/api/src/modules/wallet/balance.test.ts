import { TransactionKind, TransactionStatus } from "@budget-manager/schemas";
import { describe, expect, test } from "bun:test";

import {
  computeWalletBalances,
  type WalletMovementTotal,
} from "./balance";

const WALLET_A = { id: "wallet-a", openingBalanceCents: 10_000 };
const WALLET_B = { id: "wallet-b", openingBalanceCents: 0 };

function movement(
  overrides: Partial<WalletMovementTotal> = {},
): WalletMovementTotal {
  return {
    walletId: WALLET_A.id,
    kind: TransactionKind.EXPENSE,
    status: TransactionStatus.PAID,
    totalCents: 2_500,
    ...overrides,
  };
}

function balancesOf(movements: WalletMovementTotal[]) {
  const [a] = computeWalletBalances([WALLET_A], movements);

  return {
    balance: a?.balanceCents,
    projected: a?.projectedBalanceCents,
  };
}

describe("computeWalletBalances", () => {
  test("falls back to the opening balance with no movements", () => {
    expect(balancesOf([])).toEqual({ balance: 10_000, projected: 10_000 });
  });

  test("subtracts paid expenses and adds paid income", () => {
    const result = balancesOf([
      movement({ kind: TransactionKind.EXPENSE, totalCents: 2_500 }),
      movement({ kind: TransactionKind.INCOME, totalCents: 4_000 }),
    ]);

    expect(result.balance).toBe(10_000 - 2_500 + 4_000);
  });

  test("credits transfer_in and debits transfer_out", () => {
    const result = balancesOf([
      movement({ kind: TransactionKind.TRANSFER_IN, totalCents: 3_000 }),
      movement({ kind: TransactionKind.TRANSFER_OUT, totalCents: 1_000 }),
    ]);

    expect(result.balance).toBe(10_000 + 3_000 - 1_000);
  });

  test("excludes waiting_payment from the settled balance but not the projection", () => {
    const result = balancesOf([
      movement({
        kind: TransactionKind.EXPENSE,
        status: TransactionStatus.WAITING_PAYMENT,
        totalCents: 2_500,
      }),
    ]);

    expect(result.balance).toBe(10_000);
    expect(result.projected).toBe(7_500);
  });

  test("excludes cancelled rows from both balances", () => {
    const result = balancesOf([
      movement({
        status: TransactionStatus.CANCELLED,
        totalCents: 9_999,
      }),
    ]);

    expect(result).toEqual({ balance: 10_000, projected: 10_000 });
  });

  test("a card purchase never touches a wallet, even if one is attached", () => {
    // Purchases carry no walletId in practice; the kind allowlist is what makes
    // a mis-tagged row harmless rather than a silent debit.
    const result = balancesOf([
      movement({
        kind: TransactionKind.CREDIT_CARD_PURCHASE,
        totalCents: 5_000,
      }),
    ]);

    expect(result).toEqual({ balance: 10_000, projected: 10_000 });
  });

  test("paying a card bill debits the wallet the money came from", () => {
    const result = balancesOf([
      movement({
        kind: TransactionKind.CREDIT_CARD_PAYMENT,
        totalCents: 5_000,
      }),
    ]);

    expect(result.balance).toBe(5_000);
  });

  test("a pending card payment only moves the projection", () => {
    const result = balancesOf([
      movement({
        kind: TransactionKind.CREDIT_CARD_PAYMENT,
        totalCents: 4_000,
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    ]);

    expect(result).toEqual({ balance: 10_000, projected: 6_000 });
  });

  test("ignores movements with no wallet", () => {
    expect(balancesOf([movement({ walletId: null })])).toEqual({
      balance: 10_000,
      projected: 10_000,
    });
  });

  test("attributes movements to the right wallet", () => {
    const [a, b] = computeWalletBalances([WALLET_A, WALLET_B], [
      movement({ walletId: WALLET_B.id, kind: TransactionKind.INCOME, totalCents: 700 }),
    ]);

    expect(a?.balanceCents).toBe(10_000);
    expect(b?.balanceCents).toBe(700);
  });

  test("keeps the other wallet fields intact", () => {
    const [only] = computeWalletBalances(
      [{ ...WALLET_A, name: "Checking" }],
      [],
    );

    expect(only?.name).toBe("Checking");
  });
});
