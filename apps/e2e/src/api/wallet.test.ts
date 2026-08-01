import { WalletCurrency, WalletType } from "@budget-manager/schemas";
import { beforeAll, describe, expect, test } from "bun:test";

import { errorCodeOf, signUpClient, type ApiClient } from "../support/api";
import { requireServer } from "../support/env";
import { listWallets, transaction, wallet } from "../support/fixtures";

let api: ApiClient;

beforeAll(async () => {
  await requireServer();
  api = (await signUpClient()).client;
});

describe("wallet", () => {
  test("starts empty for a new user", async () => {
    expect(await listWallets(api, {})).toEqual([]);
  });

  test("creates a wallet and reports the opening balance as the balance", async () => {
    const created = await api.wallet.create.mutate(wallet({ name: "Opening" }));

    const rows = await listWallets(api, {});
    const row = rows.find((w) => w.id === created.id);

    expect(row?.balanceCents).toBe(100_000);
    expect(row?.projectedBalanceCents).toBe(100_000);
  });

  test("never exposes the dropped cache column", async () => {
    const rows = await listWallets(api, {});

    expect(rows.every((row) => !("currentBalanceCents" in row))).toBe(true);
  });

  test("updates name, type and currency", async () => {
    const created = await api.wallet.create.mutate(wallet({ name: "Before" }));

    const updated = await api.wallet.update.mutate({
      id: created.id,
      name: "After",
      type: WalletType.INVESTMENTS,
      currencyCode: WalletCurrency.USD,
      openingBalanceCents: 500,
    });

    expect(updated.name).toBe("After");
    expect(updated.type).toBe(WalletType.INVESTMENTS);
    expect(updated.currencyCode).toBe(WalletCurrency.USD);
    expect(updated.openingBalanceCents).toBe(500);
  });

  test("archives, hides, and restores", async () => {
    const created = await api.wallet.create.mutate(
      wallet({ name: "Archivable" }),
    );

    await api.wallet.archive.mutate({ id: created.id });

    const visible = await listWallets(api, {});
    expect(visible.some((w) => w.id === created.id)).toBe(false);

    const withArchived = await listWallets(api, {
      includeArchived: true,
    });
    expect(withArchived.some((w) => w.id === created.id)).toBe(true);

    await api.wallet.unarchive.mutate({ id: created.id });

    const restored = await listWallets(api, {});
    expect(restored.some((w) => w.id === created.id)).toBe(true);
  });

  test("deletes a wallet nothing references", async () => {
    const created = await api.wallet.create.mutate(
      wallet({ name: "Disposable" }),
    );

    await api.wallet.delete.mutate({ id: created.id });

    const rows = await listWallets(api, {});
    expect(rows.some((w) => w.id === created.id)).toBe(false);
  });

  test("refuses to delete a wallet that has transactions", async () => {
    const created = await api.wallet.create.mutate(wallet({ name: "In use" }));
    await api.transaction.create.mutate(transaction(created.id));

    expect(
      await errorCodeOf(api.wallet.delete.mutate({ id: created.id })),
    ).toBe("CONFLICT");
  });

  test("holds the currency once something is recorded against the wallet", async () => {
    const created = await api.wallet.create.mutate(
      wallet({ name: "Settled currency" }),
    );
    await api.transaction.create.mutate(transaction(created.id));

    expect(
      await errorCodeOf(
        api.wallet.update.mutate({
          id: created.id,
          name: "Settled currency",
          type: WalletType.CHECKING,
          currencyCode: WalletCurrency.USD,
          openingBalanceCents: 100_000,
        }),
      ),
    ).toBe("CONFLICT");

    // Everything else about the wallet is still editable.
    const renamed = await api.wallet.update.mutate({
      id: created.id,
      name: "Renamed",
      type: WalletType.SAVINGS,
      currencyCode: WalletCurrency.BRL,
      openingBalanceCents: 200_000,
    });

    expect(renamed.name).toBe("Renamed");
    expect(renamed.openingBalanceCents).toBe(200_000);
  });

  test("rejects a blank name and an out-of-range balance", async () => {
    expect(
      await errorCodeOf(api.wallet.create.mutate(wallet({ name: "   " }))),
    ).toBe("BAD_REQUEST");

    expect(
      await errorCodeOf(
        api.wallet.create.mutate(
          wallet({ openingBalanceCents: 2_147_483_648 }),
        ),
      ),
    ).toBe("BAD_REQUEST");
  });

  test("reports a missing wallet as NOT_FOUND", async () => {
    expect(
      await errorCodeOf(
        api.wallet.archive.mutate({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      ),
    ).toBe("NOT_FOUND");
  });
});
