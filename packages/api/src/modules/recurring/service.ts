import { ref } from "@budget-manager/i18n";
import {
  CategoryType,
  RecurrenceType,
  TransactionKind,
  TransactionStatus,
  type RecurringFormDto,
} from "@budget-manager/schemas";
import { formatDate } from "../../dates";
import { ConflictError, NotFoundError } from "../../errors";
import type { CreditCardService } from "../credit-card";
import type { RecurringRepository } from "./repository";
import { occurrenceDates, seriesEndsOn } from "./schedule";

export class RecurringService {
  constructor(
    private readonly repository: RecurringRepository,
    private readonly creditCards: CreditCardService,
  ) {}

  async getAll({
    userId,
    limit,
    offset,
  }: {
    userId: string;
    limit: number;
    offset: number;
  }) {
    const [rows, total] = await Promise.all([
      this.repository.getAll({ userId, limit, offset }),
      this.repository.count({ userId }),
    ]);

    return { rows, total, limit, offset };
  }

  async create({
    userId,
    recurring,
    now = new Date(),
  }: {
    userId: string;
    recurring: RecurringFormDto;
    now?: Date;
  }) {
    await this.assertReferences({ userId, recurring });

    const endsOn = seriesEndsOn(recurring.startsOn);
    const id = await this.repository.create({ userId, recurring, endsOn });
    const generated = await this.generate({
      id,
      userId,
      recurring,
      endsOn,
      now,
    });

    return { id, generated };
  }

  async update({
    id,
    userId,
    recurring,
    now = new Date(),
  }: {
    id: string;
    userId: string;
    recurring: RecurringFormDto;
    now?: Date;
  }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("error.notFound.recurring");
    }

    await this.assertReferences({ userId, recurring });

    const endsOn = seriesEndsOn(recurring.startsOn);
    const updated = await this.repository.update({
      id,
      userId,
      recurring,
      endsOn,
    });

    if (!updated) {
      throw new NotFoundError("error.notFound.recurring");
    }

    // Re-lay the schedule from today forward; settled and past rows stay put.
    const removed = await this.repository.deleteFuturePending({
      templateId: id,
      userId,
      from: formatDate(now),
    });

    // A paused series is edited but not re-scheduled until it resumes.
    const generated = existing.isActive
      ? await this.generate({ id, userId, recurring, endsOn, now })
      : 0;

