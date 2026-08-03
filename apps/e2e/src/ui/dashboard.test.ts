import {
  TransactionKind,
  TransactionStatus,
  WalletCurrency,
} from "@budget-manager/schemas";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Page } from "playwright";

import { WEB_URL, requireWeb } from "../support/env";
import {
  listWallets,
  seedBasics,
  transaction,
  wallet,
} from "../support/fixtures";
import {
  closeApp,
  apiForPage,
  bodyText,
  openApp,
  pickSelect,
  signUpThroughUi,
  todayIsoInPage,
  type Session,
} from "../support/web";

let session: Session;
let page: Page;

beforeAll(async () => {
  await requireWeb();
  session = await openApp();
  page = session.page;
  await signUpThroughUi(page);
}, 60_000);

afterAll(async () => {
  await closeApp(session);
}, 30_000);

describe("dashboard", () => {
  test("guides a brand-new user instead of showing zeroed numbers", async () => {
    await page.goto(`${WEB_URL}/dashboard`, { waitUntil: "networkidle" });

    await page
      .getByText("Nothing to summarize yet")
      .waitFor({ state: "visible", timeout: 15_000 });

    expect(
      await page.getByRole("link", { name: "Go to wallets" }).count(),
    ).toBe(1);
  }, 60_000);

  test("summarizes balance, month totals and spending once data exists", async () => {
    // Seeded through the API as the signed-in user: this test is about
    // rendering, and form filling is already covered by flows.test.ts.
    const api = await apiForPage(page);
    const seed = await seedBasics(api);
    const today = await todayIsoInPage(page);

    await api.transaction.create.mutate(
      transaction(seed.checking.id, {
        kind: TransactionKind.INCOME,
        amountCents: 500_000,
        categoryId: seed.salary.id,
        occurrenceDate: today,
      }),
    );
    await api.transaction.create.mutate(
      transaction(seed.checking.id, {
        amountCents: 120_000,
        categoryId: seed.groceries.id,
        occurrenceDate: today,
      }),
    );

    await page.reload({ waitUntil: "networkidle" });
    await page
      .getByText("Top spending categories")
      .waitFor({ state: "visible", timeout: 15_000 });

    const body = await bodyText(page);

    expect(body).toContain("BRL");
    expect(body).toContain("2 wallets");
    expect(body).toContain("R$ 5.000,00"); // income
    expect(body).toContain("R$ 1.200,00"); // expenses
    expect(body).toContain("R$ 4.800,00"); // balance, and net for the month
    expect(body).toContain("Groceries");
  }, 60_000);

  test("charts the cash flow and lists the accounts behind the totals", async () => {
    // The chart is canvas-free SVG, so what is asserted is its table twin: the
    // same numbers, reachable without colour or hover.
    const body = await bodyText(page);

    expect(body).toMatch(/cash flow/i);
    expect(body).toMatch(/wallets/i);
    expect(body).toContain("Checking");
    expect(
      await page
        .getByRole("table", { name: /Income, spending and net per month/i })
        .count(),
    ).toBe(1);
    expect(body).toContain("R$ 4.800,00");
  }, 60_000);

  test("cannot navigate past the current month", async () => {
    expect(await page.getByRole("button", { name: "Next" }).isDisabled()).toBe(
      true,
    );
  }, 60_000);

  test("the previous month keeps balances but zeroes the month figures", async () => {
    await page.getByRole("button", { name: "Previous" }).click();

    // Balances are not month-scoped, so the card stays; income/expense reset.
    // Wait for the balance itself: waiting on the *absence* of the category
    // block would pass during the loading skeleton and read a blank page.
    await page
      .getByText("R$ 4.800,00", { exact: false })
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });

    const body = await bodyText(page);

    expect(body).toContain("BRL");
    expect(body).toContain("R$ 4.800,00"); // balance is unchanged
    expect(body).not.toContain("R$ 5.000,00"); // last month had no income
    expect(await page.getByRole("button", { name: "Next" }).isDisabled()).toBe(
      false,
    );
  }, 60_000);

  test("pending transactions surface, and overdue ones are flagged", async () => {
    const api = await apiForPage(page);
    const wallets = await listWallets(api, {});
    const target = wallets[0];

    if (!target) throw new Error("expected a wallet");

    await api.transaction.create.mutate(
      transaction(target.id, {
        name: "Rent due",
        amountCents: 200_000,
        status: TransactionStatus.WAITING_PAYMENT,
        occurrenceDate: "2099-01-15",
      }),
    );
    await api.transaction.create.mutate(
      transaction(target.id, {
        name: "Forgotten bill",
        amountCents: 45_000,
        status: TransactionStatus.WAITING_PAYMENT,
        occurrenceDate: "2020-03-02",
      }),
    );

    await page.goto(`${WEB_URL}/dashboard`, { waitUntil: "networkidle" });
    await page
      .getByText("Forgotten bill")
      .waitFor({ state: "visible", timeout: 15_000 });

    const body = await bodyText(page);

    expect(body).toMatch(/awaiting payment/i);
    expect(body).toContain("R$ 2.000,00");
    // A past-due row must be visible and called out, not silently dropped.
    expect(body).toContain("Overdue");
    expect(body).toContain("1 overdue");
  }, 60_000);

  test("shows card debt, credit available and the net position", async () => {
    const api = await apiForPage(page);
    const wallets = await api.wallet.getAll.query({});
    const target = wallets.rows[0];

    if (!target) throw new Error("expected a wallet");

    const visa = await api.creditCard.create.mutate({
      name: "Visa",
      limitCents: 500_000,
      closeDay: 10,
      dueDay: 20,
      defaultBillingWalletId: target.id,
      currencyCode: WalletCurrency.BRL,
    });

    // Long overdue, so it lands on the statements panel too.
    await api.transaction.createCardPurchase.mutate({
      status: TransactionStatus.PAID,
      name: "Old flights",
      amountCents: 120_000,
      occurrenceDate: "2020-03-04",
      creditCardId: visa.id,
      categoryId: null,
      notes: null,
    });

    await page.goto(`${WEB_URL}/dashboard`, { waitUntil: "networkidle" });
    await page
      .getByText("Net position")
      .waitFor({ state: "visible", timeout: 15_000 });

    const body = await bodyText(page);

    expect(body).toContain("1 card");
    expect(body).toMatch(/on cards/i);
    expect(body).toContain("R$ 1.200,00"); // outstanding
    expect(body).toContain("R$ 3.800,00"); // credit available
  }, 60_000);

  test("lists the overdue statement and flags it", async () => {
    const body = await bodyText(page);

    expect(body).toMatch(/card statements/i);
    expect(body).toContain("Visa");
    expect(body).toContain("Overdue");
    expect(body).toContain("past its due date");
    expect(await page.getByRole("link", { name: "Record a payment" }).count()).toBe(
      1,
    );
  }, 60_000);

  test("paying the statement clears it from the dashboard", async () => {
    const api = await apiForPage(page);
    const wallets = await api.wallet.getAll.query({});
    const cards = await api.creditCard.options.query();
    const target = wallets.rows[0];
    const visa = cards[0];

    if (!target || !visa) throw new Error("expected a wallet and a card");

    const { statements } = await api.dashboard.getSummary.query({});
    const bill = statements[0];

    if (!bill) throw new Error("expected a statement");

    await api.transaction.createCardPayment.mutate({
      status: TransactionStatus.PAID,
      name: "Settle Visa",
      amountCents: bill.remainingCents,
      occurrenceDate: "2020-03-18",
      creditCardId: visa.id,
      walletId: target.id,
      creditCardBillId: bill.id,
      notes: null,
    });

    await page.reload({ waitUntil: "networkidle" });
    await page
      .getByText("Nothing outstanding on your cards.")
      .waitFor({ state: "visible", timeout: 15_000 });

    const body = await bodyText(page);

    expect(body).not.toContain("past its due date");
  }, 60_000);

  test("scopes the page to one currency, chosen at the top", async () => {
    const api = await apiForPage(page);
    const savings = await api.wallet.create.mutate(
      wallet({
        name: "Savings USD",
        currencyCode: WalletCurrency.USD,
        openingBalanceCents: 0,
      }),
    );

    await api.transaction.create.mutate(
      transaction(savings.id, {
        kind: TransactionKind.INCOME,
        name: "Consulting",
        amountCents: 150_000,
        occurrenceDate: await todayIsoInPage(page),
      }),
    );

    await page.reload({ waitUntil: "networkidle" });
    await page
      .getByLabel("Currency", { exact: true })
      .waitFor({ state: "visible", timeout: 15_000 });

    // BRL sorts first, so the page opens on it and the USD wallet is nowhere in
    // view — one currency at a time is the whole point of the control.
    let body = await bodyText(page);

    expect(body).toContain("Checking");
    expect(body).not.toContain("Savings USD");

    await pickSelect(page, page, "Currency", "USD");
    await page
      .getByText("Savings USD", { exact: false })
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });

    body = await bodyText(page);

    expect(body).toContain("$1,500.00");
    expect(body).toContain("1 wallet");
    expect(body).not.toContain("Checking");
  }, 60_000);

  test("no console or page errors", () => {
    expect(session.consoleErrors).toEqual([]);
  });
});
