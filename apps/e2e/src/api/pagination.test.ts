import {
  CategoryType,
  DEFAULT_CATEGORIES,
  DEFAULT_INCOME_CATEGORY_NAMES,
  TransactionStatus,
} from "@budget-manager/schemas";
import { beforeAll, describe, expect, test } from "bun:test";

import { errorCodeOf, signUpClient, type ApiClient } from "../support/api";
import { requireServer } from "../support/env";
import { category, transaction, wallet } from "../support/fixtures";

const TOTAL = 7;

let api: ApiClient;
let walletId: string;

beforeAll(async () => {
  await requireServer();
  api = (await signUpClient()).client;

  const created = await api.wallet.create.mutate(wallet({ name: "Paged" }));
  walletId = created.id;

  // Distinct dates so the ordering is deterministic and pages cannot overlap.
  for (let index = 0; index < TOTAL; index++) {
    await api.transaction.create.mutate(
      transaction(walletId, {
        name: `Row ${index}`,
        amountCents: (index + 1) * 100,
        occurrenceDate: `2026-06-${`${index + 1}`.padStart(2, "0")}`,
      }),
    );
  }
});

describe("paginated list envelope", () => {
  test("echoes the limit and offset it applied", async () => {
    const page = await api.transaction.getAll.query({ limit: 3, offset: 3 });

    expect(page.limit).toBe(3);
    expect(page.offset).toBe(3);
  });

  test("total counts every match, not just the page", async () => {
    const page = await api.transaction.getAll.query({ limit: 2, offset: 0 });

    expect(page.rows.length).toBe(2);
    expect(page.total).toBe(TOTAL);
  });

  test("pages tile the whole set without gaps or repeats", async () => {
    const size = 3;
    const seen: string[] = [];

    for (let offset = 0; offset < TOTAL; offset += size) {
      const page = await api.transaction.getAll.query({ limit: size, offset });

      seen.push(...page.rows.map((row) => row.id));
    }

    expect(seen.length).toBe(TOTAL);
    expect(new Set(seen).size).toBe(TOTAL);
  });

  test("an offset past the end returns no rows but still reports the total", async () => {
    const page = await api.transaction.getAll.query({
      limit: 20,
      offset: 500,
    });

    expect(page.rows).toEqual([]);
    expect(page.total).toBe(TOTAL);
  });

  test("total respects the filters, so page counts stay honest", async () => {
    await api.transaction.create.mutate(
      transaction(walletId, {
        name: "Pending one",
        occurrenceDate: "2026-06-20",
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    );

    const filtered = await api.transaction.getAll.query({
      status: TransactionStatus.WAITING_PAYMENT,
      limit: 20,
      offset: 0,
    });

    expect(filtered.total).toBe(1);
    expect(filtered.rows.length).toBe(1);

    const unfiltered = await api.transaction.getAll.query({
      limit: 20,
      offset: 0,
    });

    expect(unfiltered.total).toBe(TOTAL + 1);
  });

  test("rejects a limit outside the allowed range", async () => {
    expect(await errorCodeOf(api.transaction.getAll.query({ limit: 0 }))).toBe(
      "BAD_REQUEST",
    );
    expect(
      await errorCodeOf(api.transaction.getAll.query({ limit: 101 })),
    ).toBe("BAD_REQUEST");
    expect(
      await errorCodeOf(api.transaction.getAll.query({ offset: -1 })),
    ).toBe("BAD_REQUEST");
  });

  test("wallets and categories paginate the same way", async () => {
    const client = (await signUpClient()).client;

    for (let index = 0; index < 3; index++) {
      await client.wallet.create.mutate(wallet({ name: `W${index}` }));
      await client.category.create.mutate(category({
        name: `C${index}`,
        type: CategoryType.EXPENSE,
      }));
    }

    const walletPage = await client.wallet.getAll.query({
      limit: 2,
      offset: 0,
    });
    expect(walletPage.rows.length).toBe(2);
    expect(walletPage.total).toBe(3);

    // Sign-up seeds the default categories, so the three created here land at
    // the end of the list.
    const categoryTotal = DEFAULT_CATEGORIES.length + 3;
    const categoryPage = await client.category.getAll.query({
      limit: 2,
      offset: categoryTotal - 1,
    });
    expect(categoryPage.rows.length).toBe(1);
    expect(categoryPage.total).toBe(categoryTotal);
  });

  test("wallet balances stay whole-account, not page-scoped", async () => {
    // The balance aggregate must not be limited by the page window.
    const page = await api.wallet.getAll.query({ limit: 1, offset: 0 });
    const row = page.rows[0];

    expect(row?.balanceCents).toBe(100_000 - 2_800);
  });
});

describe("option lists are never paginated", () => {
  test("returns every wallet, past any page size", async () => {
    const client = (await signUpClient()).client;

    for (let index = 0; index < 25; index++) {
      await client.wallet.create.mutate(wallet({ name: `Wallet ${index}` }));
    }

    const options = await client.wallet.options.query();
    const paged = await client.wallet.getAll.query({ limit: 20, offset: 0 });

    // 25 > the 20-row page: the select must still offer all of them.
    expect(options.length).toBe(25);
    expect(paged.rows.length).toBe(20);
    expect(paged.total).toBe(25);
  });

  test("returns every category and can still narrow by type", async () => {
    const client = (await signUpClient()).client;

    for (let index = 0; index < 22; index++) {
      await client.category.create.mutate(category({
        name: `Expense ${index}`,
        type: CategoryType.EXPENSE,
      }));
    }
    await client.category.create.mutate(category({
      name: "Wages",
      type: CategoryType.INCOME,
    }));

    expect((await client.category.options.query({})).length).toBe(
      DEFAULT_CATEGORIES.length + 23,
    );
    expect(
      (await client.category.options.query({ type: CategoryType.INCOME }))
        .length,
    ).toBe(DEFAULT_INCOME_CATEGORY_NAMES.length + 1);
  });

  test("omits archived rows so they cannot be assigned to new records", async () => {
    const client = (await signUpClient()).client;
    const created = await client.wallet.create.mutate(
      wallet({ name: "Retired" }),
    );

    await client.wallet.archive.mutate({ id: created.id });

    expect(await client.wallet.options.query()).toEqual([]);
  });

  test("requires authentication", async () => {
    const { anonymousClient } = await import("../support/api");

    expect(await errorCodeOf(anonymousClient().wallet.options.query())).toBe(
      "UNAUTHORIZED",
    );
    expect(
      await errorCodeOf(anonymousClient().category.options.query({})),
    ).toBe("UNAUTHORIZED");
  });
});
