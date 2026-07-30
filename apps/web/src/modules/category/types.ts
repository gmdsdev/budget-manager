import { FILTER_ALL, type CategoryType } from "@budget-manager/schemas";

export type CategoryRow = {
  id: string;
  name: string;
  type: CategoryType;
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