    return { id, generated, removed };
  }

  async setActive({
    id,
    userId,
    isActive,
    now = new Date(),
  }: {
    id: string;
    userId: string;
    isActive: boolean;
    now?: Date;
  }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("error.notFound.recurring");
    }

    await this.repository.setActive({ id, userId, isActive });

    if (!isActive) {
      // Pausing clears what has not happened yet; history is untouched.
      const removed = await this.repository.deleteFuturePending({
        templateId: id,
        userId,
        from: formatDate(now),
      });

      return { id, isActive, removed, generated: 0 };
    }

    const generated = await this.generate({
      id,
      userId,
      recurring: {
        kind: existing.kind as RecurringFormDto["kind"],
        name: existing.name,
        amountCents: existing.amountCents,
        categoryId: existing.categoryId,
        walletId: existing.walletId,
        creditCardId: existing.creditCardId,
        notes: existing.notes,
        recurrenceType: existing.recurrenceType as RecurrenceType,
        interval: existing.interval,
        installments: existing.installments,
        startsOn: existing.startsOn,
      },
      // Resuming keeps the end date the row already carries.
      endsOn: existing.endsOn,
      now,
    });

    return { id, isActive, removed: 0, generated };
  }

  async delete({
    id,
    userId,
    now = new Date(),
  }: {
    id: string;
    userId: string;
    now?: Date;
  }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("error.notFound.recurring");
    }

    // Drop what has not happened yet, keep the history. The occurrence FK is
    // ON DELETE SET NULL, so surviving rows simply stop pointing at a series.
    const removed = await this.repository.deleteFuturePending({
      templateId: id,
      userId,
      from: formatDate(now),
    });

    await this.repository.delete({ id, userId });

    return { id, removed };
  }

  /**
   * Materializes missing dates for a series. Idempotent: dates that already
   * exist are skipped, so calling it twice never duplicates a row.
   */
  private async generate({
    id,
    userId,
    recurring,
    endsOn,
    now,
  }: {
    id: string;
    userId: string;
    recurring: RecurringFormDto;
    endsOn: string | null;
    now: Date;
  }) {
    const today = formatDate(now);
    const wanted = occurrenceDates({
      recurrenceType: recurring.recurrenceType,
      interval: recurring.interval,
      installments: recurring.installments,
      startsOn: recurring.startsOn,
      endsOn,
      today,
    });

    const existing = await this.repository.listOccurrenceDates({
      templateId: id,
      userId,
    });
    const seen = new Set(existing.map((row) => row.occurrenceDate));
    const missing = wanted.filter((date) => !seen.has(date));

    if (missing.length === 0) {
      return 0;
    }

    const isCardPurchase =
      recurring.kind === TransactionKind.CREDIT_CARD_PURCHASE;

    // A card purchase has to be filed against the statement for its own date,
    // so bills are resolved per occurrence rather than once for the series.
    const billByDate = new Map<string, string>();

    if (isCardPurchase && recurring.creditCardId) {
      for (const date of missing) {
        const { bill } = await this.creditCards.ensureBillFor({
          userId,
          creditCardId: recurring.creditCardId,
          date,
        });

        billByDate.set(date, bill.id);
      }
    }

    const inserted = await this.repository.insertOccurrences({
      values: missing.map((date) => ({
        userId,
        templateId: id,
        kind: recurring.kind,
        // Generated rows are always scheduled, never pre-settled.
        status: TransactionStatus.WAITING_PAYMENT,
        name: recurring.name,
        amountCents: recurring.amountCents,
        occurrenceDate: date,
        categoryId: recurring.categoryId,
        walletId: isCardPurchase ? null : recurring.walletId,
        creditCardId: isCardPurchase ? recurring.creditCardId : null,
        creditCardBillId: billByDate.get(date) ?? null,
        notes: recurring.notes,
        paidAt: null,
      })),
    });

    return inserted.length;
  }

  private async assertReferences({
    userId,
    recurring,
  }: {
    userId: string;
    recurring: RecurringFormDto;
  }) {
    if (
      recurring.recurrenceType === RecurrenceType.FIXED &&
      !recurring.installments
    ) {
      throw new ConflictError("error.conflict.fixedInstallmentsNeedCount");
    }

    if (recurring.kind === TransactionKind.CREDIT_CARD_PURCHASE) {
      if (!recurring.creditCardId) {
        throw new ConflictError("error.conflict.cardPurchaseSeriesNeedsCard");
      }

      // Validates ownership; the bill itself is resolved per occurrence.
      await this.creditCards.assertCardOwned({
        userId,
        creditCardId: recurring.creditCardId,
      });
    } else {
      if (!recurring.walletId) {
        throw new ConflictError("error.conflict.seriesNeedsWallet");
      }

      const wallet = await this.repository.findWalletById({
        id: recurring.walletId,
        userId,
      });

      if (!wallet) {
        throw new NotFoundError("error.notFound.wallet");
      }
    }

    if (!recurring.categoryId) {
      return;
    }

    const category = await this.repository.findCategoryById({
      id: recurring.categoryId,
      userId,
    });

    if (!category) {
      throw new NotFoundError("error.notFound.category");
    }

    // The form gives an enum, the DB a plain string; compare as strings.
    const expected: string =
      recurring.kind === TransactionKind.INCOME
        ? CategoryType.INCOME
        : CategoryType.EXPENSE;

    if (category.type !== expected) {
      throw new ConflictError("error.conflict.categoryOnSeries", {
        categoryType: ref(`enum.categoryType.${category.type}.inline`),
        kind: ref(`enum.transactionKind.${recurring.kind}.inline`),
      });
    }
  }
}
