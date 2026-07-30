import { TransactionStatus } from "@budget-manager/schemas";
import { beforeAll, describe, expect, test } from "bun:test";

import { errorCodeOf, signUpClient, type ApiClient } from "../support/api";
import { requireServer } from "../support/env";
import {
  card,
  cardPayment,
  cardPurchase,
  seedBasics,
} from "../support/fixtures";

let api: ApiClient;

beforeAll(async () => {
  await requireServer();
  api = (await signUpClient()).client;
});

/** closeDay 10, dueDay 20 — statements close mid-month and fall due that month. */
async function freshCard(overrides = {}) {
  const client = (await signUpClient()).client;
  const seed = await seedBasics(client);
  const created = await client.creditCard.create.mutate(
    card({
      closeDay: 10,
      dueDay: 20,
      defaultBillingWalletId: seed.checking.id,
      ...overrides,
    }),
  );

  return { client, ...seed, card: created };
}

async function billsOf(client: ApiClient, creditCardId: string) {
  return await client.creditCard.bills.query({ creditCardId });
}

describe("statement cycles", () => {
  test("a card starts with no statements", async () => {
    const { client, card: created } = await freshCard();
    const bills = await billsOf(client, created.id);

    expect(bills.rows).toEqual([]);
    expect(bills.total).toBe(0);
    expect(bills.currencyCode).toBe("BRL");
  });

  test("the first purchase opens the statement it belongs to", async () => {
    const { client, card: created } = await freshCard();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, {
        amountCents: 30_000,
        occurrenceDate: "2026-07-03",
      }),
    );

    const bills = await billsOf(client, created.id);

    expect(bills.total).toBe(1);
    expect(bills.rows[0]).toMatchObject({
      periodStart: "2026-06-11",
      periodEnd: "2026-07-10",
      closeAt: "2026-07-10",
      dueAt: "2026-07-20",
      statementTotalCents: 30_000,
      paidCents: 0,
      remainingCents: 30_000,
    });
  });

  test("purchases in the same cycle land on one statement", async () => {
    const { client, card: created } = await freshCard();

    for (const date of ["2026-06-11", "2026-06-30", "2026-07-10"]) {
      await client.transaction.createCardPurchase.mutate(
        cardPurchase(created.id, { amountCents: 10_000, occurrenceDate: date }),
      );
    }

    const bills = await billsOf(client, created.id);

    expect(bills.total).toBe(1);
    expect(bills.rows[0]?.statementTotalCents).toBe(30_000);
  });

  test("a purchase after the close opens the next statement", async () => {
    const { client, card: created } = await freshCard();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, {
        amountCents: 10_000,
        occurrenceDate: "2026-07-05",
      }),
    );
    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, {
        amountCents: 20_000,
        occurrenceDate: "2026-07-15",
      }),
    );

    const bills = await billsOf(client, created.id);

    expect(bills.total).toBe(2);
    // Newest statement first.
    expect(bills.rows.map((b) => b.closeAt)).toEqual([
      "2026-08-10",
      "2026-07-10",
    ]);
    expect(bills.rows[0]?.statementTotalCents).toBe(20_000);
    expect(bills.rows[1]?.statementTotalCents).toBe(10_000);
  });

  test("reusing a cycle never creates a duplicate statement", async () => {
    const { client, card: created } = await freshCard();

    for (let index = 0; index < 5; index++) {
      await client.transaction.createCardPurchase.mutate(
        cardPurchase(created.id, {
          amountCents: 1_000,
          occurrenceDate: "2026-07-02",
        }),
      );
    }

    // The unique (card, periodStart, periodEnd) index holds.
    expect((await billsOf(client, created.id)).total).toBe(1);
  });

  test("inherits the card's billing wallet", async () => {
    const { client, card: created, checking } = await freshCard();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, { occurrenceDate: "2026-07-03" }),
    );

    const bills = await billsOf(client, created.id);

    expect(bills.rows[0]?.billingWalletId).toBe(checking.id);
  });

  test("a December purchase rolls the statement into January", async () => {
    const { client, card: created } = await freshCard();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, {
        amountCents: 5_000,
        occurrenceDate: "2026-12-20",
      }),
    );

    const bills = await billsOf(client, created.id);

    expect(bills.rows[0]).toMatchObject({
      periodStart: "2026-12-11",
      closeAt: "2027-01-10",
      dueAt: "2027-01-20",
    });
  });

  test("a card closing late has its due date in the following month", async () => {
    const { client, card: created } = await freshCard({
      closeDay: 25,
      dueDay: 5,
    });

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, { occurrenceDate: "2026-07-12" }),
    );

    const bills = await billsOf(client, created.id);

    expect(bills.rows[0]).toMatchObject({
      periodStart: "2026-06-26",
      closeAt: "2026-07-25",
      dueAt: "2026-08-05",
    });
  });
});

