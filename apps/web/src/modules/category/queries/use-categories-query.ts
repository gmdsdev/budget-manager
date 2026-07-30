import { PAGE_SIZE, toOffset } from "@/lib/pagination";
import { trpc } from "@/utils/trpc";
import type { CategoryType } from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";
import {
  CATEGORY_TYPE_FILTER_ALL,
  type CategoryFiltersState,
  type CategoryRow,
} from "../types";

type CategoriesQueryInput = {
  search?: string;
  type?: CategoryType;
  limit: number;
  offset: number;
};

export function categoriesQueryInput(
  filters?: CategoryFiltersState,
  page = 1,
): CategoriesQueryInput {
  const input: CategoriesQueryInput = {
    limit: PAGE_SIZE,
    offset: toOffset(page),
  };

  if (!filters) {
    return input;
  }

  if (filters.search) {
    input.search = filters.search;
  }

  if (filters.type !== CATEGORY_TYPE_FILTER_ALL) {
    input.type = filters.type;
  }

  return input;
}

export function useCategoriesQuery(filters?: CategoryFiltersState, page = 1) {
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
