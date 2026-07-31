import { useApiMutation } from "@/hooks/use-api-mutation";
import { trpc } from "@/utils/trpc";
import { t } from "@budget-manager/i18n";
import type {
  CategoryFormDto,
  DeleteCategoryDto,
} from "@budget-manager/schemas";

const CATEGORY_INVALIDATIONS = [
  trpc.category.getAll.queryFilter(),
  // The select inputs read from `options`, not the paged list.
  trpc.category.options.queryFilter(),
  trpc.dashboard.getSummary.queryFilter(),
];

export function useCreateCategoryMutation() {
  return useApiMutation<unknown, CategoryFormDto>({
    mutationFn: trpc.category.create.mutationOptions().mutationFn,
    successMessage: t("category.toast.created"),
    invalidateQueries: CATEGORY_INVALIDATIONS,
  });
}

export function useUpdateCategoryMutation() {
  return useApiMutation<unknown, CategoryFormDto & { id: string }>({
    mutationFn: trpc.category.update.mutationOptions().mutationFn,
    successMessage: t("category.toast.updated"),
    invalidateQueries: CATEGORY_INVALIDATIONS,
  });
}

export function useArchiveCategoryMutation() {
  return useApiMutation<unknown, DeleteCategoryDto>({
    mutationFn: trpc.category.archive.mutationOptions().mutationFn,
    successMessage: t("category.toast.archived"),
    invalidateQueries: CATEGORY_INVALIDATIONS,
  });
}

export function useUnarchiveCategoryMutation() {
  return useApiMutation<unknown, DeleteCategoryDto>({
    mutationFn: trpc.category.unarchive.mutationOptions().mutationFn,
    successMessage: t("category.toast.restored"),
    invalidateQueries: CATEGORY_INVALIDATIONS,
  });
}

export function useDeleteCategoryMutation() {
  return useApiMutation<unknown, DeleteCategoryDto>({
    mutationFn: trpc.category.delete.mutationOptions().mutationFn,
    successMessage: t("category.toast.deleted"),
    invalidateQueries: CATEGORY_INVALIDATIONS,
  });
}
