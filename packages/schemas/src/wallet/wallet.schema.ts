import { t } from "@budget-manager/i18n";
import {
  MONEY_MAX_MINOR_UNITS,
  MONEY_MIN_MINOR_UNITS,
} from "@budget-manager/money";
import { z } from "zod";

export enum WalletType {
  CHECKING = "checking",
  SAVINGS = "savings",
  INVESTMENTS = "investments",
  CASH = "cash",
}

export enum WalletCurrency {
  BRL = "BRL",
  USD = "USD",
  EUR = "EUR",
  GBP = "GBP",
  JPY = "JPY",
  KRW = "KRW",
  CNY = "CNY",
}

export function isWalletCurrency(value: string): value is WalletCurrency {
  return (Object.values(WalletCurrency) as string[]).includes(value);
}

export const WALLET_NAME_MAX_LENGTH = 120;

export const MoneyMinorUnitsSchema = z
  .number()
  .int({ error: () => t("validation.wholeNumber") })
  .min(MONEY_MIN_MINOR_UNITS)
  .max(MONEY_MAX_MINOR_UNITS);

export const WalletSchema = z.object({
  id: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, { error: () => t("validation.nameRequired") })
    .max(WALLET_NAME_MAX_LENGTH, {
      error: () => t("validation.nameTooLong", { max: WALLET_NAME_MAX_LENGTH }),
    }),
  type: z.enum(Object.values(WalletType)),
  openingBalanceCents: MoneyMinorUnitsSchema,
  currencyCode: z.enum(Object.values(WalletCurrency)),
  isArchived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WalletDto = z.infer<typeof WalletSchema>;

export const WalletFormSchema = WalletSchema.pick({
  name: true,
  type: true,
  openingBalanceCents: true,
  currencyCode: true,
});

export type WalletFormDto = z.infer<typeof WalletFormSchema>;

export const DeleteWalletSchema = WalletSchema.pick({ id: true });

export type DeleteWalletDto = z.infer<typeof DeleteWalletSchema>;
