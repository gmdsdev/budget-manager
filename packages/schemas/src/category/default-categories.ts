import { DEFAULT_LOCALE, type Locale, LOCALES } from "@budget-manager/i18n";

import { CategoryColor } from "./category-color";
import { CategoryType } from "./category.schema";

export type DefaultCategory = {
  name: string;
  type: CategoryType;
  color: CategoryColor;
};

/** Everything `categoryKey` needs: a colour never decides which row is which. */
type CategoryIdentity = Pick<DefaultCategory, "name" | "type">;

/**
 * Category names are data, not copy — per-user rows written once, in the
 * language the user picked during onboarding, and renameable ever after. They
 * live here rather than in the i18n catalog because nothing ever re-translates
 * them; the side-by-side locales make a missing translation a compile error,
 * the same bargain the catalog makes.
 */
type DefaultCategoryDefinition = {
  name: Record<Locale, string>;
  color: CategoryColor;
};

const DEFAULT_INCOME_DEFINITIONS = [
  { name: { en: "Salary", "pt-BR": "Salário" }, color: CategoryColor.GREEN },
  { name: { en: "Bonus", "pt-BR": "Bônus" }, color: CategoryColor.LIME },
  { name: { en: "Freelance", "pt-BR": "Freelance" }, color: CategoryColor.TEAL },
  {
    name: { en: "Investments", "pt-BR": "Investimentos" },
    color: CategoryColor.CYAN,
  },
  {
    name: { en: "Rental Income", "pt-BR": "Aluguéis" },
    color: CategoryColor.BLUE,
  },
  { name: { en: "Gifts", "pt-BR": "Presentes" }, color: CategoryColor.PINK },
  {
    name: { en: "Refunds", "pt-BR": "Reembolsos" },
    color: CategoryColor.VIOLET,
  },
  {
    name: { en: "Other Income", "pt-BR": "Outras receitas" },
    color: CategoryColor.SLATE,
  },
] as const satisfies readonly DefaultCategoryDefinition[];

const DEFAULT_EXPENSE_DEFINITIONS = [
  { name: { en: "Groceries", "pt-BR": "Mercado" }, color: CategoryColor.GREEN },
  { name: { en: "Rent", "pt-BR": "Aluguel" }, color: CategoryColor.BLUE },
  {
    name: { en: "Utilities", "pt-BR": "Contas de casa" },
    color: CategoryColor.CYAN,
  },
  {
    name: { en: "Internet & Phone", "pt-BR": "Internet e telefone" },
    color: CategoryColor.TEAL,
  },
  {
    name: { en: "Transportation", "pt-BR": "Transporte" },
    color: CategoryColor.VIOLET,
  },
  { name: { en: "Fuel", "pt-BR": "Combustível" }, color: CategoryColor.ORANGE },
  {
    name: { en: "Dining Out", "pt-BR": "Restaurantes" },
    color: CategoryColor.RED,
  },
  { name: { en: "Health", "pt-BR": "Saúde" }, color: CategoryColor.PINK },
  { name: { en: "Insurance", "pt-BR": "Seguros" }, color: CategoryColor.SLATE },
  {
    name: { en: "Education", "pt-BR": "Educação" },
    color: CategoryColor.PURPLE,
  },
  {
    name: { en: "Entertainment", "pt-BR": "Lazer" },
    color: CategoryColor.YELLOW,
  },
  {
    name: { en: "Subscriptions", "pt-BR": "Assinaturas" },
    color: CategoryColor.LIME,
  },
  { name: { en: "Shopping", "pt-BR": "Compras" }, color: CategoryColor.PINK },
  {
    name: { en: "Personal Care", "pt-BR": "Cuidados pessoais" },
    color: CategoryColor.PURPLE,
  },
  { name: { en: "Home", "pt-BR": "Casa" }, color: CategoryColor.BLUE },
  { name: { en: "Pets", "pt-BR": "Pets" }, color: CategoryColor.LIME },
  { name: { en: "Travel", "pt-BR": "Viagens" }, color: CategoryColor.CYAN },
  { name: { en: "Taxes", "pt-BR": "Impostos" }, color: CategoryColor.SLATE },
  {
    name: { en: "Fees & Interest", "pt-BR": "Tarifas e juros" },
    color: CategoryColor.RED,
  },
  {
    name: { en: "Other Expenses", "pt-BR": "Outras despesas" },
    color: CategoryColor.SLATE,
  },
] as const satisfies readonly DefaultCategoryDefinition[];

