import { CategoryColor } from "./category-color";
import { CategoryType } from "./category.schema";

export type DefaultCategory = {
  name: string;
  type: CategoryType;
  color: CategoryColor;
};

/** Everything `categoryKey` needs: a colour never decides which row is which. */
type CategoryIdentity = Pick<DefaultCategory, "name" | "type">;

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", color: CategoryColor.GREEN },
  { name: "Bonus", color: CategoryColor.LIME },
  { name: "Freelance", color: CategoryColor.TEAL },
  { name: "Investments", color: CategoryColor.CYAN },
  { name: "Rental Income", color: CategoryColor.BLUE },
  { name: "Gifts", color: CategoryColor.PINK },
  { name: "Refunds", color: CategoryColor.VIOLET },
  { name: "Other Income", color: CategoryColor.SLATE },
] as const;

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Groceries", color: CategoryColor.GREEN },
  { name: "Rent", color: CategoryColor.BLUE },
  { name: "Utilities", color: CategoryColor.CYAN },
  { name: "Internet & Phone", color: CategoryColor.TEAL },
  { name: "Transportation", color: CategoryColor.VIOLET },
  { name: "Fuel", color: CategoryColor.ORANGE },
  { name: "Dining Out", color: CategoryColor.RED },
  { name: "Health", color: CategoryColor.PINK },
  { name: "Insurance", color: CategoryColor.SLATE },
  { name: "Education", color: CategoryColor.PURPLE },
  { name: "Entertainment", color: CategoryColor.YELLOW },
  { name: "Subscriptions", color: CategoryColor.LIME },
  { name: "Shopping", color: CategoryColor.PINK },
  { name: "Personal Care", color: CategoryColor.PURPLE },
  { name: "Home", color: CategoryColor.BLUE },
  { name: "Pets", color: CategoryColor.LIME },
  { name: "Travel", color: CategoryColor.CYAN },
  { name: "Taxes", color: CategoryColor.SLATE },
  { name: "Fees & Interest", color: CategoryColor.RED },
  { name: "Other Expenses", color: CategoryColor.SLATE },
] as const;

export const DEFAULT_INCOME_CATEGORY_NAMES = DEFAULT_INCOME_CATEGORIES.map(
  (category) => category.name,
);

export const DEFAULT_EXPENSE_CATEGORY_NAMES = DEFAULT_EXPENSE_CATEGORIES.map(
  (category) => category.name,
);

export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  ...DEFAULT_INCOME_CATEGORIES.map((category) => ({
    ...category,
    type: CategoryType.INCOME,
  })),
  ...DEFAULT_EXPENSE_CATEGORIES.map((category) => ({
    ...category,
    type: CategoryType.EXPENSE,
  })),
];

function categoryKey({ name, type }: CategoryIdentity) {
  return `${type}:${name.trim().toLowerCase()}`;
}

/**
 * Seeding must be safe to re-run and must never rename or resurrect a category
 * the user already has — archived rows count as existing.
 */
export function missingDefaultCategories(
  existing: readonly CategoryIdentity[],
): DefaultCategory[] {
  const taken = new Set(existing.map(categoryKey));

  return DEFAULT_CATEGORIES.filter(
    (category) => !taken.has(categoryKey(category)),
  );
}
