import type { RecurrenceType, RecurringKind } from "@budget-manager/schemas";

import { PAGE_SIZE, toOffset } from "./pagination";

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

export function recurringQueryInput(page = 1) {
  return { limit: PAGE_SIZE, offset: toOffset(page) };
}
