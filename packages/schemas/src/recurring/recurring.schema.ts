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

export const RecurrenceTypeLabelMap: Record<RecurrenceType, string> = {
  [RecurrenceType.FIXED]: "Fixed installments",
  [RecurrenceType.WEEKLY]: "Weekly",
  [RecurrenceType.MONTHLY]: "Monthly",
  [RecurrenceType.YEARLY]: "Yearly",
};

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

export const RECURRING_ACCOUNT_MESSAGE =
  "Pick a wallet for income and expenses, or a card for card purchases";

export const RECURRING_INSTALLMENTS_MESSAGE = "Fixed installments need a count";

export const RecurringFieldsSchema = z.object({
  kind: z.enum(RECURRING_KINDS),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(
      TRANSACTION_NAME_MAX_LENGTH,
      `Name must be ${TRANSACTION_NAME_MAX_LENGTH} characters or fewer`,
    ),
  amountCents: TransactionAmountSchema,
  categoryId: z.uuid().nullable(),
  walletId: z.uuid().nullable(),
  creditCardId: z.uuid().nullable(),
  notes: z
    .string()
    .trim()
    .max(
      TRANSACTION_NOTES_MAX_LENGTH,
      `Notes must be ${TRANSACTION_NOTES_MAX_LENGTH} characters or fewer`,
    )
    .nullable(),
  recurrenceType: z.enum(Object.values(RecurrenceType)),
  interval: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1")
    .max(MAX_INTERVAL, `Must be ${MAX_INTERVAL} or fewer`),
  installments: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1")
    .max(MAX_INSTALLMENTS, `Must be ${MAX_INSTALLMENTS} or fewer`)
    .nullable(),
  startsOn: z.iso.date("Start date is required"),
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
  { message: RECURRING_ACCOUNT_MESSAGE, path: ["walletId"] },
).refine(hasInstallmentsWhenFixed, {
  message: RECURRING_INSTALLMENTS_MESSAGE,
  path: ["installments"],
});

export type RecurringFormDto = z.infer<typeof RecurringFieldsSchema>;

export const RecurringIdSchema = z.object({ id: z.uuid() });

export type RecurringIdDto = z.infer<typeof RecurringIdSchema>;
