import type { WalletType } from "@budget-manager/schemas";

export type WalletRow = {
  id: string;
  name: string;
  type: WalletType;
  openingBalanceCents: number;
  currencyCode: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};
