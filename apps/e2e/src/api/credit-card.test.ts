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
  wallet,
} from "../support/fixtures";

let api: ApiClient;

beforeAll(async () => {
  await requireServer();
  api = (await signUpClient()).client;
});

async function freshUser() {
  const client = (await signUpClient()).client;
  const seed = await seedBasics(client);
  const created = await client.creditCard.create.mutate(
    card({ defaultBillingWalletId: seed.checking.id }),
  );

  return { client, ...seed, card: created };
}

async function cardStateOf(client: ApiClient, cardId: string) {
  const cards = await client.creditCard.getAll.query({});
  const row = cards.rows.find((c) => c.id === cardId);

  if (!row) throw new Error("card not in list");

  return row;
}

describe("credit card", () => {
  test("starts empty for a new user", async () => {
    const page = await api.creditCard.getAll.query({});

    expect(page.rows).toEqual([]);
    expect(page.total).toBe(0);
  });

  test("a new card has its full limit available", async () => {
    const { client, card: created } = await freshUser();
    const row = await cardStateOf(client, created.id);

    expect(row.limitCents).toBe(500_000);
    expect(row.outstandingCents).toBe(0);
    expect(row.availableCents).toBe(500_000);
    expect(row.closeDay).toBe(10);
    expect(row.dueDay).toBe(20);
  });

  test("joins the default billing wallet name", async () => {
    const { client, card: created } = await freshUser();
    const row = await cardStateOf(client, created.id);

    expect(row.defaultBillingWalletName).toBe("Checking");
  });

  test("rejects a cycle day outside 1–28 and a non-positive limit", async () => {
    expect(
      await errorCodeOf(api.creditCard.create.mutate(card({ closeDay: 0 }))),
    ).toBe("BAD_REQUEST");
    expect(
      await errorCodeOf(api.creditCard.create.mutate(card({ dueDay: 31 }))),
    ).toBe("BAD_REQUEST");
    expect(
      await errorCodeOf(api.creditCard.create.mutate(card({ limitCents: 0 }))),
    ).toBe("BAD_REQUEST");
  });

  test("rejects a billing wallet in another currency", async () => {
    const { client } = await freshUser();
    const usd = await client.wallet.create.mutate(
      wallet({ name: "Dollars", currencyCode: WalletCurrency.USD }),
    );

    expect(
      await errorCodeOf(
        client.creditCard.create.mutate(
          card({ name: "Mismatch", defaultBillingWalletId: usd.id }),
        ),
      ),
    ).toBe("CONFLICT");
  });

  test("rejects a billing wallet owned by someone else", async () => {
    const { client } = await freshUser();
    const stranger = await freshUser();

    expect(
      await errorCodeOf(
        client.creditCard.create.mutate(
          card({
            name: "Theirs",
            defaultBillingWalletId: stranger.checking.id,
          }),
        ),
      ),
    ).toBe("NOT_FOUND");
  });

  test("archives, hides and restores", async () => {
    const { client, card: created } = await freshUser();

    await client.creditCard.archive.mutate({ id: created.id });
    expect((await client.creditCard.getAll.query({})).rows.length).toBe(0);
    expect(
      (await client.creditCard.getAll.query({ includeArchived: true })).rows
        .length,
    ).toBe(1);

    await client.creditCard.unarchive.mutate({ id: created.id });
    expect((await client.creditCard.getAll.query({})).rows.length).toBe(1);
  });

  test("options omit archived cards", async () => {
    const { client, card: created } = await freshUser();

    expect((await client.creditCard.options.query()).length).toBe(1);

    await client.creditCard.archive.mutate({ id: created.id });

    expect(await client.creditCard.options.query()).toEqual([]);
  });

  test("refuses to delete a card that has transactions", async () => {
    const { client, card: created } = await freshUser();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id),
    );

    expect(
      await errorCodeOf(client.creditCard.delete.mutate({ id: created.id })),
    ).toBe("CONFLICT");
  });

  test("deletes a card nothing references", async () => {
    const { client, card: created } = await freshUser();

    await client.creditCard.delete.mutate({ id: created.id });

    expect((await client.creditCard.getAll.query({})).rows).toEqual([]);
  });

  test("a stranger sees and touches nothing", async () => {
    const mine = await freshUser();
    const stranger = (await signUpClient()).client;

    expect((await stranger.creditCard.getAll.query({})).rows).toEqual([]);
    expect(
      await errorCodeOf(
        stranger.creditCard.archive.mutate({ id: mine.card.id }),
      ),
    ).toBe("NOT_FOUND");
  });
});

