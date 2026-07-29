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

export const WalletSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(Object.values(WalletType)),
  openingBalanceCents: z.number(),
  currentBalanceCents: z.number(),
  currencyCode: z.enum(Object.values(WalletCurrency)),
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
