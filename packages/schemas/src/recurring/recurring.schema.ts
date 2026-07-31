import { t } from "@budget-manager/i18n";
import { z } from "zod";
import {
  TRANSACTION_NAME_MAX_LENGTH,
  TRANSACTION_NOTES_MAX_LENGTH,
  TransactionAmountSchema,
  TransactionKind,
} from "../transaction/transaction.schema";

/** Mirrors the `recurrence_type` pg enum exactly. */
export enum RecurrenceType {
  FIXED = "fixed",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

/** The kinds a recurring series can produce. */
export const RECURRING_KINDS = [
  TransactionKind.INCOME,
  TransactionKind.EXPENSE,
  TransactionKind.CREDIT_CARD_PURCHASE,
] as const;

export type RecurringKind = (typeof RECURRING_KINDS)[number];

export const MAX_INTERVAL = 52;
export const MAX_INSTALLMENTS = 360;

/**
 * How long an open-ended series runs for. Long enough that nobody budgets past
 * it, which is why the end date is derived from the start rather than asked for.
 */
export const RECURRENCE_YEARS = 50;

export const RecurringFieldsSchema = z.object({
  kind: z.enum(RECURRING_KINDS),
  name: z
    .string()
    .trim()
    .min(1, { error: () => t("validation.nameRequired") })
    .max(TRANSACTION_NAME_MAX_LENGTH, {
      error: () =>
        t("validation.nameTooLong", { max: TRANSACTION_NAME_MAX_LENGTH }),
    }),
  amountCents: TransactionAmountSchema,
  categoryId: z.uuid().nullable(),
  walletId: z.uuid().nullable(),
  creditCardId: z.uuid().nullable(),
  notes: z
    .string()
    .trim()
    .max(TRANSACTION_NOTES_MAX_LENGTH, {
      error: () =>
        t("validation.notesTooLong", { max: TRANSACTION_NOTES_MAX_LENGTH }),
    })
    .nullable(),
  recurrenceType: z.enum(Object.values(RecurrenceType)),
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
  startsOn: z.iso.date({ error: () => t("validation.startDateRequired") }),
});

/** A card purchase bills a card; income and expenses move a wallet. */
export const hasMatchingAccount = (value: {
  kind: RecurringKind;
  walletId: string | null;
  creditCardId: string | null;
}) =>
  value.kind === TransactionKind.CREDIT_CARD_PURCHASE
    ? Boolean(value.creditCardId)
    : Boolean(value.walletId);

export const hasInstallmentsWhenFixed = (value: {
  recurrenceType: RecurrenceType;
  installments: number | null;
}) =>
  value.recurrenceType !== RecurrenceType.FIXED || Boolean(value.installments);

export const RecurringFormSchema = RecurringFieldsSchema.refine(
  hasMatchingAccount,
  { error: () => t("validation.recurringAccount"), path: ["walletId"] },
).refine(hasInstallmentsWhenFixed, {
  error: () => t("validation.recurringInstallments"),
  path: ["installments"],
});

export type RecurringFormDto = z.infer<typeof RecurringFieldsSchema>;

export const RecurringIdSchema = z.object({ id: z.uuid() });

export type RecurringIdDto = z.infer<typeof RecurringIdSchema>;
