import type { RecurrenceType, RecurringKind } from "@budget-manager/schemas";

export type RecurringRow = {
  id: string;
  kind: RecurringKind;
  name: string;
  amountCents: number;
  categoryId: string | null;
  categoryName: string | null;
  walletId: string | null;
  walletName: string | null;
  creditCardId: string | null;
  creditCardName: string | null;
  currencyCode: string | null;
  notes: string | null;
  isActive: boolean;
  recurrenceType: RecurrenceType;
  interval: number;
  installments: number | null;
  startsOn: string;
  endsOn: string | null;
  occurrenceCount: number;
};
