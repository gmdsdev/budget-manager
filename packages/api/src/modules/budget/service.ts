import { ref } from "@budget-manager/i18n";
import {
  CategoryType,
  RecurrenceType,
  type BudgetFormDto,
} from "@budget-manager/schemas";
import { monthDateRange, monthKeyOf } from "../../dates";
import { ConflictError, NotFoundError } from "../../errors";
import {
  buildBudgetHistory,
  buildBudgetProgress,
  buildBudgetTotals,
} from "./progress";
import type { BudgetFilters, BudgetRepository } from "./repository";
import { budgetEndsOn, budgetMonths } from "./schedule";

export class BudgetService {
  constructor(private readonly repository: BudgetRepository) {}

  async getAll({
    userId,
    limit,
    offset,
    ...filters
  }: BudgetFilters & { userId: string; limit: number; offset: number }) {
    const [rows, total] = await Promise.all([
      this.repository.getAll({ userId, limit, offset, ...filters }),
      this.repository.count({ userId, ...filters }),
    ]);

    return { rows, total, limit, offset };
  }

  async create({
    userId,
    budget,
    now = new Date(),
  }: {
    userId: string;
    budget: BudgetFormDto;
    now?: Date;
  }) {
    await this.assertReferences({ userId, budget });

    const existing = await this.repository.findByCategory({
      userId,
      categoryId: budget.categoryId,
      currencyCode: budget.currencyCode,
    });

    if (existing) {
      throw new ConflictError("error.conflict.budgetAlreadyExists", {
        currency: budget.currencyCode,
      });
    }

    const endsOn = budgetEndsOn(budget.startsOn);
    const id = await this.repository.create({ userId, budget, endsOn });
    const generated = await this.generate({ id, userId, budget, endsOn, now });

    return { id, generated };
  }

  async update({
    id,
    userId,
    budget,
    now = new Date(),
  }: {
    id: string;
    userId: string;
    budget: BudgetFormDto;
    now?: Date;
  }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("error.notFound.budget");
    }

    await this.assertReferences({
      userId,
      budget,
      // A category already on the budget stays usable even once archived;
      // only moving the budget to a different one has to pick a live category.
      allowArchived: budget.categoryId === existing.categoryId,
    });

    const clash = await this.repository.findByCategory({
      userId,
      categoryId: budget.categoryId,
      currencyCode: budget.currencyCode,
    });

    if (clash && clash.id !== id) {
      throw new ConflictError("error.conflict.budgetAlreadyExists", {
        currency: budget.currencyCode,
      });
    }

    const endsOn = budgetEndsOn(budget.startsOn);
    const updated = await this.repository.update({
      id,
      userId,
      budget,
      endsOn,
    });

    if (!updated) {
      throw new NotFoundError("error.notFound.budget");
    }

    // Re-lay the schedule from the month in progress forward. Months already
    // lived through are history, and a month the user set by hand is a choice.
    const removed = await this.repository.deleteFutureInherited({
      budgetId: id,
      userId,
      from: monthKeyOf(now),
    });

