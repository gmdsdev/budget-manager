import { PAGE_SIZE, toOffset } from "@/lib/pagination";
import { trpc } from "@/utils/trpc";
import type { MessageKey } from "@budget-manager/i18n";
import { useQuery } from "@tanstack/react-query";

export type BillStatus = "open" | "awaiting_payment" | "paid";

/** The catalog key each status reads as, resolved by the component that shows it. */
export const BILL_STATUS_KEYS = {
  open: "creditCard.bills.status.open",
  awaiting_payment: "creditCard.bills.status.awaiting_payment",
  paid: "creditCard.bills.status.paid",
} as const satisfies Record<BillStatus, MessageKey>;

export function useCreditCardBillsQuery(creditCardId: string, page = 1) {
  return useQuery(
    trpc.creditCard.bills.queryOptions({
      creditCardId,
      limit: PAGE_SIZE,
      offset: toOffset(page),
    }),
  );
}

/** Statements for a card, for the payment form's optional allocation select. */
export function useBillOptionsQuery(creditCardId: string | null) {
  return useQuery({
    ...trpc.creditCard.bills.queryOptions({
      creditCardId: creditCardId ?? "",
      limit: 100,
      offset: 0,
    }),
    enabled: Boolean(creditCardId),
  });
}
