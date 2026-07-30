import {
  CARD_AFFECTING_KINDS,
  CategoryType,
  TransactionKind,
  TransactionStatus,
  type CardPaymentFormDto,
  type CardPurchaseFormDto,
  type TransactionFormDto,
  type TransactionFormKind,
  type TransferFormDto,
} from "@budget-manager/schemas";
import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError } from "../../errors";
import type { CreditCardService } from "../credit-card";
import type { TransactionFilters, TransactionRepository } from "./repository";

const KIND_TO_CATEGORY_TYPE: Record<TransactionFormKind, CategoryType> = {
  [TransactionKind.INCOME]: CategoryType.INCOME,
  [TransactionKind.EXPENSE]: CategoryType.EXPENSE,
};

const TRANSFER_EDIT_MESSAGE =
  "This is one leg of a transfer. Edit the transfer instead.";

const CARD_EDIT_MESSAGE =
  "This is a card transaction. Edit it as a card purchase or card payment instead.";

export class TransactionService {
  constructor(
    private readonly repository: TransactionRepository,
    /** Owns statement cycles, so bills stay a credit-card concern. */
    private readonly creditCards: CreditCardService,
  ) {}

  async getAll({
    userId,
    limit,
    offset,
    ...filters
  }: TransactionFilters & {
    userId: string;
    limit: number;
    offset: number;
  }) {
    const [rows, total] = await Promise.all([
      this.repository.getAll({ userId, limit, offset, ...filters }),
      this.repository.count({ userId, ...filters }),
    ]);

    return { rows, total, limit, offset };
  }

  async getTransfer({
    transferGroupId,
    userId,
  }: {
    transferGroupId: string;
    userId: string;
  }) {
    const legs = await this.repository.findTransferLegs({
      transferGroupId,
      userId,
    });

    if (legs.length === 0) {
      throw new NotFoundError("Transfer");
    }

    return legs;
  }

  async create({
    userId,
    transaction,
  }: {
    userId: string;
    transaction: TransactionFormDto;
  }) {
    await this.assertReferences({ userId, transaction });

    const created = await this.repository.create({
      userId,
      transaction,
      paidAt: transaction.status === TransactionStatus.PAID ? new Date() : null,
    });

    if (!created) {
      throw new Error("Transaction insert returned no row");
    }

    return created;
  }

  async update({
    id,
    userId,
    transaction,
  }: {
    id: string;
    userId: string;
    transaction: TransactionFormDto;
  }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("Transaction");
    }

    if (existing.transferGroupId) {
      throw new ConflictError(TRANSFER_EDIT_MESSAGE);
    }

    // The plain form only carries income/expense fields; letting it rewrite a
    // card row would strand the card reference or silently change the kind.
    if (CARD_AFFECTING_KINDS.includes(existing.kind)) {
      throw new ConflictError(CARD_EDIT_MESSAGE);
    }

    await this.assertReferences({ userId, transaction });

    const updated = await this.repository.update({
      id,
      userId,
      patch: {
        ...transaction,
        paidAt: this.nextPaidAt({
          previousStatus: existing.status,
          previousPaidAt: existing.paidAt,
          nextStatus: transaction.status,
        }),
      },
    });

    if (!updated) {
      throw new NotFoundError("Transaction");
    }

