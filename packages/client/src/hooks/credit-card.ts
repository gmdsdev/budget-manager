import { t } from "@budget-manager/i18n";
import type {
  CreditCardFormDto,
  DeleteCreditCardDto,
} from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";

import {
  type CreditCardFiltersState,
  type CreditCardRow,
  creditCardsQueryInput,
} from "../credit-card";
import { PAGE_SIZE, toOffset } from "../pagination";
import { api } from "../runtime";
import { useApiMutation } from "../use-api-mutation";

export function useCreditCardsQuery(
  filters?: CreditCardFiltersState,
  page = 1,
) {
  const trpc = api();

  return useQuery({
    ...trpc.creditCard.getAll.queryOptions(creditCardsQueryInput(filters, page)),
    select: (data) => ({
      total: data.total,
      rows: data.rows.map(
        (row): CreditCardRow => ({
          ...row,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }),
      ),
    }),
  });
}

/** Every non-archived card, unpaginated — for select inputs. */
export function useCreditCardOptionsQuery() {
  return useQuery(api().creditCard.options.queryOptions());
}

export function useCreditCardBillsQuery(creditCardId: string, page = 1) {
  return useQuery(
    api().creditCard.bills.queryOptions({
      creditCardId,
      limit: PAGE_SIZE,
      offset: toOffset(page),
    }),
  );
}

/** Statements for a card, for the payment form's optional allocation select. */
export function useBillOptionsQuery(creditCardId: string | null) {
  return useQuery({
    ...api().creditCard.bills.queryOptions({
      creditCardId: creditCardId ?? "",
      limit: 100,
      offset: 0,
    }),
    enabled: Boolean(creditCardId),
  });
}

function creditCardInvalidations() {
  const trpc = api();

  return [
    trpc.creditCard.getAll.queryFilter(),
    trpc.creditCard.options.queryFilter(),
    // The ledger names the card a purchase sits on, and archiving one takes its rows
    // out of the totals — both are derived from the card row.
    trpc.transaction.getAll.queryFilter(),
    trpc.transaction.summary.queryFilter(),
    trpc.dashboard.getSummary.queryFilter(),
  ];
}

export function useCreateCreditCardMutation() {
  return useApiMutation<unknown, CreditCardFormDto>({
    mutationFn: api().creditCard.create.mutationOptions().mutationFn,
    successMessage: t("creditCard.toast.created"),
    invalidateQueries: creditCardInvalidations(),
  });
}

export function useUpdateCreditCardMutation() {
  return useApiMutation<unknown, CreditCardFormDto & { id: string }>({
    mutationFn: api().creditCard.update.mutationOptions().mutationFn,
    successMessage: t("creditCard.toast.updated"),
    invalidateQueries: creditCardInvalidations(),
  });
}

export function useArchiveCreditCardMutation() {
  return useApiMutation<unknown, DeleteCreditCardDto>({
    mutationFn: api().creditCard.archive.mutationOptions().mutationFn,
    successMessage: t("creditCard.toast.archived"),
    invalidateQueries: creditCardInvalidations(),
  });
}

export function useUnarchiveCreditCardMutation() {
  return useApiMutation<unknown, DeleteCreditCardDto>({
    mutationFn: api().creditCard.unarchive.mutationOptions().mutationFn,
    successMessage: t("creditCard.toast.restored"),
    invalidateQueries: creditCardInvalidations(),
  });
}

export function useDeleteCreditCardMutation() {
  return useApiMutation<unknown, DeleteCreditCardDto>({
    mutationFn: api().creditCard.delete.mutationOptions().mutationFn,
    successMessage: t("creditCard.toast.deleted"),
    invalidateQueries: creditCardInvalidations(),
  });
}
