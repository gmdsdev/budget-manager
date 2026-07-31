import {
  TransactionStatus,
  isTransactionStatus,
  periodRole,
} from "@budget-manager/schemas";
import {
  computeWalletBalances,
  type WalletMovementTotal,
} from "../wallet/balance";

export type SummaryWallet = {
  id: string;
  currencyCode: string;
  openingBalanceCents: number;
};

/** One total per (owning currency, kind, status) over the rows a filter matched. */
export type CurrencyMovementTotal = {
  currencyCode: string | null;
  kind: string;
  status: string;
  totalCents: number;
};

export type TransactionSummaryRow = {
  currencyCode: string;
  balanceCents: number;
  projectedBalanceCents: number;
  incomeCents: number;
  projectedIncomeCents: number;
  expenseCents: number;
  projectedExpenseCents: number;
  netCents: number;
  projectedNetCents: number;
};

function emptyRow(currencyCode: string): TransactionSummaryRow {
  return {
    currencyCode,
    balanceCents: 0,
    projectedBalanceCents: 0,
    incomeCents: 0,
    projectedIncomeCents: 0,
    expenseCents: 0,
    projectedExpenseCents: 0,
    netCents: 0,
    projectedNetCents: 0,
  };
}

/**
 * The figures under the transaction list, grouped by currency and never summed
 * across them: there are no FX rates here, so one combined total would be
 * fiction.
 *
 * Two scopes meet in one table, which is what the caption on screen states.
 * Balances come from every wallet the user still holds and answer "what do the
 * accounts hold" — an opening balance cannot be filtered by category or
 * description without becoming nonsense. Income and expenses answer "what did
 * these rows add up to", so they cover exactly the rows the list is showing.
 */
export function buildTransactionSummary({
  wallets,
  walletMovements,
  rangeMovements,
}: {
  wallets: SummaryWallet[];
  /** Already bounded by the range end, so a balance reads "as of" that day. */
  walletMovements: WalletMovementTotal[];
  rangeMovements: CurrencyMovementTotal[];
}): TransactionSummaryRow[] {
  const byCurrency = new Map<string, TransactionSummaryRow>();

  const ensure = (currencyCode: string) => {
    const existing = byCurrency.get(currencyCode);

    if (existing) return existing;

    const created = emptyRow(currencyCode);

    byCurrency.set(currencyCode, created);

    return created;
  };

  // The wallet module's own rules, so these figures can never disagree with the
  // wallet page: settled rows make `balanceCents`, pending ones the projection.
  for (const wallet of computeWalletBalances(wallets, walletMovements)) {
    const row = ensure(wallet.currencyCode);

    row.balanceCents += wallet.balanceCents;
    row.projectedBalanceCents += wallet.projectedBalanceCents;
  }

  for (const movement of rangeMovements) {
    const role = periodRole(movement.kind);

    if (
      !movement.currencyCode ||
      role === null ||
      !isTransactionStatus(movement.status) ||
      movement.status === TransactionStatus.CANCELLED
    ) {
      continue;
    }

    const row = ensure(movement.currencyCode);
    const settled = movement.status === TransactionStatus.PAID;

    if (role === "income") {
      row.projectedIncomeCents += movement.totalCents;

      if (settled) {
        row.incomeCents += movement.totalCents;
      }
    } else {
      row.projectedExpenseCents += movement.totalCents;

      if (settled) {
        row.expenseCents += movement.totalCents;
      }
    }
  }

  for (const row of byCurrency.values()) {
    row.netCents = row.incomeCents - row.expenseCents;
    row.projectedNetCents = row.projectedIncomeCents - row.projectedExpenseCents;
  }

  return [...byCurrency.values()].sort((a, b) =>
    a.currencyCode.localeCompare(b.currencyCode),
  );
}
