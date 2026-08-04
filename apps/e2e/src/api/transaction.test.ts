import {
  TransactionKind,
  TransactionStatus,
  WalletCurrency,
} from "@budget-manager/schemas";
import { beforeAll, describe, expect, test } from "bun:test";

import { errorCodeOf, signUpClient, type ApiClient } from "../support/api";
import { requireServer } from "../support/env";
import {
  balanceOf,
  card,
  cardPayment,
  cardPurchase,
  listTransactions,
  seedBasics,
  transaction,
  transfer,
  wallet,
} from "../support/fixtures";

let api: ApiClient;
let seed: Awaited<ReturnType<typeof seedBasics>>;

beforeAll(async () => {
  await requireServer();
  api = (await signUpClient()).client;
  seed = await seedBasics(api);
});

describe("transaction", () => {
  test("creates an expense and joins wallet + category names", async () => {
    const created = await api.transaction.create.mutate(
      transaction(seed.checking.id, { categoryId: seed.groceries.id }),
    );

    const rows = await listTransactions(api, {});
    const row = rows.find((r) => r.id === created.id);

    expect(row?.walletName).toBe("Checking");
    expect(row?.categoryName).toBe("Groceries");
    expect(row?.transferGroupId).toBeNull();
  });

  test("paid rows move the balance, cancelled rows never do", async () => {
    const client = (await signUpClient()).client;
    const local = await seedBasics(client);

    await client.transaction.create.mutate(
      transaction(local.checking.id, {
        kind: TransactionKind.INCOME,
        amountCents: 500_000,
        categoryId: local.salary.id,
      }),
    );
    await client.transaction.create.mutate(
      transaction(local.checking.id, { amountCents: 25_000 }),
    );
    await client.transaction.create.mutate(
      transaction(local.checking.id, {
        amountCents: 99_900,
        status: TransactionStatus.CANCELLED,
      }),
    );

    expect(await balanceOf(client, local.checking.id)).toEqual({
      settled: 100_000 + 500_000 - 25_000,
      projected: 100_000 + 500_000 - 25_000,
    });
  });

  test("waiting_payment counts toward projected only", async () => {
    const client = (await signUpClient()).client;
    const local = await seedBasics(client);

    await client.transaction.create.mutate(
      transaction(local.checking.id, {
        amountCents: 10_000,
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    );

    expect(await balanceOf(client, local.checking.id)).toEqual({
      settled: 100_000,
      projected: 90_000,
    });
  });

  test("markPaid settles a pending row", async () => {
    const client = (await signUpClient()).client;
    const local = await seedBasics(client);

    const pending = await client.transaction.create.mutate(
      transaction(local.checking.id, {
        amountCents: 10_000,
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    );

    const paid = await client.transaction.markPaid.mutate({ id: pending.id });

    expect(paid.status).toBe(TransactionStatus.PAID);
    expect(paid.paidAt).not.toBeNull();
    expect(await balanceOf(client, local.checking.id)).toEqual({
      settled: 90_000,
      projected: 90_000,
    });
  });

  test("markPaid refuses a cancelled row", async () => {
    const cancelled = await api.transaction.create.mutate(
      transaction(seed.checking.id, { status: TransactionStatus.CANCELLED }),
    );

    expect(
      await errorCodeOf(api.transaction.markPaid.mutate({ id: cancelled.id })),
    ).toBe("CONFLICT");
  });

  test("update clears paidAt when leaving the paid status", async () => {
    const created = await api.transaction.create.mutate(
      transaction(seed.checking.id, { status: TransactionStatus.PAID }),
    );

    expect(created.paidAt).not.toBeNull();

    const updated = await api.transaction.update.mutate({
      ...transaction(seed.checking.id, {
        status: TransactionStatus.WAITING_PAYMENT,
      }),
      id: created.id,
    });

    expect(updated.paidAt).toBeNull();
  });

  test("rejects a category whose type contradicts the kind", async () => {
    expect(
      await errorCodeOf(
        api.transaction.create.mutate(
          transaction(seed.checking.id, {
            kind: TransactionKind.INCOME,
            categoryId: seed.groceries.id,
          }),
        ),
      ),
    ).toBe("CONFLICT");
  });

  test("rejects transfer kinds through the simple form", async () => {
    expect(
      await errorCodeOf(
        api.transaction.create.mutate(
          transaction(seed.checking.id, {
            // @ts-expect-error the form kind union deliberately excludes transfers
            kind: TransactionKind.TRANSFER_OUT,
          }),
        ),
      ),
    ).toBe("BAD_REQUEST");
  });

  test("rejects a non-positive amount and a malformed date", async () => {
    expect(
      await errorCodeOf(
        api.transaction.create.mutate(
          transaction(seed.checking.id, { amountCents: 0 }),
        ),
      ),
    ).toBe("BAD_REQUEST");

    expect(
      await errorCodeOf(
        api.transaction.create.mutate(
          transaction(seed.checking.id, { occurrenceDate: "05-07-2026" }),
        ),
      ),
    ).toBe("BAD_REQUEST");
  });

  test("rejects a wallet the user does not own", async () => {
    const stranger = (await signUpClient()).client;
    const theirs = await seedBasics(stranger);

    expect(
      await errorCodeOf(
        api.transaction.create.mutate(transaction(theirs.checking.id)),
      ),
    ).toBe("NOT_FOUND");
  });

  test("filters by kind, status, wallet, category and date range", async () => {
    const client = (await signUpClient()).client;
    const local = await seedBasics(client);

    await client.transaction.create.mutate(
      transaction(local.checking.id, {
        kind: TransactionKind.INCOME,
        categoryId: local.salary.id,
        occurrenceDate: "2026-07-01",
      }),
    );
    await client.transaction.create.mutate(
      transaction(local.checking.id, {
        categoryId: local.groceries.id,
        occurrenceDate: "2026-07-20",
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    );
    await client.transaction.create.mutate(
      transaction(local.savings.id, { occurrenceDate: "2026-08-02" }),
    );

    const byKind = await listTransactions(client, {
      kind: TransactionKind.INCOME,
    });
    expect(byKind.length).toBe(1);

    const byStatus = await listTransactions(client, {
      status: TransactionStatus.WAITING_PAYMENT,
    });
    expect(byStatus.length).toBe(1);

    const byWallet = await listTransactions(client, {
      walletId: local.savings.id,
    });
    expect(byWallet.length).toBe(1);

    const byCategory = await listTransactions(client, {
      categoryId: local.groceries.id,
    });
    expect(byCategory.length).toBe(1);

    const byRange = await listTransactions(client, {
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
    });
    expect(byRange.length).toBe(2);
  });

  test("lists oldest first", async () => {
    const dates = (await listTransactions(api, {})).map(
      (r) => r.occurrenceDate,
    );

    expect(dates).toEqual([...dates].sort());
  });

  test("respects limit and offset", async () => {
    const all = await listTransactions(api, {});
    const firstPage = await listTransactions(api, { limit: 1 });
    const secondPage = await listTransactions(api, {
      limit: 1,
      offset: 1,
    });

    expect(firstPage.length).toBe(1);
    expect(firstPage[0]?.id).toBe(all[0]?.id);
    expect(secondPage[0]?.id).toBe(all[1]?.id);
  });

  test("summary reads balances as of the range end and totals only its rows", async () => {
    const client = (await signUpClient()).client;
    const local = await seedBasics(client);

    await client.transaction.create.mutate(
      transaction(local.checking.id, {
        kind: TransactionKind.INCOME,
        amountCents: 500_000,
        categoryId: local.salary.id,
        occurrenceDate: "2026-07-10",
      }),
    );
    await client.transaction.create.mutate(
      transaction(local.checking.id, {
        amountCents: 25_000,
        occurrenceDate: "2026-07-20",
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    );
    // Dated after the range: outside every figure below.
    await client.transaction.create.mutate(
      transaction(local.checking.id, {
        amountCents: 90_000,
        occurrenceDate: "2026-08-05",
      }),
    );

    const { currencies } = await client.transaction.summary.query({
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
    });

    expect(currencies).toHaveLength(1);
    expect(currencies[0]).toMatchObject({
      currencyCode: "BRL",
      // Two wallets open at 100.000 and 0, plus July's settled income.
      balanceCents: 600_000,
      projectedBalanceCents: 575_000,
      incomeCents: 500_000,
      expenseCents: 0,
      projectedExpenseCents: 25_000,
      netCents: 500_000,
      projectedNetCents: 475_000,
    });
  });

  test("summary follows the list's filters and never mixes currencies", async () => {
    const client = (await signUpClient()).client;
    const local = await seedBasics(client);
    const euro = await client.wallet.create.mutate(
      wallet({ name: "Euro", currencyCode: WalletCurrency.EUR, openingBalanceCents: 0 }),
    );

    await client.transaction.create.mutate(
      transaction(local.checking.id, {
        amountCents: 25_000,
        occurrenceDate: "2026-07-10",
        categoryId: local.groceries.id,
      }),
    );
    await client.transaction.create.mutate(
      transaction(euro.id, { amountCents: 4_000, occurrenceDate: "2026-07-11" }),
    );

    const range = { dateFrom: "2026-07-01", dateTo: "2026-07-31" };
    const all = await client.transaction.summary.query(range);

    expect(all.currencies.map((row) => row.currencyCode)).toEqual([
      WalletCurrency.BRL,
      WalletCurrency.EUR,
    ]);
    expect(all.currencies[1]).toMatchObject({ expenseCents: 4_000 });

    const byCategory = await client.transaction.summary.query({
      ...range,
      categoryId: local.groceries.id,
    });

    // A row filter narrows the totals; the balances still cover every wallet.
    expect(byCategory.currencies[0]).toMatchObject({
      currencyCode: WalletCurrency.BRL,
      expenseCents: 25_000,
      balanceCents: 75_000,
    });
    // The euro row's spending is filtered out while its balance still carries
    // it: an opening balance cannot be scoped to a category.
    expect(byCategory.currencies[1]).toMatchObject({
      currencyCode: WalletCurrency.EUR,
      expenseCents: 0,
      balanceCents: -4_000,
    });
  });

  test("summary counts a card purchase as spending and its payment as neither", async () => {
    const client = (await signUpClient()).client;
    const local = await seedBasics(client);
    const visa = await client.creditCard.create.mutate(card());

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(visa.id, {
        amountCents: 30_000,
        occurrenceDate: "2026-07-05",
      }),
    );
    await client.transaction.createCardPayment.mutate(
      cardPayment(visa.id, local.checking.id, {
        amountCents: 30_000,
        occurrenceDate: "2026-07-20",
      }),
    );

    const { currencies } = await client.transaction.summary.query({
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
    });

    expect(currencies[0]).toMatchObject({
      // The purchase is the expense; paying the bill only settles the debt.
      expenseCents: 30_000,
      // The payment still leaves the wallet.
      balanceCents: 70_000,
    });
  });

  test("summary leaves transfers out of income and expenses", async () => {
    const client = (await signUpClient()).client;
    const local = await seedBasics(client);

    await client.transaction.createTransfer.mutate(
      transfer(local.checking.id, local.savings.id, {
        amountCents: 30_000,
        occurrenceDate: "2026-07-15",
      }),
    );

    const { currencies } = await client.transaction.summary.query({
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
    });

    expect(currencies[0]).toMatchObject({
      incomeCents: 0,
      expenseCents: 0,
      // Both legs land in wallets the user owns, so nothing left the position.
      balanceCents: 100_000,
    });
  });

  test("deletes a plain transaction", async () => {
    const created = await api.transaction.create.mutate(
      transaction(seed.checking.id, { name: "Doomed" }),
    );

    await api.transaction.delete.mutate({ id: created.id });

    const rows = await listTransactions(api, {});
    expect(rows.some((r) => r.id === created.id)).toBe(false);
  });
});
