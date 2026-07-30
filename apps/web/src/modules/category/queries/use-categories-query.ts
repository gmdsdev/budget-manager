import { PAGE_SIZE, toOffset } from "@/lib/pagination";
import { trpc } from "@/utils/trpc";
import type { CategoryType } from "@budget-manager/schemas";
import { useQuery } from "@tanstack/react-query";
import type { CategoryRow } from "../types";

export function categoriesQueryInput({
  type,
  page = 1,
}: { type?: CategoryType; page?: number } = {}) {
  return {
    ...(type ? { type } : {}),
    limit: PAGE_SIZE,
    offset: toOffset(page),
  };
}

export function useCategoriesQuery({
  type,
  page = 1,
}: { type?: CategoryType; page?: number } = {}) {
  return useQuery({
    ...trpc.category.getAll.queryOptions(categoriesQueryInput({ type, page })),
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
