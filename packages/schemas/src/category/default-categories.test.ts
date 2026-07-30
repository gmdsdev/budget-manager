import { describe, expect, test } from "bun:test";

import { CATEGORY_COLORS } from "./category-color";
import { CategorySchema, CategoryType } from "./category.schema";
import {
  DEFAULT_CATEGORIES,
  missingDefaultCategories,
} from "./default-categories";

const NAME_SCHEMA = CategorySchema.shape.name;

describe("DEFAULT_CATEGORIES", () => {
  test("covers both types", () => {
    const types = new Set(DEFAULT_CATEGORIES.map((c) => c.type));

    expect(types).toEqual(new Set([CategoryType.INCOME, CategoryType.EXPENSE]));
  });

  test("has no duplicate name within a type", () => {
    const keys = DEFAULT_CATEGORIES.map((c) => `${c.type}:${c.name}`);

    expect(new Set(keys).size).toBe(DEFAULT_CATEGORIES.length);
  });

  test("every name passes the shared category name validator", () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(NAME_SCHEMA.safeParse(category.name).success).toBe(true);
    }
  });

  test("every default carries a colour from the palette", () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(CATEGORY_COLORS).toContain(category.color);
    }
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
