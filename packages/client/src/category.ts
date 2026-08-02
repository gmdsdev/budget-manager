import {
  type CategoryColor,
  FILTER_ALL,
  type CategoryType,
} from "@budget-manager/schemas";

import { PAGE_SIZE, toOffset } from "./pagination";

export type CategoryRow = {
  id: string;
  name: string;
  type: CategoryType;
  color: CategoryColor;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const CATEGORY_TYPE_FILTER_ALL = FILTER_ALL;

export type CategoryTypeFilterValue =
  | CategoryType
  | typeof CATEGORY_TYPE_FILTER_ALL;

export type CategoryFiltersState = {
  search: string;
  type: CategoryTypeFilterValue;
};

export const EMPTY_CATEGORY_FILTERS: CategoryFiltersState = {
  search: "",
  type: CATEGORY_TYPE_FILTER_ALL,
};

export function isCategoryFiltered(filters: CategoryFiltersState) {
  return filters.search !== "" || filters.type !== CATEGORY_TYPE_FILTER_ALL;
}

/** The minimal row a picker reads. Never sourced from the paged list. */
export type CategoryOption = {
  id: string;
  name: string;
  type: CategoryType;
  color: CategoryColor;
};

export type CategoriesQueryInput = {
  search?: string;
  type?: CategoryType;
  limit: number;
  offset: number;
};

/**
 * The sentinel values are dropped here and nowhere else. Called with no arguments
 * by a route loader, so it has to work bare.
 */
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