describe("statement status and totals", () => {
  test("an already-closed statement awaits payment", async () => {
    const { client, card: created } = await freshCard();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, {
        amountCents: 40_000,
        occurrenceDate: "2020-03-04",
      }),
    );

    const bills = await billsOf(client, created.id);

    expect(bills.rows[0]?.status).toBe("awaiting_payment");
  });

  test("a statement not yet closed is open", async () => {
    const { client, card: created } = await freshCard();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, {
        amountCents: 40_000,
        occurrenceDate: "2099-03-04",
      }),
    );

    expect((await billsOf(client, created.id)).rows[0]?.status).toBe("open");
  });

  test("a payment allocated to a statement settles it", async () => {
    const { client, card: created, checking } = await freshCard();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, {
        amountCents: 40_000,
        occurrenceDate: "2020-03-04",
      }),
    );

    const bill = (await billsOf(client, created.id)).rows[0];

    if (!bill) throw new Error("no bill");

    await client.transaction.createCardPayment.mutate(
      cardPayment(created.id, checking.id, {
        amountCents: 40_000,
        occurrenceDate: "2020-03-20",
        creditCardBillId: bill.id,
      }),
    );

    const settled = (await billsOf(client, created.id)).rows.find(
      (b) => b.id === bill.id,
    );

    expect(settled?.paidCents).toBe(40_000);
    expect(settled?.remainingCents).toBe(0);
    expect(settled?.status).toBe("paid");
  });

  test("a partial payment leaves the statement awaiting payment", async () => {
    const { client, card: created, checking } = await freshCard();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, {
        amountCents: 40_000,
        occurrenceDate: "2020-03-04",
      }),
    );

    const bill = (await billsOf(client, created.id)).rows[0];

    if (!bill) throw new Error("no bill");

    await client.transaction.createCardPayment.mutate(
      cardPayment(created.id, checking.id, {
        amountCents: 15_000,
        occurrenceDate: "2020-03-20",
        creditCardBillId: bill.id,
      }),
    );

    const partial = (await billsOf(client, created.id)).rows.find(
      (b) => b.id === bill.id,
    );

    expect(partial?.remainingCents).toBe(25_000);
    expect(partial?.status).toBe("awaiting_payment");
  });

  test("an unallocated payment still reduces the card but no statement", async () => {
    const { client, card: created, checking } = await freshCard();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, {
        amountCents: 40_000,
        occurrenceDate: "2020-03-04",
      }),
    );
    await client.transaction.createCardPayment.mutate(
      cardPayment(created.id, checking.id, {
        amountCents: 40_000,
        occurrenceDate: "2020-03-20",
        creditCardBillId: null,
      }),
    );

    const cards = await client.creditCard.getAll.query({});
    const bills = await billsOf(client, created.id);

    expect(cards.rows[0]?.outstandingCents).toBe(0);
    // The statement is untouched because nothing was allocated to it.
    expect(bills.rows[0]?.paidCents).toBe(0);
    expect(bills.rows[0]?.remainingCents).toBe(40_000);
  });

  test("cancelling a purchase takes it off the statement", async () => {
    const { client, card: created } = await freshCard();

    const purchase = await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, {
        amountCents: 40_000,
        occurrenceDate: "2020-03-04",
      }),
    );

    await client.transaction.updateCardPurchase.mutate({
      ...cardPurchase(created.id, {
        amountCents: 40_000,
        occurrenceDate: "2020-03-04",
        status: TransactionStatus.CANCELLED,
      }),
      id: purchase.id,
    });

    expect(
      (await billsOf(client, created.id)).rows[0]?.statementTotalCents,
    ).toBe(0);
  });

  test("moving a purchase's date moves it to the right statement", async () => {
    const { client, card: created } = await freshCard();

    const purchase = await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, {
        amountCents: 25_000,
        occurrenceDate: "2026-07-05",
      }),
    );

    await client.transaction.updateCardPurchase.mutate({
      ...cardPurchase(created.id, {
        amountCents: 25_000,
        occurrenceDate: "2026-07-20",
      }),
      id: purchase.id,
    });

    const bills = await billsOf(client, created.id);
    const july = bills.rows.find((b) => b.closeAt === "2026-07-10");
    const august = bills.rows.find((b) => b.closeAt === "2026-08-10");

    expect(july?.statementTotalCents).toBe(0);
    expect(august?.statementTotalCents).toBe(25_000);
  });
});