    return updated;
  }

  async createTransfer({
    userId,
    transfer,
  }: {
    userId: string;
    transfer: TransferFormDto;
  }) {
    await this.assertTransferWallets({ userId, transfer });

    const legs = await this.repository.createTransfer({
      userId,
      transferGroupId: randomUUID(),
      transfer,
      paidAt: transfer.status === TransactionStatus.PAID ? new Date() : null,
    });

    if (legs.length !== 2) {
      throw new Error("Transfer insert did not return both legs");
    }

    return legs;
  }

  async updateTransfer({
    transferGroupId,
    userId,
    transfer,
  }: {
    transferGroupId: string;
    userId: string;
    transfer: TransferFormDto;
  }) {
    const existing = await this.repository.findTransferLegs({
      transferGroupId,
      userId,
    });

    if (existing.length !== 2) {
      throw new NotFoundError("Transfer");
    }

    await this.assertTransferWallets({ userId, transfer });

    const outLeg = existing.find(
      (leg) => leg.kind === TransactionKind.TRANSFER_OUT,
    );

    const legs = await this.repository.updateTransfer({
      transferGroupId,
      userId,
      transfer,
      paidAt: this.nextPaidAt({
        previousStatus: outLeg?.status ?? TransactionStatus.WAITING_PAYMENT,
        previousPaidAt: outLeg?.paidAt ?? null,
        nextStatus: transfer.status,
      }),
    });

    if (legs.length !== 2) {
      throw new Error("Transfer update did not return both legs");
    }

    return legs;
  }

  async createCardPurchase({
    userId,
    purchase,
  }: {
    userId: string;
    purchase: CardPurchaseFormDto;
  }) {
    await this.assertExpenseCategory({
      userId,
      categoryId: purchase.categoryId,
    });

    // Also validates the card belongs to the user.
    const { bill } = await this.creditCards.ensureBillFor({
      userId,
      creditCardId: purchase.creditCardId,
      date: purchase.occurrenceDate,
    });

    const created = await this.repository.createCardPurchase({
      userId,
      purchase,
      creditCardBillId: bill.id,
      paidAt: purchase.status === TransactionStatus.PAID ? new Date() : null,
    });

    if (!created) {
      throw new Error("Card purchase insert returned no row");
    }

    return created;
  }

  async updateCardPurchase({
    id,
    userId,
    purchase,
  }: {
    id: string;
    userId: string;
    purchase: CardPurchaseFormDto;
  }) {
    const existing = await this.findCardRow({
      id,
      userId,
      kind: TransactionKind.CREDIT_CARD_PURCHASE,
    });

    await this.assertExpenseCategory({
      userId,
      categoryId: purchase.categoryId,
    });

    // Re-resolved: moving the date or the card moves the statement too.
    const { bill } = await this.creditCards.ensureBillFor({
      userId,
      creditCardId: purchase.creditCardId,
      date: purchase.occurrenceDate,
    });

    const updated = await this.repository.updateCardPurchase({
      id,
      userId,
      purchase,
      creditCardBillId: bill.id,
      paidAt: this.nextPaidAt({
        previousStatus: existing.status,
        previousPaidAt: existing.paidAt,
        nextStatus: purchase.status,
      }),
    });

    if (!updated) {
      throw new NotFoundError("Card purchase");
    }

    return updated;
  }

  async createCardPayment({
    userId,
    payment,
  }: {
    userId: string;
    payment: CardPaymentFormDto;
  }) {
    await this.assertPaymentAccounts({ userId, payment });

    const created = await this.repository.createCardPayment({
      userId,
      payment,
      paidAt: payment.status === TransactionStatus.PAID ? new Date() : null,
    });

    if (!created) {
      throw new Error("Card payment insert returned no row");
    }

    return created;
  }

  async updateCardPayment({
    id,
    userId,
    payment,
  }: {
    id: string;
    userId: string;
    payment: CardPaymentFormDto;
  }) {
    const existing = await this.findCardRow({
      id,
      userId,
      kind: TransactionKind.CREDIT_CARD_PAYMENT,
    });

    await this.assertPaymentAccounts({ userId, payment });

    const updated = await this.repository.updateCardPayment({
      id,
      userId,
      payment,
      paidAt: this.nextPaidAt({
        previousStatus: existing.status,
        previousPaidAt: existing.paidAt,
        nextStatus: payment.status,
      }),
    });

    if (!updated) {
      throw new NotFoundError("Card payment");
    }

    return updated;
  }

  private async findCardRow({
    id,
    userId,
    kind,
  }: {
    id: string;
    userId: string;
    kind: TransactionKind;
  }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing || existing.kind !== kind) {
      throw new NotFoundError(
        kind === TransactionKind.CREDIT_CARD_PURCHASE
          ? "Card purchase"
          : "Card payment",
      );
    }

    return existing;
  }

  private async assertCard({
    userId,
    creditCardId,
  }: {
    userId: string;
    creditCardId: string;
  }) {
    const card = await this.repository.findCreditCardById({
      id: creditCardId,
      userId,
    });

    if (!card) {
      throw new NotFoundError("Credit card");
    }

    return card;
  }

  private async assertExpenseCategory({
    userId,
    categoryId,
  }: {
    userId: string;
    categoryId: string | null;
  }) {
    if (!categoryId) {
      return;
    }

    const category = await this.repository.findCategoryById({
      id: categoryId,
      userId,
    });

    if (!category) {
      throw new NotFoundError("Category");
    }

    // A card purchase is spending, so an income category makes no sense on it.
    if (category.type !== CategoryType.EXPENSE) {
      throw new ConflictError(
        `A ${category.type} category cannot be used on a card purchase.`,
      );
    }
  }

  private async assertPaymentAccounts({
    userId,
    payment,
  }: {
    userId: string;
    payment: CardPaymentFormDto;
  }) {
    const [card, wallet] = await Promise.all([
      this.assertCard({ userId, creditCardId: payment.creditCardId }),
      this.repository.findWalletById({ id: payment.walletId, userId }),
    ]);

    if (!wallet) {
      throw new NotFoundError("Wallet");
    }

    if (card.currencyCode !== wallet.currencyCode) {
      throw new ConflictError(
        `The wallet must use the card's currency. This card is ${card.currencyCode} and the wallet is ${wallet.currencyCode}.`,
      );
    }

    if (payment.creditCardBillId) {
      await this.creditCards.assertBillForCard({
        userId,
        creditCardBillId: payment.creditCardBillId,
        creditCardId: payment.creditCardId,
      });
    }
  }

  async markPaid({ id, userId }: { id: string; userId: string }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("Transaction");
    }

    if (existing.status === TransactionStatus.CANCELLED) {
      throw new ConflictError(
        "This transaction is cancelled. Reopen it before marking it as paid.",
      );
    }

    if (existing.transferGroupId) {
      const legs = await this.repository.updateTransferGroupStatus({
        transferGroupId: existing.transferGroupId,
        userId,
        status: TransactionStatus.PAID,
        paidAt: new Date(),
      });

      const leg = legs.find((row) => row.id === id);

      if (!leg) {
        throw new NotFoundError("Transaction");
      }

      return leg;
    }

    const updated = await this.repository.update({
      id,
      userId,
      patch: { status: TransactionStatus.PAID, paidAt: new Date() },
    });

    if (!updated) {
      throw new NotFoundError("Transaction");
    }

    return updated;
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("Transaction");
    }

    if (existing.transferGroupId) {
      await this.repository.deleteTransfer({
        transferGroupId: existing.transferGroupId,
        userId,
      });

      return { id };
    }

    await this.repository.delete({ id, userId });

    return { id };
  }

  async deleteTransfer({
    transferGroupId,
    userId,
  }: {
    transferGroupId: string;
    userId: string;
  }) {
    const legs = await this.repository.findTransferLegs({
      transferGroupId,
      userId,
    });

    if (legs.length === 0) {
      throw new NotFoundError("Transfer");
    }

    await this.repository.deleteTransfer({ transferGroupId, userId });

    return { transferGroupId };
  }

  private nextPaidAt({
    previousStatus,
    previousPaidAt,
    nextStatus,
  }: {
    previousStatus: TransactionStatus;
    previousPaidAt: Date | null;
    nextStatus: TransactionStatus;
  }) {
    if (nextStatus !== TransactionStatus.PAID) {
      return null;
    }

    return previousStatus === TransactionStatus.PAID && previousPaidAt
      ? previousPaidAt
      : new Date();
  }

  private async assertTransferWallets({
    userId,
    transfer,
  }: {
    userId: string;
    transfer: TransferFormDto;
  }) {
    const [from, to] = await Promise.all([
      this.repository.findWalletById({ id: transfer.fromWalletId, userId }),
      this.repository.findWalletById({ id: transfer.toWalletId, userId }),
    ]);

    if (!from || !to) {
      throw new NotFoundError("Wallet");
    }

    if (from.currencyCode !== to.currencyCode) {
      throw new ConflictError(
        `Both wallets must use the same currency. This transfer mixes ${from.currencyCode} and ${to.currencyCode}.`,
      );
    }
  }

  private async assertReferences({
    userId,
    transaction,
  }: {
    userId: string;
    transaction: TransactionFormDto;
  }) {
    const wallet = await this.repository.findWalletById({
      id: transaction.walletId,
      userId,
    });

    if (!wallet) {
      throw new NotFoundError("Wallet");
    }

    if (!transaction.categoryId) {
      return;
    }

    const category = await this.repository.findCategoryById({
      id: transaction.categoryId,
      userId,
    });

    if (!category) {
      throw new NotFoundError("Category");
    }

    if (category.type !== KIND_TO_CATEGORY_TYPE[transaction.kind]) {
      throw new ConflictError(
        `A ${category.type} category cannot be used on an ${transaction.kind} transaction.`,
      );
    }
  }
}
