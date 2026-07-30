import { trpc } from "@/utils/trpc";
import type { CategoryColor, CategoryType } from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";

export type CategoryOption = {
  id: string;
  name: string;
  type: CategoryType;
  color: CategoryColor;
};

/**
 * Every non-archived category, unpaginated — for select inputs, which must never
 * hide an option behind a page boundary.
 */
export function useCategoryOptionsQuery(type?: CategoryType) {
  return useQuery(
    trpc.category.options.queryOptions(type ? { type } : {}),
  );
}