export const DEFAULT_INCOME_CATEGORY_NAMES = DEFAULT_INCOME_DEFINITIONS.map(
  (definition) => definition.name[DEFAULT_LOCALE],
);

export const DEFAULT_EXPENSE_CATEGORY_NAMES = DEFAULT_EXPENSE_DEFINITIONS.map(
  (definition) => definition.name[DEFAULT_LOCALE],
);

const DEFAULT_DEFINITIONS: readonly (DefaultCategoryDefinition & {
  type: CategoryType;
})[] = [
  ...DEFAULT_INCOME_DEFINITIONS.map((definition) => ({
    ...definition,
    type: CategoryType.INCOME,
  })),
  ...DEFAULT_EXPENSE_DEFINITIONS.map((definition) => ({
    ...definition,
    type: CategoryType.EXPENSE,
  })),
];

export function defaultCategoriesForLocale(locale: Locale): DefaultCategory[] {
  return DEFAULT_DEFINITIONS.map((definition) => ({
    name: definition.name[locale],
    type: definition.type,
    color: definition.color,
  }));
}

/**
 * The English set, which is what every account predating the localized
 * onboarding was seeded with — and what the e2e suites count against.
 */
export const DEFAULT_CATEGORIES: readonly DefaultCategory[] =
  defaultCategoriesForLocale(DEFAULT_LOCALE);

function categoryKey({ name, type }: CategoryIdentity) {
  return `${type}:${name.trim().toLowerCase()}`;
}

/**
 * Seeding must be safe to re-run and must never rename or resurrect a category
 * the user already has — archived rows count as existing.
 */
export function missingDefaultCategories(
  existing: readonly CategoryIdentity[],
  locale: Locale = DEFAULT_LOCALE,
): DefaultCategory[] {
  const taken = new Set(existing.map(categoryKey));

  return defaultCategoriesForLocale(locale).filter(
    (category) => !taken.has(categoryKey(category)),
  );
}

export type DefaultCategoryRename = {
  from: CategoryIdentity;
  toName: string;
};

/**
 * Re-saving the onboarding language must not blend two languages' defaults into
 * one account, so instead of inserting a second set this maps the first one
 * over: when the existing categories are *exactly* an untouched default set of
 * some other locale, every row is paired with its translation (the definitions
 * are one list, so pairing is by position). One rename, one extra category or
 * one deletion by the user and the set is theirs — nothing is returned, because
 * renaming under an edited set would overwrite choices already made.
 */
export function defaultCategoryRenames(
  existing: readonly CategoryIdentity[],
  locale: Locale,
): DefaultCategoryRename[] {
  if (existing.length !== DEFAULT_DEFINITIONS.length) {
    return [];
  }

  const existingKeys = new Set(existing.map(categoryKey));

  for (const sourceLocale of LOCALES) {
    if (sourceLocale === locale) {
      continue;
    }

    const source = defaultCategoriesForLocale(sourceLocale);

    if (!source.every((category) => existingKeys.has(categoryKey(category)))) {
      continue;
    }

    const target = defaultCategoriesForLocale(locale);

    return source.flatMap((category, index) => {
      const toName = target[index]?.name;

      return toName === undefined || toName === category.name
        ? []
        : [{ from: { name: category.name, type: category.type }, toName }];
    });
  }

  return [];
}
