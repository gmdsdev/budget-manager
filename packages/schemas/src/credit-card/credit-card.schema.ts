import { z } from "zod";
import { MoneyMinorUnitsSchema, WalletCurrency } from "../wallet/wallet.schema";

export const CREDIT_CARD_NAME_MAX_LENGTH = 120;

/** Cards close and fall due on a day of the month. */
export const CYCLE_DAY_MIN = 1;
export const CYCLE_DAY_MAX = 28;

const CycleDaySchema = z
  .number()
  .int("Must be a whole number")
  .min(CYCLE_DAY_MIN, `Must be between ${CYCLE_DAY_MIN} and ${CYCLE_DAY_MAX}`)
  .max(CYCLE_DAY_MAX, `Must be between ${CYCLE_DAY_MIN} and ${CYCLE_DAY_MAX}`);

export const CreditCardSchema = z.object({
  id: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(
      CREDIT_CARD_NAME_MAX_LENGTH,
      `Name must be ${CREDIT_CARD_NAME_MAX_LENGTH} characters or fewer`,
    ),
  limitCents: MoneyMinorUnitsSchema.min(1, "Limit must be greater than zero"),
  closeDay: CycleDaySchema,
  dueDay: CycleDaySchema,
  defaultBillingWalletId: z.uuid().nullable(),
  currencyCode: z.enum(Object.values(WalletCurrency)),
  isArchived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreditCardDto = z.infer<typeof CreditCardSchema>;

export const CreditCardFormSchema = CreditCardSchema.pick({
  name: true,
  limitCents: true,
  closeDay: true,
  dueDay: true,
  defaultBillingWalletId: true,
  currencyCode: true,
});

export type CreditCardFormDto = z.infer<typeof CreditCardFormSchema>;

export const DeleteCreditCardSchema = CreditCardSchema.pick({ id: true });

export type DeleteCreditCardDto = z.infer<typeof DeleteCreditCardSchema>;
