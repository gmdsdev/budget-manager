import {
  CATEGORY_COLORS,
  CategoryColor,
  CategoryType,
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_EXPENSE_CATEGORY_NAMES,
  DEFAULT_INCOME_CATEGORY_NAMES,
} from "@budget-manager/schemas";
import { beforeAll, describe, expect, test } from "bun:test";

import { errorCodeOf, signUpClient, type ApiClient } from "../support/api";
import { requireServer } from "../support/env";
import {
  budget,
  category,
  listCategories,
  listTransactions,
  transaction,
  wallet,
} from "../support/fixtures";

let api: ApiClient;

beforeAll(async () => {
  await requireServer();
  api = (await signUpClient()).client;
});

describe("category", () => {
  test("starts with the default set a sign-up creates", async () => {
    const rows = await listCategories(api, {});

    expect(rows.length).toBe(DEFAULT_CATEGORIES.length);
    expect(new Set(rows.map((c) => `${c.type}:${c.name}`))).toEqual(
      new Set(DEFAULT_CATEGORIES.map((c) => `${c.type}:${c.name}`)),
    );
    expect(rows.every((c) => !c.isArchived)).toBe(true);
    expect(new Set(rows.map((c) => `${c.type}:${c.name}:${c.color}`))).toEqual(
      new Set(DEFAULT_CATEGORIES.map((c) => `${c.type}:${c.name}:${c.color}`)),
    );
  });


  test("filters by type", async () => {
    await api.category.create.mutate(category({
      name: "Consulting",
      type: CategoryType.INCOME,
    }));
    await api.category.create.mutate(category({
      name: "Comics",
      type: CategoryType.EXPENSE,
    }));
    await api.category.create.mutate(category({
      name: "Coworking",
      type: CategoryType.EXPENSE,
    }));

    expect((await listCategories(api, {})).length).toBe(
      DEFAULT_CATEGORIES.length + 3,
    );

    const income = await listCategories(api, {
      type: CategoryType.INCOME,
    });
    expect(income.length).toBe(DEFAULT_INCOME_CATEGORY_NAMES.length + 1);
    expect(income.every((c) => c.type === CategoryType.INCOME)).toBe(true);

    const expense = await listCategories(api, {
      type: CategoryType.EXPENSE,
    });
    expect(expense.length).toBe(DEFAULT_EXPENSE_CATEGORY_NAMES.length + 2);
    expect(expense.every((c) => c.type === CategoryType.EXPENSE)).toBe(true);
  });

  test("sorts by name", async () => {
    const names = (await listCategories(api, {})).map((c) => c.name);

    expect(names).toEqual([...names].sort());
  });

  test("renames and switches type", async () => {
    const created = await api.category.create.mutate(category({
      name: "Temp",
      type: CategoryType.EXPENSE,
    }));

    const updated = await api.category.update.mutate({
      ...category({ name: "Renamed", type: CategoryType.INCOME }),
      id: created.id,
    });

    expect(updated.name).toBe("Renamed");
    expect(updated.type).toBe(CategoryType.INCOME);
  });

  test("archive removes it from the default list, unarchive restores it", async () => {
    const created = await api.category.create.mutate(category({
      name: "Seasonal",
      type: CategoryType.EXPENSE,
    }));

    await api.category.archive.mutate({ id: created.id });
    expect(
      (await listCategories(api, {})).some((c) => c.id === created.id),
    ).toBe(false);
    expect(
      (await listCategories(api, { includeArchived: true })).some(
        (c) => c.id === created.id,
      ),
    ).toBe(true);

    await api.category.unarchive.mutate({ id: created.id });
    expect(
      (await listCategories(api, {})).some((c) => c.id === created.id),
    ).toBe(true);
  });

  test("archiving does not filter out its transactions", async () => {
    const holder = await api.wallet.create.mutate(wallet({ name: "Holder" }));
    const archived = await api.category.create.mutate(
      category({ name: "Archived but used", type: CategoryType.EXPENSE }),
    );

    await api.transaction.create.mutate(
      transaction(holder.id, { categoryId: archived.id }),
    );
    await api.category.archive.mutate({ id: archived.id });

    const rows = await listTransactions(api, {
      categoryId: archived.id,
    });

    expect(rows.length).toBe(1);
    expect(rows[0]?.categoryName).toBe("Archived but used");
    expect(rows[0]?.categoryColor).toBe(DEFAULT_CATEGORY_COLOR);
  });

  test("refuses to delete a category in use, allows deleting an unused one", async () => {
    const holder = await api.wallet.create.mutate(wallet({ name: "Owner" }));
    const used = await api.category.create.mutate(category({
      name: "Used",
      type: CategoryType.EXPENSE,
    }));
    const unused = await api.category.create.mutate(category({
      name: "Unused",
      type: CategoryType.EXPENSE,
    }));

    await api.transaction.create.mutate(
      transaction(holder.id, { categoryId: used.id }),
    );

    expect(await errorCodeOf(api.category.delete.mutate({ id: used.id }))).toBe(
      "CONFLICT",
    );

    await api.category.delete.mutate({ id: unused.id });
    expect(
      (await listCategories(api, {})).some((c) => c.id === unused.id),
    ).toBe(false);
  });

  test("round-trips the colour through create and update", async () => {
    const created = await api.category.create.mutate(
      category({ name: "Tinted", color: CategoryColor.PURPLE }),
    );

    expect(created.color).toBe(CategoryColor.PURPLE);

    const updated = await api.category.update.mutate({
      ...category({ name: "Tinted", color: CategoryColor.LIME }),
      id: created.id,
    });

    expect(updated.color).toBe(CategoryColor.LIME);
  });

  test("carries the colour on the option rows a select reads", async () => {
    const options = await api.category.options.query({});

    expect(options.length).toBeGreaterThan(0);
    expect(
      options.every((option) => CATEGORY_COLORS.includes(option.color)),
    ).toBe(true);
  });

  test("counts a budget as a reference, so deleting cannot cascade one away", async () => {
    const budgeted = await api.category.create.mutate(
      category({ name: "Budgeted", type: CategoryType.EXPENSE }),
    );

    await api.budget.create.mutate(budget(budgeted.id));

    expect(
      await errorCodeOf(api.category.delete.mutate({ id: budgeted.id })),
    ).toBe("CONFLICT");

    expect(
      (await api.budget.getAll.query({})).rows.some(
        (row) => row.categoryId === budgeted.id,
      ),
    ).toBe(true);
  });

  test("holds the type once something references the category", async () => {
    const holder = await api.wallet.create.mutate(wallet({ name: "Typed" }));
    const used = await api.category.create.mutate(
      category({ name: "Settled type", type: CategoryType.EXPENSE }),
    );
    const unused = await api.category.create.mutate(
      category({ name: "Free type", type: CategoryType.EXPENSE }),
    );

    await api.transaction.create.mutate(
      transaction(holder.id, { categoryId: used.id }),
    );

    expect(
      await errorCodeOf(
        api.category.update.mutate({
          ...category({ name: "Settled type", type: CategoryType.INCOME }),
          id: used.id,
        }),
      ),
    ).toBe("CONFLICT");

    // Renaming and recolouring stay open — only the type is held.
    const renamed = await api.category.update.mutate({
      ...category({ name: "Still expense", type: CategoryType.EXPENSE }),
      id: used.id,
    });
    expect(renamed.name).toBe("Still expense");

    const flipped = await api.category.update.mutate({
      ...category({ name: "Free type", type: CategoryType.INCOME }),
      id: unused.id,
    });
    expect(flipped.type).toBe(CategoryType.INCOME);
  });

  test("rejects a blank name", async () => {
    expect(
      await errorCodeOf(
        api.category.create.mutate(category({ name: "  ", type: CategoryType.INCOME })),
      ),
    ).toBe("BAD_REQUEST");
  });
});
