import type { CategoryType } from "@budget-manager/schemas";

export type CategoryRow = {
  id: string;
  name: string;
  type: CategoryType;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const CATEGORY_TYPE_FILTER_ALL = "all";

export type CategoryTypeFilterValue =
  | CategoryType
  | typeof CATEGORY_TYPE_FILTER_ALL;
