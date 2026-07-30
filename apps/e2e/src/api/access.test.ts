import {
  CategoryType,
  WalletCurrency,
  WalletType,
} from "@budget-manager/schemas";
import { beforeAll, describe, expect, test } from "bun:test";

import {
  anonymousClient,
  errorCodeOf,
  signUpClient,
  type ApiClient,
} from "../support/api";
import { requireServer } from "../support/env";
import {
  category,
  listCategories,
  listTransactions,
  listWallets,
  seedBasics,
  transaction,
  wallet,
} from "../support/fixtures";

let owner: ApiClient;
let intruder: ApiClient;
let seed: Awaited<ReturnType<typeof seedBasics>>;
let ownedTransactionId: string;

beforeAll(async () => {
  await requireServer();

  owner = (await signUpClient()).client;
  intruder = (await signUpClient()).client;
  seed = await seedBasics(owner);

  const created = await owner.transaction.create.mutate(
    transaction(seed.checking.id, { categoryId: seed.groceries.id }),
  );

  ownedTransactionId = created.id;
});

describe("tenant isolation", () => {
  test("a different user sees none of the owner's rows", async () => {
    expect(await listWallets(intruder, {})).toEqual([]);
    expect(await listTransactions(intruder, {})).toEqual([]);

    const ownerCategoryIds = new Set(
      (await listCategories(owner, {})).map((category) => category.id),
    );
    const intruderCategoryIds = (await listCategories(intruder, {})).map(
      (category) => category.id,
    );

    expect(intruderCategoryIds.length).toBeGreaterThan(0);
    expect(
      intruderCategoryIds.some((id) => ownerCategoryIds.has(id)),
    ).toBe(false);
  });

  test("cannot read the owner's rows even by id", async () => {
    expect(
      await errorCodeOf(
        intruder.transaction.markPaid.mutate({ id: ownedTransactionId }),
      ),
    ).toBe("NOT_FOUND");
  });

  test("cannot mutate the owner's wallet", async () => {
    expect(
      await errorCodeOf(
        intruder.wallet.update.mutate({
          id: seed.checking.id,
          name: "Stolen",
          type: WalletType.CHECKING,
          currencyCode: WalletCurrency.BRL,
          openingBalanceCents: 0,
        }),
      ),
    ).toBe("NOT_FOUND");

    expect(
      await errorCodeOf(
        intruder.wallet.archive.mutate({ id: seed.checking.id }),
      ),
    ).toBe("NOT_FOUND");

    expect(
      await errorCodeOf(
        intruder.wallet.delete.mutate({ id: seed.checking.id }),
      ),
    ).toBe("NOT_FOUND");
  });

  test("cannot mutate the owner's category", async () => {
    expect(
      await errorCodeOf(
        intruder.category.update.mutate({
          ...category({ name: "Stolen", type: CategoryType.INCOME }),
          id: seed.salary.id,
        }),
      ),
    ).toBe("NOT_FOUND");

    expect(
      await errorCodeOf(
        intruder.category.archive.mutate({ id: seed.salary.id }),
      ),
    ).toBe("NOT_FOUND");
  });

  test("cannot delete the owner's transaction", async () => {
    expect(
      await errorCodeOf(
        intruder.transaction.delete.mutate({ id: ownedTransactionId }),
      ),
    ).toBe("NOT_FOUND");
  });

  test("cannot attach a new transaction to the owner's wallet", async () => {
    expect(
      await errorCodeOf(
        intruder.transaction.create.mutate(transaction(seed.checking.id)),
      ),
    ).toBe("NOT_FOUND");
  });

  test("the owner's data is untouched afterwards", async () => {
    const wallets = await listWallets(owner, {});
    const row = wallets.find((w) => w.id === seed.checking.id);

    expect(row?.name).toBe("Checking");
    expect(
      (await listTransactions(owner, {})).some(
        (t) => t.id === ownedTransactionId,
      ),
    ).toBe(true);
  });
});

describe("unauthenticated access", () => {
  const anon = anonymousClient();

  test("every protected query is rejected", async () => {
    expect(await errorCodeOf(listWallets(anon, {}))).toBe("UNAUTHORIZED");
    expect(await errorCodeOf(listCategories(anon, {}))).toBe("UNAUTHORIZED");
    expect(await errorCodeOf(listTransactions(anon, {}))).toBe("UNAUTHORIZED");
  });

  test("every protected mutation is rejected", async () => {
    expect(await errorCodeOf(anon.wallet.create.mutate(wallet()))).toBe(
      "UNAUTHORIZED",
    );
    expect(
      await errorCodeOf(
        anon.category.create.mutate(category({
          name: "Nope",
          type: CategoryType.EXPENSE,
        })),
      ),
    ).toBe("UNAUTHORIZED");
    expect(
      await errorCodeOf(
        anon.transaction.create.mutate(transaction(seed.checking.id)),
      ),
    ).toBe("UNAUTHORIZED");
  });

  test("the public health check still works", async () => {
    expect(await anon.healthCheck.query()).toBe("OK");
  });
});
