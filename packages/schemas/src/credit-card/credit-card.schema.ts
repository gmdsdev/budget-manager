import { t } from "@budget-manager/i18n";
import { z } from "zod";
import { MoneyMinorUnitsSchema, WalletCurrency } from "../wallet/wallet.schema";

export const CREDIT_CARD_NAME_MAX_LENGTH = 120;

/** Cards close and fall due on a day of the month. */
export const CYCLE_DAY_MIN = 1;
export const CYCLE_DAY_MAX = 28;

const cycleDayRange = () =>
  t("validation.cycleDayRange", { min: CYCLE_DAY_MIN, max: CYCLE_DAY_MAX });

const CycleDaySchema = z
  .number()
  .int({ error: () => t("validation.wholeNumber") })
  .min(CYCLE_DAY_MIN, { error: cycleDayRange })
  .max(CYCLE_DAY_MAX, { error: cycleDayRange });

export const CreditCardSchema = z.object({
  id: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, { error: () => t("validation.nameRequired") })
    .max(CREDIT_CARD_NAME_MAX_LENGTH, {
      error: () =>
        t("validation.nameTooLong", { max: CREDIT_CARD_NAME_MAX_LENGTH }),
    }),
  limitCents: MoneyMinorUnitsSchema.min(1, {
    error: () => t("validation.limitGreaterThanZero"),
  }),
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
