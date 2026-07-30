import type { CreditCardFormDto } from "@budget-manager/schemas";
import { formatDate } from "../../dates";
import { ConflictError, NotFoundError } from "../../errors";
import { computeCardBalances } from "./balance";
import { computeBillTotals } from "./bill-totals";
import { cycleFor } from "./cycle";
import type {
  CreditCardFilters,
  CreditCardRepository,
  CreditCardUpdatePatch,
} from "./repository";

export class CreditCardService {
  constructor(private readonly repository: CreditCardRepository) {}

  async getAll({
    userId,
    includeArchived,
    limit,
    offset,
    ...filters
  }: CreditCardFilters & {
    userId: string;
    includeArchived: boolean;
    limit: number;
    offset: number;
  }) {
    const [rows, movements, total] = await Promise.all([
      this.repository.getAll({
        userId,
        includeArchived,
        limit,
        offset,
        ...filters,
      }),
      this.repository.getMovementTotals({ userId }),
      this.repository.count({ userId, includeArchived, ...filters }),
    ]);

    return {
      rows: computeCardBalances(rows, movements),
      total,
      limit,
      offset,
    };
  }

  async getOptions({ userId }: { userId: string }) {
    return await this.repository.listOptions({ userId });
  }

  async getBills({
    userId,
    creditCardId,
    limit,
    offset,
    now = new Date(),
  }: {
    userId: string;
    creditCardId: string;
    limit: number;
    offset: number;
    now?: Date;
  }) {
    const card = await this.repository.findById({ id: creditCardId, userId });

    if (!card) {
      throw new NotFoundError("Credit card");
    }

    const [rows, movements, total] = await Promise.all([
      this.repository.listBills({ userId, creditCardId, limit, offset }),
      this.repository.getBillMovementTotals({ userId, creditCardId }),
      this.repository.countBills({ userId, creditCardId }),
    ]);

    return {
      rows: computeBillTotals(rows, movements, formatDate(now)),
      currencyCode: card.currencyCode,
      total,
      limit,
      offset,
    };
  }

  /**
   * The statement a purchase on `date` belongs to, created on first use. Called
   * by the transaction service so a card purchase is always filed against a
   * cycle without the user picking one.
   */
  async ensureBillFor({
    userId,
    creditCardId,
    date,
  }: {
    userId: string;
    creditCardId: string;
    date: string;
  }) {
    const card = await this.repository.findById({ id: creditCardId, userId });

    if (!card) {
      throw new NotFoundError("Credit card");
    }

    const bill = await this.repository.ensureBill({
      userId,
      creditCardId,
      cycle: cycleFor({
        date,
        closeDay: card.closeDay,
        dueDay: card.dueDay,
      }),
      billingWalletId: card.defaultBillingWalletId,
    });

    if (!bill) {
      throw new Error("Bill upsert returned no row");
    }

    return { bill, card };
  }

  /** Ownership check for callers that only need to know the card is theirs. */
  async assertCardOwned({
    userId,
    creditCardId,
  }: {
    userId: string;
    creditCardId: string;
  }) {
    const card = await this.repository.findById({ id: creditCardId, userId });

    if (!card) {
      throw new NotFoundError("Credit card");
    }

    return card;
  }

  /** Validates a bill the user picked for a payment belongs to that card. */
  async assertBillForCard({
    userId,
    creditCardBillId,
    creditCardId,
  }: {
    userId: string;
    creditCardBillId: string;
    creditCardId: string;
  }) {
    const bill = await this.repository.findBillById({
      id: creditCardBillId,
      userId,
    });

    if (!bill) {
      throw new NotFoundError("Bill");
    }

    if (bill.creditCardId !== creditCardId) {
      throw new ConflictError("That bill belongs to a different card.");
    }

    return bill;
  }

  async create({ userId, card }: { userId: string; card: CreditCardFormDto }) {
    await this.assertBillingWallet({ userId, card });

    const created = await this.repository.create({ userId, card });

    if (!created) {
      throw new Error("Credit card insert returned no row");
    }

    return created;
  }

  async update({
    id,
    userId,
    card,
  }: {
    id: string;
    userId: string;
    card: CreditCardFormDto;
  }) {
    await this.assertBillingWallet({ userId, card });

    const patch: CreditCardUpdatePatch = card;
    const updated = await this.repository.update({ id, userId, patch });

    if (!updated) {
      throw new NotFoundError("Credit card");
    }

    return updated;
  }

  async archive({ id, userId }: { id: string; userId: string }) {
    const card = await this.repository.archive({ id, userId });

    if (!card) {
      throw new NotFoundError("Credit card");
    }

    return card;
  }

  async unarchive({ id, userId }: { id: string; userId: string }) {
    const card = await this.repository.unarchive({ id, userId });

    if (!card) {
      throw new NotFoundError("Credit card");
    }

    return card;
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("Credit card");
    }

    const references = await this.repository.countReferences({ id });

    if (references > 0) {
      throw new ConflictError(
        `This card is used by ${references} record(s). Archive it instead of deleting.`,
      );
    }

    await this.repository.delete({ id, userId });

    return { id };
  }

  private async assertBillingWallet({
    userId,
    card,
  }: {
    userId: string;
    card: CreditCardFormDto;
  }) {
    if (!card.defaultBillingWalletId) {
      return;
    }

    const wallet = await this.repository.findWalletById({
      id: card.defaultBillingWalletId,
      userId,
    });

    if (!wallet) {
      throw new NotFoundError("Wallet");
    }

    // The form gives an enum, the DB a plain string; compare as strings.
    const cardCurrency: string = card.currencyCode;

    if (wallet.currencyCode !== cardCurrency) {
      throw new ConflictError(
        `The billing wallet must use the card's currency. This card is ${card.currencyCode} and the wallet is ${wallet.currencyCode}.`,
      );
    }
  }
}
