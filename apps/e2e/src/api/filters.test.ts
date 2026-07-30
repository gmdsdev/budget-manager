import {
  CategoryType,
  FILTER_NONE,
  RecurrenceType,
  TransactionRepeats,
  WalletCurrency,
  WalletType,
} from "@budget-manager/schemas";
import { beforeAll, describe, expect, test } from "bun:test";

import { signUpClient } from "../support/api";
import { requireServer } from "../support/env";
import {
  card,
  cardPurchase,
  category,
  listCategories,
  listTransactions,
  listWallets,
  recurring,
  seedBasics,
  transaction,
  wallet,
} from "../support/fixtures";

beforeAll(async () => {
  await requireServer();
});

async function freshUser() {
  const client = (await signUpClient()).client;
  const seed = await seedBasics(client);

  return { client, ...seed };
}

function names(rows: { name: string }[]) {
  return rows.map((row) => row.name).sort();
}

describe("category filters", () => {
  test("searches the name column, case-insensitively", async () => {
    const { client } = await freshUser();

    await client.category.create.mutate(category({
      name: "Zebra Consulting",
      type: CategoryType.INCOME,
    }));

    const rows = await listCategories(client, { search: "zebra con" });

    expect(names(rows)).toEqual(["Zebra Consulting"]);
  });

  test("treats an underscore in the term as a literal", async () => {
    const { client } = await freshUser();

    await Promise.all([
      client.category.create.mutate(category({
        name: "Trip_2026",
        type: CategoryType.EXPENSE,
      })),
      client.category.create.mutate(category({
        name: "TripX2026",
        type: CategoryType.EXPENSE,
      })),
    ]);

    expect(names(await listCategories(client, { search: "Trip_2026" }))).toEqual(
      ["Trip_2026"],
    );
  });

  test("treats a percent in the term as a literal", async () => {
    const { client } = await freshUser();

    await Promise.all([
      client.category.create.mutate(category({
        name: "Cashback 5%",
        type: CategoryType.INCOME,
      })),
      client.category.create.mutate(category({
        name: "Cashback 5 percent",
        type: CategoryType.INCOME,
      })),
    ]);

    expect(names(await listCategories(client, { search: "5%" }))).toEqual([
      "Cashback 5%",
    ]);
  });

  test("combines search with type", async () => {
    const { client } = await freshUser();

    await Promise.all([
      client.category.create.mutate(category({
        name: "Zebra Income",
        type: CategoryType.INCOME,
      })),
      client.category.create.mutate(category({
        name: "Zebra Expense",
        type: CategoryType.EXPENSE,
      })),
    ]);

    const rows = await listCategories(client, {
      search: "zebra",
      type: CategoryType.INCOME,
    });

    expect(names(rows)).toEqual(["Zebra Income"]);
  });

  test("keeps total in step with the filtered rows", async () => {
    const { client } = await freshUser();

    await client.category.create.mutate(category({
      name: "Zebra Only",
      type: CategoryType.INCOME,
    }));

    const page = await client.category.getAll.query({ search: "zebra only" });

    expect(page.total).toBe(1);
    expect(page.rows.length).toBe(1);
  });
});

describe("wallet filters", () => {
  test("searches, and narrows by type and currency", async () => {
    const { client } = await freshUser();

    await client.wallet.create.mutate(
      wallet({
        name: "Euro Savings",
        type: WalletType.SAVINGS,
        currencyCode: WalletCurrency.EUR,
      }),
    );

    expect(names(await listWallets(client, { search: "euro" }))).toEqual([
      "Euro Savings",
    ]);

    expect(
      names(await listWallets(client, { currencyCode: WalletCurrency.EUR })),
    ).toEqual(["Euro Savings"]);

    expect(
      names(await listWallets(client, { type: WalletType.SAVINGS })).length,
    ).toBe(2);

    expect(
      names(
        await listWallets(client, {
          type: WalletType.SAVINGS,
          currencyCode: WalletCurrency.BRL,
        }),
      ),
    ).toEqual(["Savings"]);
  });

  test("keeps total in step with the filtered rows", async () => {
    const { client } = await freshUser();

    const page = await client.wallet.getAll.query({
      type: WalletType.CHECKING,
    });

    expect(page.total).toBe(1);
    expect(page.rows.length).toBe(1);
  });
});

