import { TransactionKind, TransactionStatus } from "@budget-manager/schemas";
import { beforeAll, describe, expect, test } from "bun:test";

import { errorCodeOf, signUpClient, type ApiClient } from "../support/api";
import { requireServer } from "../support/env";
import {
  balanceOf,
  listTransactions,
  seedBasics,
  transaction,
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

  test("lists newest first", async () => {
    const dates = (await listTransactions(api, {})).map(
      (r) => r.occurrenceDate,
    );

    expect(dates).toEqual([...dates].sort().reverse());
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

  test("deletes a plain transaction", async () => {
    const created = await api.transaction.create.mutate(
      transaction(seed.checking.id, { name: "Doomed" }),
    );

    await api.transaction.delete.mutate({ id: created.id });

    const rows = await listTransactions(api, {});
    expect(rows.some((r) => r.id === created.id)).toBe(false);
  });
});
