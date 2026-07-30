import { PAGE_SIZE, toOffset } from "@/lib/pagination";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export type BillStatus = "open" | "awaiting_payment" | "paid";

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  open: "Open",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
};

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
