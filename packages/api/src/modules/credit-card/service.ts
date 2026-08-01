import type { CreditCardFormDto } from "@budget-manager/schemas";
import { formatDate } from "../../dates";
import { ConflictError, NotFoundError } from "../../errors";
import { computeCardBalances } from "./balance";
import { computeBillTotals } from "./bill-totals";
import { cycleFor, type BillCycle } from "./cycle";
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
      throw new NotFoundError("error.notFound.creditCard");
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
      throw new NotFoundError("error.notFound.creditCard");
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

  /**
   * The statements a whole set of dates belongs to, keyed by date. A series
   * resolves every occurrence it is about to write through this rather than one
   * date at a time: the card is read once, and dates that share a cycle share
   * one upsert, so a weekly year of purchases costs twelve statements instead
   * of fifty-two round trips.
   */
  async ensureBillsFor({
    userId,
    creditCardId,
    dates,
  }: {
    userId: string;
    creditCardId: string;
    dates: string[];
  }) {
    const card = await this.repository.findById({ id: creditCardId, userId });

    if (!card) {
      throw new NotFoundError("error.notFound.creditCard");
    }

    const cycles = new Map<string, BillCycle>();
    const cycleKeyByDate = new Map<string, string>();

    for (const date of dates) {
      const cycle = cycleFor({
        date,
        closeDay: card.closeDay,
        dueDay: card.dueDay,
      });
      const key = `${cycle.periodStart}:${cycle.periodEnd}`;

      cycles.set(key, cycle);
      cycleKeyByDate.set(date, key);
    }

    const bills = await Promise.all(
      [...cycles].map(async ([key, cycle]) => {
        const bill = await this.repository.ensureBill({
          userId,
          creditCardId,
          cycle,
          billingWalletId: card.defaultBillingWalletId,
        });

        if (!bill) {
          throw new Error("Bill upsert returned no row");
        }

        return [key, bill.id] as const;
      }),
    );

    const billIdByCycle = new Map(bills);
    const billIdByDate = new Map<string, string>();

    for (const [date, key] of cycleKeyByDate) {
      const billId = billIdByCycle.get(key);

      if (billId) {
        billIdByDate.set(date, billId);
      }
    }

    return { billIdByDate, card };
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
      throw new NotFoundError("error.notFound.creditCard");
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
      throw new NotFoundError("error.notFound.bill");
    }

    if (bill.creditCardId !== creditCardId) {
      throw new ConflictError("error.conflict.billDifferentCard");
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
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("error.notFound.creditCard");
    }

    await this.assertBillingWallet({ userId, card });
    await this.assertCurrencyStillFree({ id, existing, card });

    const patch: CreditCardUpdatePatch = card;
    const updated = await this.repository.update({ id, userId, patch });

    if (!updated) {
      throw new NotFoundError("error.notFound.creditCard");
    }

    return updated;
  }

  async archive({ id, userId }: { id: string; userId: string }) {
    const card = await this.repository.archive({ id, userId });

    if (!card) {
      throw new NotFoundError("error.notFound.creditCard");
    }

    return card;
  }

  async unarchive({ id, userId }: { id: string; userId: string }) {
    const card = await this.repository.unarchive({ id, userId });

    if (!card) {
      throw new NotFoundError("error.notFound.creditCard");
    }

    return card;
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("error.notFound.creditCard");
    }

    const references = await this.repository.countReferences({ id });

    if (references > 0) {
      throw new ConflictError("error.conflict.cardInUse", { references });
    }

    await this.repository.delete({ id, userId });

    return { id };
  }

  /**
   * A card's currency is the currency of every purchase filed against it and of
   * the wallet that pays its bills. Changing it under statements that already
   * exist would reprice them and break the wallet match the payment path
   * enforces, so it is fixed from the first row that references the card.
   */
  private async assertCurrencyStillFree({
    id,
    existing,
    card,
  }: {
    id: string;
    existing: { currencyCode: string };
    card: CreditCardFormDto;
  }) {
    const nextCurrency: string = card.currencyCode;

    if (nextCurrency === existing.currencyCode) {
      return;
    }

    const references = await this.repository.countReferences({ id });

    if (references > 0) {
      throw new ConflictError("error.conflict.cardCurrencyInUse", {
        references,
      });
    }
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
      throw new NotFoundError("error.notFound.wallet");
    }

    // The form gives an enum, the DB a plain string; compare as strings.
    const cardCurrency: string = card.currencyCode;

    if (wallet.currencyCode !== cardCurrency) {
      throw new ConflictError("error.conflict.billingWalletCurrency", {
        cardCurrency: card.currencyCode,
        walletCurrency: wallet.currencyCode,
      });
    }
  }
}
