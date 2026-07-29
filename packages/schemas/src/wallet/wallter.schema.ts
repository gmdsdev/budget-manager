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

export const WalletSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(Object.values(WalletType)),
  openingBalanceCents: z.number(),
  currentBalanceCents: z.number(),
  currency: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WalletDto = z.infer<typeof WalletSchema>;

export const WalletFormSchema = WalletSchema.pick({
  name: true,
  type: true,
  openingBalanceCents: true,
  currency: true,
});

export type WalletFormDto = z.infer<typeof WalletFormSchema>;

export const DeleteWalletSchema = WalletSchema.pick({ id: true });

export type DeleteWalletDto = z.infer<typeof DeleteWalletSchema>;
