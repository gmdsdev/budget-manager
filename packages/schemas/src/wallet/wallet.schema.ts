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

export const WalletTypeLabelMap: Record<WalletType, string> = {
  [WalletType.CHECKING]: "Checking",
  [WalletType.SAVINGS]: "Savings",
  [WalletType.INVESTMENTS]: "Investments",
  [WalletType.CASH]: "Cash",
};

export enum WalletCurrency {
  BRL = "BRL",
  USD = "USD",
  EUR = "EUR",
  GBP = "GBP",
  JPY = "JPY",
  KRW = "KRW",
  CNY = "CNY",
}

export const WalletCurrencyLabelMap: Record<WalletCurrency, string> = {
  [WalletCurrency.BRL]: "BRL - Brazilian Real",
  [WalletCurrency.USD]: "USD - United States Dollar",
  [WalletCurrency.EUR]: "EUR - Euro",
  [WalletCurrency.GBP]: "GBP - British Pound",
  [WalletCurrency.JPY]: "JPY - Japanese Yen",
  [WalletCurrency.KRW]: "KRW - South Korean Won",
  [WalletCurrency.CNY]: "CNY - Chinese Yuan",
};

export const WALLET_NAME_MAX_LENGTH = 120;

export const MoneyMinorUnitsSchema = z
  .number()
  .int("Must be a whole number")
  .min(MONEY_MIN_MINOR_UNITS)
  .max(MONEY_MAX_MINOR_UNITS);

export const WalletSchema = z.object({
  id: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(
      WALLET_NAME_MAX_LENGTH,
      `Name must be ${WALLET_NAME_MAX_LENGTH} characters or fewer`,
    ),
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