    // A paused budget is edited but not re-scheduled until it resumes.
    const generated = existing.isActive
      ? await this.generate({ id, userId, budget, endsOn, now })
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
      throw new NotFoundError("error.notFound.budget");
    }

    await this.repository.setActive({ id, userId, isActive });

    if (!isActive) {
      const removed = await this.repository.deleteFutureInherited({
        budgetId: id,
        userId,
        from: monthKeyOf(now),
      });

      return { id, isActive, removed, generated: 0 };
    }

    const generated = await this.generate({
      id,
      userId,
      budget: {
        categoryId: existing.categoryId,
        currencyCode: existing.currencyCode as BudgetFormDto["currencyCode"],
        amountCents: existing.amountCents,
        recurrenceType:
          existing.recurrenceType as BudgetFormDto["recurrenceType"],
        interval: existing.interval,
        installments: existing.installments,
        startsOn: existing.startsOn,
      },
      // Resuming keeps the end month the row already carries.
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
      throw new NotFoundError("error.notFound.budget");
    }

    // Drop the months not yet started, keep the ones already lived through. The
    // period FK is ON DELETE SET NULL, so survivors stop pointing at a series.
    const removed = await this.repository.deleteFutureInherited({
      budgetId: id,
      userId,
      from: monthKeyOf(now),
    });

    await this.repository.delete({ id, userId });

    return { id, removed };
  }

  /**
   * Every budgeted category for one month, with what it has actually cost.
   * Not a page of anything: the figures describe the whole month, so there is
   * nothing to paginate.
   */
  async getMonth({
    userId,
    month,
    now = new Date(),
  }: {
    userId: string;
    month?: string;
    now?: Date;
  }) {
    const resolvedMonth = month ?? monthKeyOf(now);
    const { from, to } = monthDateRange(resolvedMonth);

    const [periods, spend] = await Promise.all([
      this.repository.listPeriodsForMonth({ userId, month: resolvedMonth }),
      this.repository.getCategorySpend({ userId, from, to }),
    ]);

    const rows = buildBudgetProgress(periods, spend);

    return {
      month: resolvedMonth,
      rows,
      totals: buildBudgetTotals(rows),
    };
  }

  /**
   * The months one budget covers, each with its own spending. This is the list
   * a user edits a single month's limit from.
   */
  async getPeriods({ id, userId }: { id: string; userId: string }) {
    const budget = await this.repository.findById({ id, userId });

    if (!budget) {
      throw new NotFoundError("error.notFound.budget");
    }

    const periods = await this.repository.listPeriods({ budgetId: id, userId });

    if (periods.length === 0) {
      return { id, rows: [] };
    }

    const months = periods.map((period) => period.periodMonth).sort();
    const first = months[0] ?? budget.startsOn;
    const last = months.at(-1) ?? budget.startsOn;

    const spend = await this.repository.getCategorySpendByMonth({
      userId,
      from: monthDateRange(first).from,
      to: monthDateRange(last).to,
    });

    return { id, rows: buildBudgetHistory(periods, spend) };
  }

  /**
   * Overrides one month's limit. The flag is what protects the row from the
   * next time the series re-lays its schedule.
   */
  async setPeriodAmount({
    id,
    userId,
    amountCents,
  }: {
    id: string;
    userId: string;
    amountCents: number;
  }) {
    const existing = await this.repository.findPeriodById({ id, userId });

    if (!existing) {
      throw new NotFoundError("error.notFound.budgetPeriod");
    }

    await this.repository.setPeriodAmount({
      id,
      userId,
      amountCents,
      isOverride: true,
    });

    return { id, amountCents };
  }

  /** Hands a month back to its series, at whatever the series now says. */
  async resetPeriod({ id, userId }: { id: string; userId: string }) {
    const existing = await this.repository.findPeriodById({ id, userId });

    if (!existing) {
      throw new NotFoundError("error.notFound.budgetPeriod");
    }

    if (!existing.budgetId) {
      throw new ConflictError("error.conflict.budgetPeriodOrphaned");
    }

    const budget = await this.repository.findById({
      id: existing.budgetId,
      userId,
    });

    if (!budget) {
      throw new NotFoundError("error.notFound.budget");
    }

    await this.repository.setPeriodAmount({
      id,
      userId,
      amountCents: budget.amountCents,
      isOverride: false,
    });

    return { id, amountCents: budget.amountCents };
  }

  /**
   * Materializes the months a budget is missing. Idempotent: months that
   * already exist are skipped, so calling it twice never duplicates a limit.
   */
  private async generate({
    id,
    userId,
    budget,
    endsOn,
    now,
  }: {
    id: string;
    userId: string;
    budget: BudgetFormDto;
    endsOn: string | null;
    now: Date;
  }) {
    const wanted = budgetMonths({
      recurrenceType: budget.recurrenceType,
      interval: budget.interval,
      installments: budget.installments,
      startsOn: budget.startsOn,
      endsOn,
      today: monthKeyOf(now),
    });

    const existing = await this.repository.listPeriodMonths({
      budgetId: id,
      userId,
    });
    const seen = new Set(existing.map((row) => row.periodMonth));
    const missing = wanted.filter((month) => !seen.has(month));

    if (missing.length === 0) {
      return 0;
    }

    const inserted = await this.repository.insertPeriods({
      values: missing.map((month) => ({
        userId,
        budgetId: id,
        categoryId: budget.categoryId,
        currencyCode: budget.currencyCode,
        periodMonth: month,
        amountCents: budget.amountCents,
        isOverride: false,
      })),
    });

    return inserted.length;
  }

  private async assertReferences({
    userId,
    budget,
    allowArchived = false,
  }: {
    userId: string;
    budget: BudgetFormDto;
    allowArchived?: boolean;
  }) {
    if (
      budget.recurrenceType === RecurrenceType.FIXED &&
      !budget.installments
    ) {
      throw new ConflictError("error.conflict.fixedInstallmentsNeedCount");
    }

    const category = await this.repository.findCategoryById({
      id: budget.categoryId,
      userId,
    });

    if (!category) {
      throw new NotFoundError("error.notFound.category");
    }

    // A budget caps spending, so an income category cannot carry one. The DB
    // hands back a plain string, so the comparison is made as one.
    const expected: string = CategoryType.EXPENSE;

    if (category.type !== expected) {
      throw new ConflictError("error.conflict.budgetCategoryType", {
        categoryType: ref(`enum.categoryType.${category.type}.inline`),
      });
    }

    if (category.isArchived && !allowArchived) {
      throw new ConflictError("error.conflict.budgetCategoryArchived");
    }
  }
}
