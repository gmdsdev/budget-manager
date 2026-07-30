import {
  TransactionKind,
  TransactionStatus,
  isTransactionKind,
  isTransactionStatus,
} from "@budget-manager/schemas";

export type CardMovementTotal = {
  creditCardId: string | null;
  kind: string;
  status: string;
  totalCents: number;
};

export type CardBalances = {
  /** What the card owes right now, from settled rows. Never negative in practice. */
  outstandingCents: number;
  /** Outstanding once pending purchases and payments settle. */
  projectedOutstandingCents: number;
  /** Limit minus outstanding — what is still spendable. */
  availableCents: number;
};

/**
 * A purchase increases what the card owes; a payment reduces it. Cancelled rows
 * count for nothing, and anything that is not a card kind is ignored so a
 * mis-tagged row can never move a card's balance.
 */
function signedCardAmount(kind: TransactionKind, amountCents: number) {
  return kind === TransactionKind.CREDIT_CARD_PURCHASE
    ? amountCents
    : -amountCents;
}

export function computeCardBalances<
  C extends { id: string; limitCents: number },
>(cards: C[], movements: CardMovementTotal[]): (C & CardBalances)[] {
  const settled = new Map<string, number>();
  const projected = new Map<string, number>();

  for (const movement of movements) {
    if (
      !movement.creditCardId ||
      !isTransactionKind(movement.kind) ||
      !isTransactionStatus(movement.status)
    ) {
      continue;
    }

    if (
      movement.kind !== TransactionKind.CREDIT_CARD_PURCHASE &&
      movement.kind !== TransactionKind.CREDIT_CARD_PAYMENT
    ) {
      continue;
    }

    if (movement.status === TransactionStatus.CANCELLED) {
      continue;
    }

    const signed = signedCardAmount(movement.kind, movement.totalCents);

    projected.set(
      movement.creditCardId,
      (projected.get(movement.creditCardId) ?? 0) + signed,
    );

    if (movement.status === TransactionStatus.PAID) {
      settled.set(
        movement.creditCardId,
        (settled.get(movement.creditCardId) ?? 0) + signed,
      );
    }
  }

  return cards.map((card) => {
    const outstandingCents = settled.get(card.id) ?? 0;

    return {
      ...card,
      outstandingCents,
      projectedOutstandingCents: projected.get(card.id) ?? 0,
      availableCents: card.limitCents - outstandingCents,
    };
  });
}
