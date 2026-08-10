import { Locale } from "@budget-manager/i18n";
import {
  CategoryType,
  defaultCategoriesForLocale,
} from "@budget-manager/schemas";
import { beforeAll, describe, expect, test } from "bun:test";

import { signUpClient, type ApiClient } from "../support/api";
import { requireServer } from "../support/env";
import { category, listCategories } from "../support/fixtures";

const ENGLISH = defaultCategoriesForLocale(Locale.EN);
const PORTUGUESE = defaultCategoriesForLocale(Locale.PT_BR);

const key = (c: { type: string; name: string }) => `${c.type}:${c.name}`;

beforeAll(async () => {
  await requireServer();
});

async function rawClient(): Promise<ApiClient> {
  return (await signUpClient({ onboarded: false })).client;
}

describe("onboarding defaults", () => {
  test("sign-up alone creates no categories any more", async () => {
    const api = await rawClient();

    expect(await listCategories(api, {})).toEqual([]);
  });

  test("ensureDefaults writes the set in the language it is given", async () => {
    const api = await rawClient();

    const result = await api.category.ensureDefaults.mutate({
      locale: Locale.PT_BR,
    });

    expect(result).toEqual({ created: PORTUGUESE.length, renamed: 0 });

    const rows = await listCategories(api, {});

    expect(new Set(rows.map(key))).toEqual(new Set(PORTUGUESE.map(key)));
  });

  test("re-saving the same locale creates nothing", async () => {
    const api = await rawClient();

    await api.category.ensureDefaults.mutate({ locale: Locale.EN });
    const again = await api.category.ensureDefaults.mutate({
      locale: Locale.EN,
    });

    expect(again).toEqual({ created: 0, renamed: 0 });
    expect((await listCategories(api, {})).length).toBe(ENGLISH.length);
  });

  test("re-saving another locale renames an untouched set instead of doubling it", async () => {
    const api = await rawClient();

    await api.category.ensureDefaults.mutate({ locale: Locale.EN });
    const result = await api.category.ensureDefaults.mutate({
      locale: Locale.PT_BR,
    });

    expect(result.created).toBe(0);
    expect(result.renamed).toBeGreaterThan(0);

    const rows = await listCategories(api, {});

    expect(new Set(rows.map(key))).toEqual(new Set(PORTUGUESE.map(key)));
  });

  test("a set the user has edited is never touched again", async () => {
    const api = await rawClient();

    await api.category.ensureDefaults.mutate({ locale: Locale.EN });

    const groceries = (await listCategories(api, {})).find(
      (row) => row.name === "Groceries",
    );

    if (!groceries) throw new Error("Groceries default missing");

    await api.category.update.mutate({
      id: groceries.id,
      name: "Food",
      type: CategoryType.EXPENSE,
      color: groceries.color,
    });

    const result = await api.category.ensureDefaults.mutate({
      locale: Locale.PT_BR,
    });

    expect(result).toEqual({ created: 0, renamed: 0 });

    const names = (await listCategories(api, {})).map((row) => row.name);

    expect(names).toContain("Food");
    expect(names).not.toContain("Mercado");
  });

  test("an account that already made a category of its own gets no defaults", async () => {
    const api = await rawClient();

    await api.category.create.mutate(
      category({ name: "Só a minha", type: CategoryType.EXPENSE }),
    );

    const result = await api.category.ensureDefaults.mutate({
      locale: Locale.PT_BR,
    });

    expect(result).toEqual({ created: 0, renamed: 0 });
    expect((await listCategories(api, {})).length).toBe(1);
  });
});