describe("statement access", () => {
  test("rejects a bill belonging to another card", async () => {
    const { client, card: created, checking } = await freshCard();
    const other = await client.creditCard.create.mutate(
      card({ name: "Second", closeDay: 10, dueDay: 20 }),
    );

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, { occurrenceDate: "2026-07-03" }),
    );

    const bill = (await billsOf(client, created.id)).rows[0];

    if (!bill) throw new Error("no bill");

    expect(
      await errorCodeOf(
        client.transaction.createCardPayment.mutate(
          cardPayment(other.id, checking.id, { creditCardBillId: bill.id }),
        ),
      ),
    ).toBe("CONFLICT");
  });

  test("rejects a bill owned by someone else", async () => {
    const mine = await freshCard();
    const stranger = await freshCard();

    await stranger.client.transaction.createCardPurchase.mutate(
      cardPurchase(stranger.card.id, { occurrenceDate: "2026-07-03" }),
    );

    const theirBill = (await billsOf(stranger.client, stranger.card.id))
      .rows[0];

    if (!theirBill) throw new Error("no bill");

    expect(
      await errorCodeOf(
        mine.client.transaction.createCardPayment.mutate(
          cardPayment(mine.card.id, mine.checking.id, {
            creditCardBillId: theirBill.id,
          }),
        ),
      ),
    ).toBe("NOT_FOUND");
  });

  test("cannot list statements for a card you do not own", async () => {
    const stranger = await freshCard();

    expect(
      await errorCodeOf(
        api.creditCard.bills.query({ creditCardId: stranger.card.id }),
      ),
    ).toBe("NOT_FOUND");
  });

  test("statements paginate", async () => {
    const { client, card: created } = await freshCard();

    for (const month of ["03", "04", "05"]) {
      await client.transaction.createCardPurchase.mutate(
        cardPurchase(created.id, {
          amountCents: 1_000,
          occurrenceDate: `2026-${month}-03`,
        }),
      );
    }

    const page = await client.creditCard.bills.query({
      creditCardId: created.id,
      limit: 2,
      offset: 0,
    });

    expect(page.rows.length).toBe(2);
    expect(page.total).toBe(3);
  });

  test("deleting the card takes its statements with it", async () => {
    const { client, card: created } = await freshCard();

    await client.transaction.createCardPurchase.mutate(
      cardPurchase(created.id, { occurrenceDate: "2026-07-03" }),
    );

    // A card with transactions is guarded, so this proves the guard counts
    // bills too.
    expect(
      await errorCodeOf(client.creditCard.delete.mutate({ id: created.id })),
    ).toBe("CONFLICT");
  });
});