describe("card purchases", () => {
  test("increase what the card owes and never touch a wallet", async () => {
    const { client, card: created, checking } = await freshUser();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, { amountCents: 120_000 }),
    );

    const row = await cardStateOf(client, created.id);

    expect(row.outstandingCents).toBe(120_000);
    expect(row.availableCents).toBe(380_000);
    // The whole point: buying on credit does not move the bank account.
    expect((await balanceOf(client, checking.id)).settled).toBe(100_000);
  });

  test("appear in the transaction list with the card name and no wallet", async () => {
    const { client, card: created } = await freshUser();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, { name: "Laptop" }),
    );

    const rows = await listTransactions(client);
    const row = rows.find((r) => r.name === "Laptop");

    expect(row?.kind).toBe(TransactionKind.CREDIT_CARD_PURCHASE);
    expect(row?.creditCardName).toBe("Visa");
    expect(row?.walletName).toBeNull();
    // Currency still resolves, from the card rather than a wallet.
    expect(row?.walletCurrencyCode).toBe(WalletCurrency.BRL);
  });

  test("can be filtered by kind", async () => {
    const { client, card: created, checking } = await freshUser();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id),
    );
    await client.transaction.create.mutate({
      kind: TransactionKind.EXPENSE,
      status: TransactionStatus.PAID,
      name: "Cash expense",
      amountCents: 1_000,
      occurrenceDate: "2026-07-05",
      walletId: checking.id,
      categoryId: null,
      notes: null,
    });

    const purchases = await listTransactions(client, {
      kind: TransactionKind.CREDIT_CARD_PURCHASE,
    });

    expect(purchases.length).toBe(1);
  });

  test("a pending purchase only moves the projection", async () => {
    const { client, card: created } = await freshUser();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, {
        amountCents: 40_000,
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    );

    const row = await cardStateOf(client, created.id);

    expect(row.outstandingCents).toBe(0);
    expect(row.projectedOutstandingCents).toBe(40_000);
    expect(row.availableCents).toBe(500_000);
  });

  test("reject an income category", async () => {
    const { client, card: created, salary } = await freshUser();

    expect(
      await errorCodeOf(
        client.transaction.createCardPurchase.mutate(
          cardPurchase(created.id, { categoryId: salary.id }),
        ),
      ),
    ).toBe("CONFLICT");
  });

  test("reject a card owned by someone else", async () => {
    const { client } = await freshUser();
    const stranger = await freshUser();

    expect(
      await errorCodeOf(
        client.transaction.createCardPurchase.mutate(
          cardPurchase(stranger.card.id),
        ),
      ),
    ).toBe("NOT_FOUND");
  });

  test("can be edited and re-priced", async () => {
    const { client, card: created } = await freshUser();

    const purchase = await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, { amountCents: 30_000 }),
    );

    await client.transaction.updateCardPurchase.mutate({
      ...cardPurchase(created.id, { amountCents: 45_000, name: "Corrected" }),
      id: purchase.id,
    });

    expect((await cardStateOf(client, created.id)).outstandingCents).toBe(
      45_000,
    );
  });

  test("cannot be edited through the plain transaction form", async () => {
    const { client, card: created, checking } = await freshUser();

    const purchase = await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id),
    );

    expect(
      await errorCodeOf(
        client.transaction.update.mutate({
          id: purchase.id,
          kind: TransactionKind.EXPENSE,
          status: TransactionStatus.PAID,
          name: "Hijack",
          amountCents: 1,
          occurrenceDate: "2026-07-05",
          walletId: checking.id,
          categoryId: null,
          notes: null,
        }),
      ),
    ).toBe("CONFLICT");
  });

  test("deleting one frees the limit again", async () => {
    const { client, card: created } = await freshUser();

    const purchase = await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, { amountCents: 70_000 }),
    );

    await client.transaction.delete.mutate({ id: purchase.id });

    expect((await cardStateOf(client, created.id)).outstandingCents).toBe(0);
  });
});

