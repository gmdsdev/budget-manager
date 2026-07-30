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
  listTransactions,
  seedBasics,
  transaction,
  transfer,
  wallet,
} from "../support/fixtures";

let api: ApiClient;

beforeAll(async () => {
  await requireServer();
  api = (await signUpClient()).client;
});

async function freshPair() {
  const client = (await signUpClient()).client;
  const seed = await seedBasics(client);

  return { client, ...seed };
}

describe("transfer", () => {
  test("writes both legs against one group id", async () => {
    const { client, checking, savings } = await freshPair();

    const legs = await client.transaction.createTransfer.mutate(
      transfer(checking.id, savings.id),
    );

    expect(legs.length).toBe(2);
    expect(new Set(legs.map((l) => l.transferGroupId)).size).toBe(1);
    expect(legs.map((l) => l.kind).sort()).toEqual([
      TransactionKind.TRANSFER_IN,
      TransactionKind.TRANSFER_OUT,
    ]);

    const out = legs.find((l) => l.kind === TransactionKind.TRANSFER_OUT);
    const into = legs.find((l) => l.kind === TransactionKind.TRANSFER_IN);

    expect(out?.walletId).toBe(checking.id);
    expect(into?.walletId).toBe(savings.id);
    expect(out?.categoryId).toBeNull();
  });

  test("debits the source and credits the destination", async () => {
    const { client, checking, savings } = await freshPair();

    await client.transaction.createTransfer.mutate(
      transfer(checking.id, savings.id, { amountCents: 30_000 }),
    );

    expect((await balanceOf(client, checking.id)).settled).toBe(70_000);
    expect((await balanceOf(client, savings.id)).settled).toBe(30_000);
  });

  test("a pending transfer only shifts the projection", async () => {
    const { client, checking, savings } = await freshPair();

    await client.transaction.createTransfer.mutate(
      transfer(checking.id, savings.id, {
        amountCents: 30_000,
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    );

    expect(await balanceOf(client, checking.id)).toEqual({
      settled: 100_000,
      projected: 70_000,
    });
    expect(await balanceOf(client, savings.id)).toEqual({
      settled: 0,
      projected: 30_000,
    });
  });

  test("rejects the same wallet on both sides", async () => {
    const { client, checking } = await freshPair();

    expect(
      await errorCodeOf(
        client.transaction.createTransfer.mutate(
          transfer(checking.id, checking.id),
        ),
      ),
    ).toBe("BAD_REQUEST");
  });

  test("rejects wallets in different currencies", async () => {
    const { client, checking } = await freshPair();
    const usd = await client.wallet.create.mutate(
      wallet({
        name: "Dollars",
        currencyCode: WalletCurrency.USD,
        openingBalanceCents: 0,
      }),
    );

    expect(
      await errorCodeOf(
        client.transaction.createTransfer.mutate(transfer(checking.id, usd.id)),
      ),
    ).toBe("CONFLICT");
  });

  test("rejects a destination wallet the user does not own", async () => {
    const { client, checking } = await freshPair();
    const stranger = await freshPair();

    expect(
      await errorCodeOf(
        client.transaction.createTransfer.mutate(
          transfer(checking.id, stranger.savings.id),
        ),
      ),
    ).toBe("NOT_FOUND");
  });

  test("updating moves both legs together", async () => {
    const { client, checking, savings } = await freshPair();

    const [leg] = await client.transaction.createTransfer.mutate(
      transfer(checking.id, savings.id, { amountCents: 30_000 }),
    );
    const groupId = leg?.transferGroupId;

    if (!groupId) throw new Error("no transfer group id");

    await client.transaction.updateTransfer.mutate({
      ...transfer(checking.id, savings.id, {
        amountCents: 50_000,
        occurrenceDate: "2026-07-16",
        name: "To savings v2",
      }),
      transferGroupId: groupId,
    });

    const legs = await client.transaction.getTransfer.query({
      transferGroupId: groupId,
    });

    expect(legs.length).toBe(2);
    expect(new Set(legs.map((l) => l.amountCents))).toEqual(new Set([50_000]));
    expect(new Set(legs.map((l) => l.occurrenceDate))).toEqual(
      new Set(["2026-07-16"]),
    );
    expect((await balanceOf(client, checking.id)).settled).toBe(50_000);
    expect((await balanceOf(client, savings.id)).settled).toBe(50_000);
  });

  test("updating can redirect a leg to a different wallet", async () => {
    const { client, checking, savings } = await freshPair();
    const third = await client.wallet.create.mutate(
      wallet({ name: "Third", openingBalanceCents: 0 }),
    );

    const [leg] = await client.transaction.createTransfer.mutate(
      transfer(checking.id, savings.id, { amountCents: 20_000 }),
    );
    const groupId = leg?.transferGroupId;

    if (!groupId) throw new Error("no transfer group id");

    await client.transaction.updateTransfer.mutate({
      ...transfer(checking.id, third.id, { amountCents: 20_000 }),
      transferGroupId: groupId,
    });

    expect((await balanceOf(client, savings.id)).settled).toBe(0);
    expect((await balanceOf(client, third.id)).settled).toBe(20_000);
  });

  test("refuses to edit a leg through the plain transaction route", async () => {
    const { client, checking, savings } = await freshPair();

    const [leg] = await client.transaction.createTransfer.mutate(
      transfer(checking.id, savings.id),
    );

    if (!leg) throw new Error("no leg");

    expect(
      await errorCodeOf(
        client.transaction.update.mutate({
          ...transaction(checking.id, { name: "Hijack", amountCents: 1 }),
          id: leg.id,
        }),
      ),
    ).toBe("CONFLICT");
  });

  test("markPaid on one leg settles both", async () => {
    const { client, checking, savings } = await freshPair();

    const legs = await client.transaction.createTransfer.mutate(
      transfer(checking.id, savings.id, {
        amountCents: 30_000,
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    );
    const first = legs[0];

    if (!first?.transferGroupId) throw new Error("no leg");

    await client.transaction.markPaid.mutate({ id: first.id });

    const after = await client.transaction.getTransfer.query({
      transferGroupId: first.transferGroupId,
    });

    expect(after.every((l) => l.status === TransactionStatus.PAID)).toBe(true);
    expect((await balanceOf(client, checking.id)).settled).toBe(70_000);
    expect((await balanceOf(client, savings.id)).settled).toBe(30_000);
  });

  test("deleting one leg deletes the pair and restores both balances", async () => {
    const { client, checking, savings } = await freshPair();

    const legs = await client.transaction.createTransfer.mutate(
      transfer(checking.id, savings.id, { amountCents: 30_000 }),
    );
    const into = legs.find((l) => l.kind === TransactionKind.TRANSFER_IN);

    if (!into?.transferGroupId) throw new Error("no in leg");

    await client.transaction.delete.mutate({ id: into.id });

    expect(
      await errorCodeOf(
        client.transaction.getTransfer.query({
          transferGroupId: into.transferGroupId,
        }),
      ),
    ).toBe("NOT_FOUND");

    expect((await balanceOf(client, checking.id)).settled).toBe(100_000);
    expect((await balanceOf(client, savings.id)).settled).toBe(0);
    expect((await listTransactions(client, {})).length).toBe(0);
  });

  test("deleteTransfer removes the group by id", async () => {
    const { client, checking, savings } = await freshPair();

    const [leg] = await client.transaction.createTransfer.mutate(
      transfer(checking.id, savings.id),
    );

    if (!leg?.transferGroupId) throw new Error("no leg");

    await client.transaction.deleteTransfer.mutate({
      transferGroupId: leg.transferGroupId,
    });

    expect((await listTransactions(client, {})).length).toBe(0);
  });

  test("both legs surface in the list and only wallet-facing kinds appear", async () => {
    const { client, checking, savings } = await freshPair();

    await client.transaction.createTransfer.mutate(
      transfer(checking.id, savings.id),
    );

    const rows = await listTransactions(client, {});

    expect(rows.length).toBe(2);
    expect(
      rows.every((r) =>
        (
          [
            TransactionKind.INCOME,
            TransactionKind.EXPENSE,
            TransactionKind.TRANSFER_IN,
            TransactionKind.TRANSFER_OUT,
          ] as string[]
        ).includes(r.kind),
      ),
    ).toBe(true);
  });

  test("reports an unknown group as NOT_FOUND", async () => {
    expect(
      await errorCodeOf(
        api.transaction.getTransfer.query({
          transferGroupId: "11111111-1111-4111-8111-111111111111",
        }),
      ),
    ).toBe("NOT_FOUND");
  });
});
