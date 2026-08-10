import { describe, expect, test } from "bun:test";

import { Locale, LOCALES } from "@budget-manager/i18n";

import { CATEGORY_COLORS } from "./category-color";
import { CategorySchema, CategoryType } from "./category.schema";
import {
  DEFAULT_CATEGORIES,
  defaultCategoriesForLocale,
  defaultCategoryRenames,
  missingDefaultCategories,
} from "./default-categories";

const NAME_SCHEMA = CategorySchema.shape.name;

describe("defaultCategoriesForLocale", () => {
  for (const locale of LOCALES) {
    describe(locale, () => {
      const categories = defaultCategoriesForLocale(locale);

      test("covers both types", () => {
        const types = new Set(categories.map((c) => c.type));

        expect(types).toEqual(
          new Set([CategoryType.INCOME, CategoryType.EXPENSE]),
        );
      });

      test("has no duplicate name within a type", () => {
        const keys = categories.map((c) => `${c.type}:${c.name.toLowerCase()}`);

        expect(new Set(keys).size).toBe(categories.length);
      });

      test("every name passes the shared category name validator", () => {
        for (const category of categories) {
          expect(NAME_SCHEMA.safeParse(category.name).success).toBe(true);
        }
      });

      test("every default carries a colour from the palette", () => {
        for (const category of categories) {
          expect(CATEGORY_COLORS).toContain(category.color);
        }
      });
    });
  }

  test("every locale lays down the same types and colours, in order", () => {
    const [first, ...rest] = LOCALES.map((locale) =>
      defaultCategoriesForLocale(locale).map((c) => `${c.type}:${c.color}`),
    );

    for (const other of rest) {
      expect(other).toEqual(first ?? []);
    }
  });

  test("DEFAULT_CATEGORIES is the English set", () => {
    expect(DEFAULT_CATEGORIES).toEqual(defaultCategoriesForLocale(Locale.EN));
  });
});

describe("defaultCategoryRenames", () => {
  const english = defaultCategoriesForLocale(Locale.EN);
  const portuguese = defaultCategoriesForLocale(Locale.PT_BR);

  test("maps an untouched English set onto the Portuguese names", () => {
    const renames = defaultCategoryRenames(english, Locale.PT_BR);

    expect(renames.length).toBeGreaterThan(0);
    expect(renames).toContainEqual({
      from: { name: "Groceries", type: CategoryType.EXPENSE },
      toName: "Mercado",
    });
  });

  test("skips entries whose translation is the same word", () => {
    const renames = defaultCategoryRenames(english, Locale.PT_BR);

    expect(
      renames.some((rename) => rename.from.name === rename.toName),
    ).toBe(false);
  });

  test("round-trips: applying the renames yields the target set", () => {
    const renamed = english.map((category) => {
      const rename = defaultCategoryRenames(english, Locale.PT_BR).find(
        (r) => r.from.name === category.name && r.from.type === category.type,
      );

      return { ...category, name: rename?.toName ?? category.name };
    });

    expect(renamed.map((c) => `${c.type}:${c.name}`)).toEqual(
      portuguese.map((c) => `${c.type}:${c.name}`),
    );
  });

  test("returns nothing when the set is already in the target locale", () => {
    expect(defaultCategoryRenames(english, Locale.EN)).toEqual([]);
  });

  test("returns nothing once the user renamed a category", () => {
    const edited = english.map((category, index) =>
      index === 0 ? { ...category, name: "My salary" } : category,
    );

    expect(defaultCategoryRenames(edited, Locale.PT_BR)).toEqual([]);
  });

  test("returns nothing once the user added or removed a category", () => {
    expect(defaultCategoryRenames(english.slice(1), Locale.PT_BR)).toEqual([]);
    expect(
      defaultCategoryRenames(
        [...english, { name: "Extra", type: CategoryType.EXPENSE }],
        Locale.PT_BR,
      ),
    ).toEqual([]);
  });

  test("matches the existing set case-insensitively", () => {
    const shuffledCase = english.map((category) => ({
      ...category,
      name: category.name.toUpperCase(),
    }));

    expect(
      defaultCategoryRenames(shuffledCase, Locale.PT_BR).length,
    ).toBeGreaterThan(0);
  });
});

describe("missingDefaultCategories", () => {
  test("returns the full set for a user with no categories", () => {
    expect(missingDefaultCategories([])).toEqual([...DEFAULT_CATEGORIES]);
  });

  test("returns nothing when every default already exists", () => {
    expect(missingDefaultCategories(DEFAULT_CATEGORIES)).toEqual([]);
  });

  test("matches case-insensitively and ignores surrounding whitespace", () => {
    const result = missingDefaultCategories([
      { name: "  salary ", type: CategoryType.INCOME },
    ]);

    expect(
      result.some((c) => c.name === "Salary" && c.type === CategoryType.INCOME),
    ).toBe(false);
  });

  test("treats the same name under the other type as a different category", () => {
    const result = missingDefaultCategories([
      { name: "Salary", type: CategoryType.EXPENSE },
    ]);

    expect(
      result.some((c) => c.name === "Salary" && c.type === CategoryType.INCOME),
    ).toBe(true);
  });
});
