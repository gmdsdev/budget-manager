import {
  TransactionStatus,
  WALLET_AFFECTING_KINDS,
  isTransactionKind,
  isTransactionStatus,
  signedAmountCents,
} from "@budget-manager/schemas";

export type WalletMovementTotal = {
  walletId: string | null;
  kind: string;
  status: string;
  totalCents: number;
};

export type WalletBalances = {
  balanceCents: number;
  projectedBalanceCents: number;
};

export function computeWalletBalances<
  W extends { id: string; openingBalanceCents: number },
>(wallets: W[], movements: WalletMovementTotal[]): (W & WalletBalances)[] {
  const settled = new Map<string, number>();
  const projected = new Map<string, number>();

  for (const movement of movements) {
    if (
      !movement.walletId ||
      !isTransactionKind(movement.kind) ||
      !isTransactionStatus(movement.status)
    ) {
      continue;
    }

    // An allowlist, not just "has a wallet": a card purchase carries no wallet
    // today, but if one were ever mis-tagged it must not debit an account.
    if (!WALLET_AFFECTING_KINDS.includes(movement.kind)) {
      continue;
    }

    if (movement.status === TransactionStatus.CANCELLED) {
      continue;
    }

    const signed = signedAmountCents(movement.kind, movement.totalCents);

    projected.set(
      movement.walletId,
      (projected.get(movement.walletId) ?? 0) + signed,
    );

    if (movement.status === TransactionStatus.PAID) {
      settled.set(
        movement.walletId,
        (settled.get(movement.walletId) ?? 0) + signed,
      );
    }
  }

  return wallets.map((wallet) => ({
    ...wallet,
    balanceCents: wallet.openingBalanceCents + (settled.get(wallet.id) ?? 0),
    projectedBalanceCents:
      wallet.openingBalanceCents + (projected.get(wallet.id) ?? 0),
  }));
}
