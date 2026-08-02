import { t } from "@budget-manager/i18n";
import type {
  CategoryFormDto,
  CategoryType,
  DeleteCategoryDto,
} from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";

import {
  categoriesQueryInput,
  type CategoryFiltersState,
  type CategoryRow,
} from "../category";
import { api } from "../runtime";
import { useApiMutation } from "../use-api-mutation";

export function useCategoriesQuery(filters?: CategoryFiltersState, page = 1) {
  const trpc = api();

  return useQuery({
    ...trpc.category.getAll.queryOptions(categoriesQueryInput(filters, page)),
    select: (data) => ({
      total: data.total,
      rows: data.rows.map(
        (row): CategoryRow => ({
          ...row,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        }),
      ),
    }),
  });
}

/**
 * Every non-archived category, unpaginated — for select inputs, which must never hide
 * an option behind a page boundary.
 */
export function useCategoryOptionsQuery(type?: CategoryType) {
  return useQuery(api().category.options.queryOptions(type ? { type } : {}));
}

/**
 * A category's name and colour are joined into every list that shows a row's category,
 * so renaming or recolouring one has to reach them too — otherwise the ledger and the
 * budget screen keep painting the old label.
 */
function categoryInvalidations() {
  const trpc = api();

  return [
    trpc.category.getAll.queryFilter(),
    trpc.category.options.queryFilter(),
    trpc.transaction.getAll.queryFilter(),
    trpc.budget.getAll.queryFilter(),
    trpc.budget.getMonth.queryFilter(),
    trpc.budget.periods.queryFilter(),
    trpc.dashboard.getSummary.queryFilter(),
  ];
}

export function useCreateCategoryMutation() {
  return useApiMutation<unknown, CategoryFormDto>({
    mutationFn: api().category.create.mutationOptions().mutationFn,
    successMessage: t("category.toast.created"),
    invalidateQueries: categoryInvalidations(),
  });
}

export function useUpdateCategoryMutation() {
  return useApiMutation<unknown, CategoryFormDto & { id: string }>({
    mutationFn: api().category.update.mutationOptions().mutationFn,
    successMessage: t("category.toast.updated"),
    invalidateQueries: categoryInvalidations(),
  });
}

export function useArchiveCategoryMutation() {
  return useApiMutation<unknown, DeleteCategoryDto>({
    mutationFn: api().category.archive.mutationOptions().mutationFn,
    successMessage: t("category.toast.archived"),
    invalidateQueries: categoryInvalidations(),
  });
}

export function useUnarchiveCategoryMutation() {
  return useApiMutation<unknown, DeleteCategoryDto>({
    mutationFn: api().category.unarchive.mutationOptions().mutationFn,
    successMessage: t("category.toast.restored"),
    invalidateQueries: categoryInvalidations(),
  });
}

export function useDeleteCategoryMutation() {
  return useApiMutation<unknown, DeleteCategoryDto>({
    mutationFn: api().category.delete.mutationOptions().mutationFn,
    successMessage: t("category.toast.deleted"),
    invalidateQueries: categoryInvalidations(),
  });
}
