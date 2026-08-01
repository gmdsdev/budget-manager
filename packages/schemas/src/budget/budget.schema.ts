import { t } from "@budget-manager/i18n";
import { z } from "zod";
import {
  hasInstallmentsWhenFixed,
  MAX_INSTALLMENTS,
  MAX_INTERVAL,
  RecurrenceType,
} from "../recurring/recurring.schema";
import { MoneyMinorUnitsSchema, WalletCurrency } from "../wallet/wallet.schema";

/**
 * A budget period is a calendar month, so the schedule only speaks in months:
 * `weekly` is deliberately absent. A weekly limit cannot be laid over months
 * without either splitting a week across two of them or inventing a period the
 * spending query cannot group by.
 */
export const BUDGET_RECURRENCE_TYPES = [
  RecurrenceType.FIXED,
  RecurrenceType.MONTHLY,
  RecurrenceType.YEARLY,
] as const;

export type BudgetRecurrenceType = (typeof BUDGET_RECURRENCE_TYPES)[number];

export function isBudgetRecurrenceType(
  value: string,
): value is BudgetRecurrenceType {
  return (BUDGET_RECURRENCE_TYPES as readonly string[]).includes(value);
}

/** How much of a limit may be spent before the meter reads as a warning. */
export const BUDGET_WARNING_RATIO = 0.8;

export enum BudgetStatus {
  ON_TRACK = "on_track",
  WARNING = "warning",
  EXCEEDED = "exceeded",
}

/** `YYYY-MM`, the same key the spending queries group by. */
export const MonthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { error: () => t("validation.monthRequired") });

export const BudgetLimitSchema = MoneyMinorUnitsSchema.min(1, {
  error: () => t("validation.limitGreaterThanZero"),
});

export const BudgetFieldsSchema = z.object({
  categoryId: z.uuid({ error: () => t("validation.categoryRequired") }),
  currencyCode: z.enum(Object.values(WalletCurrency)),
  amountCents: BudgetLimitSchema,
  recurrenceType: z.enum(BUDGET_RECURRENCE_TYPES),
  interval: z
    .number()
    .int({ error: () => t("validation.wholeNumber") })
    .min(1, { error: () => t("validation.atLeast", { min: 1 }) })
    .max(MAX_INTERVAL, {
      error: () => t("validation.atMost", { max: MAX_INTERVAL }),
    }),
  installments: z
    .number()
    .int({ error: () => t("validation.wholeNumber") })
    .min(1, { error: () => t("validation.atLeast", { min: 1 }) })
    .max(MAX_INSTALLMENTS, {
      error: () => t("validation.atMost", { max: MAX_INSTALLMENTS }),
    })
    .nullable(),
  startsOn: MonthKeySchema,
});

export const BudgetFormSchema = BudgetFieldsSchema.refine(
  hasInstallmentsWhenFixed,
  {
    error: () => t("validation.budgetInstallments"),
    path: ["installments"],
  },
);

export type BudgetFormDto = z.infer<typeof BudgetFieldsSchema>;

export const BudgetIdSchema = z.object({ id: z.uuid() });

export type BudgetIdDto = z.infer<typeof BudgetIdSchema>;

/** One month of a series, edited on its own without touching the rest. */
export const BudgetPeriodFormSchema = z.object({
  amountCents: BudgetLimitSchema,
});

export type BudgetPeriodFormDto = z.infer<typeof BudgetPeriodFormSchema>;

export const BudgetPeriodAmountSchema = BudgetPeriodFormSchema.extend({
  id: z.uuid(),
});

export type BudgetPeriodAmountDto = z.infer<typeof BudgetPeriodAmountSchema>;
