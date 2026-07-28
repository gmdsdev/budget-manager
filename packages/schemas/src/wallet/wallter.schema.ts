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
  balance: z.number(),
  currency: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WalletDto = z.infer<typeof WalletSchema>;

export const CreateWalletSchema = WalletSchema.pick({
  name: true,
  type: true,
  balance: true,
  currency: true,
});

export type CreateWalletDto = z.infer<typeof CreateWalletSchema>;

export const UpdateWalletSchema = WalletSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type UpdateWalletDto = z.infer<typeof UpdateWalletSchema>;

export const DeleteWalletSchema = WalletSchema.pick({ id: true });

export type DeleteWalletDto = z.infer<typeof DeleteWalletSchema>;
