export type CreditCardRow = {
  id: string;
  name: string;
  limitCents: number;
  closeDay: number;
  dueDay: number;
  defaultBillingWalletId: string | null;
  defaultBillingWalletName: string | null;
  currencyCode: string;
  isArchived: boolean;
  outstandingCents: number;
  projectedOutstandingCents: number;
  availableCents: number;
  createdAt: Date;
  updatedAt: Date;
};