describe("credit card filters", () => {
  test("searches, and narrows by currency and billing wallet", async () => {
    const { client, checking } = await freshUser();

    await Promise.all([
      client.creditCard.create.mutate(
        card({ name: "Billed Visa", defaultBillingWalletId: checking.id }),
      ),
      client.creditCard.create.mutate(
        card({ name: "Unbilled Master", defaultBillingWalletId: null }),
      ),
      client.creditCard.create.mutate(
        card({
          name: "Euro Amex",
          currencyCode: WalletCurrency.EUR,
          defaultBillingWalletId: null,
        }),
      ),
    ]);

    const all = await client.creditCard.getAll.query({});
    expect(all.total).toBe(3);

    expect(
      names((await client.creditCard.getAll.query({ search: "amex" })).rows),
    ).toEqual(["Euro Amex"]);

    expect(
      names(
        (
          await client.creditCard.getAll.query({
            currencyCode: WalletCurrency.EUR,
          })
        ).rows,
      ),
    ).toEqual(["Euro Amex"]);

    expect(
      names(
        (
          await client.creditCard.getAll.query({
            defaultBillingWalletId: checking.id,
          })
        ).rows,
      ),
    ).toEqual(["Billed Visa"]);
  });

  test("lists the cards that have no billing wallet", async () => {
    const { client, checking } = await freshUser();

    await Promise.all([
      client.creditCard.create.mutate(
        card({ name: "Billed Visa", defaultBillingWalletId: checking.id }),
      ),
      client.creditCard.create.mutate(
        card({ name: "Unbilled Master", defaultBillingWalletId: null }),
      ),
    ]);

    const page = await client.creditCard.getAll.query({
      defaultBillingWalletId: FILTER_NONE,
    });

    expect(names(page.rows)).toEqual(["Unbilled Master"]);
    expect(page.total).toBe(1);
  });
});

describe("transaction filters", () => {
  test("searches the description column", async () => {
    const { client, checking } = await freshUser();

    await Promise.all([
      client.transaction.create.mutate(
        transaction(checking.id, { name: "Zebra Rent" }),
      ),
      client.transaction.create.mutate(
        transaction(checking.id, { name: "Coffee" }),
      ),
    ]);

    expect(names(await listTransactions(client, { search: "zebra" }))).toEqual([
      "Zebra Rent",
    ]);
  });

  test("filters by the account that owns the row, wallet or card", async () => {
    const { client, checking, savings } = await freshUser();

    const visa = await client.creditCard.create.mutate(card({ name: "Visa" }));

    await Promise.all([
      client.transaction.create.mutate(
        transaction(checking.id, { name: "From checking" }),
      ),
      client.transaction.create.mutate(
        transaction(savings.id, { name: "From savings" }),
      ),
      client.transaction.createCardPurchase.mutate(
        cardPurchase(visa.id, { name: "On the card" }),
      ),
    ]);

    expect(
      names(await listTransactions(client, { walletId: checking.id })),
    ).toEqual(["From checking"]);

    expect(
      names(await listTransactions(client, { creditCardId: visa.id })),
    ).toEqual(["On the card"]);
  });

  test("lists the rows with no category", async () => {
    const { client, checking, groceries } = await freshUser();

    await Promise.all([
      client.transaction.create.mutate(
        transaction(checking.id, { name: "Uncategorized one" }),
      ),
      client.transaction.create.mutate(
        transaction(checking.id, {
          name: "Categorized one",
          categoryId: groceries.id,
        }),
      ),
    ]);

    expect(
      names(await listTransactions(client, { categoryId: FILTER_NONE })),
    ).toEqual(["Uncategorized one"]);

    expect(
      names(await listTransactions(client, { categoryId: groceries.id })),
    ).toEqual(["Categorized one"]);
  });

  test("separates one-off rows from rows a series generated", async () => {
    const { client, checking } = await freshUser();

    await client.transaction.create.mutate(
      transaction(checking.id, { name: "One and only" }),
    );
    await client.recurring.create.mutate(
      recurring({
        name: "Subscription",
        walletId: checking.id,
        recurrenceType: RecurrenceType.MONTHLY,
      }),
    );

    const oneOff = await listTransactions(client, {
      repeats: TransactionRepeats.ONE_OFF,
      limit: 100,
    });
    const series = await listTransactions(client, {
      repeats: TransactionRepeats.RECURRING,
      limit: 100,
    });

    expect(names(oneOff)).toEqual(["One and only"]);
    expect(series.length).toBeGreaterThan(0);
    expect(series.every((row) => row.name === "Subscription")).toBe(true);
    expect(series.every((row) => row.templateId !== null)).toBe(true);
  });

  test("keeps total in step with the filtered rows", async () => {
    const { client, checking } = await freshUser();

    await Promise.all([
      client.transaction.create.mutate(
        transaction(checking.id, { name: "Zebra Rent" }),
      ),
      client.transaction.create.mutate(
        transaction(checking.id, { name: "Coffee" }),
      ),
    ]);

    const page = await client.transaction.getAll.query({ search: "zebra" });

    expect(page.total).toBe(1);
    expect(page.rows.length).toBe(1);
  });
});
