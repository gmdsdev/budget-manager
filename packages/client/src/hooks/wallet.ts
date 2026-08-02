import { t } from "@budget-manager/i18n";
import type { DeleteWalletDto, WalletFormDto, WalletType } from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";

import { api } from "../runtime";
import { useApiMutation } from "../use-api-mutation";
import {
  type WalletFiltersState,
  type WalletRow,
  walletsQueryInput,
} from "../wallet";

export function useWalletsQuery(filters?: WalletFiltersState, page = 1) {
  const trpc = api();

  return useQuery({
    ...trpc.wallet.getAll.queryOptions(walletsQueryInput(filters, page)),
    select: (data) => ({
      total: data.total,
      rows: data.rows.map(
        (row): WalletRow => ({
          ...row,
          type: row.type as WalletType,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }),
      ),
    }),
  });
}

/**
 * Every non-archived wallet, unpaginated — for select inputs, which must never hide an
 * option behind a page boundary.
 */
export function useWalletOptionsQuery() {
  return useQuery(api().wallet.options.queryOptions());
}

/**
 * Invalidation follows the join, not the module: the ledger names the wallet a row sits
 * in and a card names the wallet that pays it, so a rename has to reach both — and
 * balances are derived, so an opening balance or an archive flag moves every total.
 *
 * A function rather than a constant because it reads the runtime, which an app installs
 * before it renders.
 */
function walletInvalidations() {
  const trpc = api();

  return [
    trpc.wallet.getAll.queryFilter(),
    // The select inputs read from `options`, not the paged list.
    trpc.wallet.options.queryFilter(),
    trpc.transaction.summary.queryFilter(),
    trpc.transaction.getAll.queryFilter(),
    trpc.creditCard.getAll.queryFilter(),
    trpc.dashboard.getSummary.queryFilter(),
  ];
}

export function useCreateWalletMutation() {
  return useApiMutation<unknown, WalletFormDto>({
    mutationFn: api().wallet.create.mutationOptions().mutationFn,
    successMessage: t("wallet.toast.created"),
    invalidateQueries: walletInvalidations(),
  });
}

export function useUpdateWalletMutation() {
  return useApiMutation<unknown, WalletFormDto & { id: string }>({
    mutationFn: api().wallet.update.mutationOptions().mutationFn,
    successMessage: t("wallet.toast.updated"),
    invalidateQueries: walletInvalidations(),
  });
}

export function useArchiveWalletMutation() {
  return useApiMutation<unknown, DeleteWalletDto>({
    mutationFn: api().wallet.archive.mutationOptions().mutationFn,
    successMessage: t("wallet.toast.archived"),
    invalidateQueries: walletInvalidations(),
  });
}

export function useUnarchiveWalletMutation() {
  return useApiMutation<unknown, DeleteWalletDto>({
    mutationFn: api().wallet.unarchive.mutationOptions().mutationFn,
    successMessage: t("wallet.toast.restored"),
    invalidateQueries: walletInvalidations(),
  });
}

export function useDeleteWalletMutation() {
  return useApiMutation<unknown, DeleteWalletDto>({
    mutationFn: api().wallet.delete.mutationOptions().mutationFn,
    successMessage: t("wallet.toast.deleted"),
    invalidateQueries: walletInvalidations(),
  });
}
