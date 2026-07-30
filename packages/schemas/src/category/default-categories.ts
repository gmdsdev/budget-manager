import { CategoryType } from "./category.schema";

export type DefaultCategory = {
  name: string;
  type: CategoryType;
};

export const DEFAULT_INCOME_CATEGORY_NAMES = [
  "Salary",
  "Bonus",
  "Freelance",
  "Investments",
  "Rental Income",
  "Gifts",
  "Refunds",
  "Other Income",
] as const;

export const DEFAULT_EXPENSE_CATEGORY_NAMES = [
  "Groceries",
  "Rent",
  "Utilities",
  "Internet & Phone",
  "Transportation",
  "Fuel",
  "Dining Out",
  "Health",
  "Insurance",
  "Education",
  "Entertainment",
  "Subscriptions",
  "Shopping",
  "Personal Care",
  "Home",
  "Pets",
  "Travel",
  "Taxes",
  "Fees & Interest",
  "Other Expenses",
] as const;

export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  ...DEFAULT_INCOME_CATEGORY_NAMES.map((name) => ({
    name,
    type: CategoryType.INCOME,
  })),
  ...DEFAULT_EXPENSE_CATEGORY_NAMES.map((name) => ({
    name,
    type: CategoryType.EXPENSE,
  })),
];

function categoryKey({ name, type }: DefaultCategory) {
  return `${type}:${name.trim().toLowerCase()}`;
}

/**
 * Seeding must be safe to re-run and must never rename or resurrect a category
 * the user already has — archived rows count as existing.
 */
export function missingDefaultCategories(
  existing: readonly DefaultCategory[],
): DefaultCategory[] {
  const taken = new Set(existing.map(categoryKey));

  return DEFAULT_CATEGORIES.filter(
    (category) => !taken.has(categoryKey(category)),
  );
}