describe("card payments", () => {
  test("reduce the card debt and debit the wallet", async () => {
    const { client, card: created, checking } = await freshUser();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, { amountCents: 120_000 }),
    );
    await client.transaction.createCardPayment.mutate(
      cardPayment(created.id, checking.id, { amountCents: 50_000 }),
    );

    const row = await cardStateOf(client, created.id);

    expect(row.outstandingCents).toBe(70_000);
    expect(row.availableCents).toBe(430_000);
    // This is the leg that actually moves money out of the bank.
    expect((await balanceOf(client, checking.id)).settled).toBe(50_000);
  });

  test("paying in full clears the card", async () => {
    const { client, card: created, checking } = await freshUser();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, { amountCents: 80_000 }),
    );
    await client.transaction.createCardPayment.mutate(
      cardPayment(created.id, checking.id, { amountCents: 80_000 }),
    );

    const row = await cardStateOf(client, created.id);

    expect(row.outstandingCents).toBe(0);
    expect(row.availableCents).toBe(500_000);
  });

  test("a pending payment only moves projections", async () => {
    const { client, card: created, checking } = await freshUser();

    await client.transaction.createCardPayment.mutate(
      cardPayment(created.id, checking.id, {
        amountCents: 20_000,
        status: TransactionStatus.WAITING_PAYMENT,
      }),
    );

    expect(await balanceOf(client, checking.id)).toEqual({
      settled: 100_000,
      projected: 80_000,
    });
  });

  test("reject a wallet in a different currency from the card", async () => {
    const { client, card: created } = await freshUser();
    const usd = await client.wallet.create.mutate(
      wallet({ name: "Dollars", currencyCode: WalletCurrency.USD }),
    );

    expect(
      await errorCodeOf(
        client.transaction.createCardPayment.mutate(
          cardPayment(created.id, usd.id),
        ),
      ),
    ).toBe("CONFLICT");
  });

  test("reject a wallet owned by someone else", async () => {
    const { client, card: created } = await freshUser();
    const stranger = await freshUser();

    expect(
      await errorCodeOf(
        client.transaction.createCardPayment.mutate(
          cardPayment(created.id, stranger.checking.id),
        ),
      ),
    ).toBe("NOT_FOUND");
  });

  test("can be edited to a different wallet", async () => {
    const { client, card: created, checking, savings } = await freshUser();

    const payment = await client.transaction.createCardPayment.mutate(
      cardPayment(created.id, checking.id, { amountCents: 25_000 }),
    );

    await client.transaction.updateCardPayment.mutate({
      ...cardPayment(created.id, savings.id, { amountCents: 25_000 }),
      id: payment.id,
    });

    expect((await balanceOf(client, checking.id)).settled).toBe(100_000);
    expect((await balanceOf(client, savings.id)).settled).toBe(-25_000);
  });

  test("updating a purchase as a payment is not possible", async () => {
    const { client, card: created, checking } = await freshUser();

    const purchase = await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id),
    );

    expect(
      await errorCodeOf(
        client.transaction.updateCardPayment.mutate({
          ...cardPayment(created.id, checking.id),
          id: purchase.id,
        }),
      ),
    ).toBe("NOT_FOUND");
  });
});

describe("card spending in the dashboard", () => {
  test("a purchase counts as month spending, the payment does not double it", async () => {
    const { client, card: created, checking, groceries } = await freshUser();
    const month = "2026-09";

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, {
        amountCents: 90_000,
        occurrenceDate: "2026-09-04",
        categoryId: groceries.id,
      }),
    );
    await client.transaction.createCardPayment.mutate(
      cardPayment(created.id, checking.id, {
        amountCents: 90_000,
        occurrenceDate: "2026-09-20",
      }),
    );

    const summary = await client.dashboard.getSummary.query({ month });
    const brl = summary.currencies.find((c) => c.currencyCode === "BRL");

    // 90_000 once, not 180_000.
    expect(brl?.expenseCents).toBe(90_000);
    expect(
      brl?.topCategories.find((c) => c.name === "Groceries")?.amountCents,
    ).toBe(90_000);
    // The wallet lost the money exactly once.
    expect(brl?.balanceCents).toBe(100_000 - 90_000);
  });

  test("a purchase on a card with no wallet still reaches the month totals", async () => {
    const client = (await signUpClient()).client;
    const created = await client.creditCard.create.mutate(
      card({ defaultBillingWalletId: null }),
    );

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, {
        amountCents: 33_000,
        occurrenceDate: "2026-09-08",
      }),
    );

    const summary = await client.dashboard.getSummary.query({
      month: "2026-09",
    });
    const brl = summary.currencies.find((c) => c.currencyCode === "BRL");

    // With no wallet at all, an inner join would have dropped this row.
    expect(brl?.expenseCents).toBe(33_000);
  });
});
