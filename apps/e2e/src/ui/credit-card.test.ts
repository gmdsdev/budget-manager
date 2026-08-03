import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Page } from "playwright";

import { WEB_URL, requireWeb } from "../support/env";
import {
  bodyText,
  closeApp,
  dialog,
  fillField,
  openApp,
  openCreateDialog,
  openFromDetail,
  openRecord,
  openTransaction,
  pickSelect,
  rowFor,
  rowTexts,
  signUpThroughUi,
  waitForRowCount,
  type Session,
} from "../support/web";

let session: Session;
let page: Page;

beforeAll(async () => {
  await requireWeb();
  session = await openApp();
  page = session.page;
  await signUpThroughUi(page);

  // A wallet to bill the card to, created through the UI it belongs to.
  await page.goto(`${WEB_URL}/wallet`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Create Wallet" }).click();
  await dialog(page).waitFor({ state: "visible" });
  await fillField(dialog(page), "Name", "Checking");
  await pickSelect(page, dialog(page), "Type", "Checking");
  await fillField(dialog(page), "Opening Balance", "500000");
  await page.getByRole("button", { name: "Create wallet" }).click();
  await dialog(page).waitFor({ state: "hidden" });
}, 90_000);

afterAll(async () => {
  await closeApp(session);
}, 30_000);

describe("credit card page", () => {
  test("guides an empty state, then creates a card on the first submit", async () => {
    await page.goto(`${WEB_URL}/credit-card`, { waitUntil: "networkidle" });

    expect(await page.getByText("No cards yet").count()).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Create Card" }).click();
    await dialog(page).waitFor({ state: "visible" });
    await fillField(dialog(page), "Name", "Visa");
    await fillField(dialog(page), "Limit", "300000");
    await fillField(dialog(page), "Closing day", "10");
    await fillField(dialog(page), "Due day", "20");
    await pickSelect(page, dialog(page), "Billing wallet", "Checking");
    await page.getByRole("button", { name: "Create card" }).click();
    await dialog(page).waitFor({ state: "hidden", timeout: 10_000 });

    await waitForRowCount(page, 1);

    const row = await rowFor(page, "Visa");

    expect(row?.join(" | ")).toContain("R$ 3.000,00");
    expect(row?.join(" | ")).toContain("Checking");
    // A fresh card owes nothing and has its whole limit free.
    expect(row?.filter((cell) => cell.includes("R$ 0,00")).length).toBe(1);
  }, 90_000);

  test("only offers same-currency wallets for billing", async () => {
    await page.getByRole("button", { name: "Create Card" }).click();
    await dialog(page).waitFor({ state: "visible" });
    await pickSelect(
      page,
      dialog(page),
      "Currency",
      "USD - United States Dollar",
    );
    await dialog(page).getByLabel("Billing wallet", { exact: true }).click();
    // The popup is portalled and renders async; read it only once it is there.
    await page.getByRole("option").first().waitFor({ state: "visible" });

    const options = await page.getByRole("option").allInnerTexts();

    // The BRL wallet must not be offered for a USD card.
    expect(options).toEqual(["None"]);

    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await dialog(page).waitFor({ state: "hidden" });
  }, 90_000);
});

describe("card purchases and payments", () => {
  test("a purchase raises what the card owes and lowers what is available", async () => {
    await page.goto(`${WEB_URL}/transaction`, { waitUntil: "networkidle" });
    await openCreateDialog(page, "Card purchase");
    await dialog(page).waitFor({ state: "visible" });
    await fillField(dialog(page), "Description", "Laptop");
    await pickSelect(page, dialog(page), "Card", "Visa (BRL)");
    await fillField(dialog(page), "Amount", "120000");
    await page.getByRole("button", { name: "Record purchase" }).click();
    await dialog(page).waitFor({ state: "hidden", timeout: 10_000 });

    await waitForRowCount(page, 1);

    const row = await rowFor(page, "Laptop");

    expect(row).toContain("Card purchase");
    // The card stands in for the account, since no wallet is involved.
    expect(row).toContain("Visa");
    expect(row?.some((cell) => cell.includes("−R$ 1.200,00"))).toBe(true);

    await page.goto(`${WEB_URL}/credit-card`, { waitUntil: "networkidle" });
    await waitForRowCount(page, 1);

    const card = (await rowFor(page, "Visa"))?.join(" | ") ?? "";

    expect(card).toContain("R$ 1.200,00"); // outstanding
    expect(card).toContain("R$ 1.800,00"); // available
  }, 90_000);

  test("the wallet is untouched until the bill is paid", async () => {
    await page.goto(`${WEB_URL}/wallet`, { waitUntil: "networkidle" });
    await waitForRowCount(page, 1);

    const wallet = (await rowFor(page, "Checking"))?.join(" | ") ?? "";

    // Opening balance, unchanged by the card purchase.
    expect(wallet).toContain("R$ 5.000,00");
  }, 90_000);

  test("a payment debits the wallet and frees the card limit", async () => {
    await page.goto(`${WEB_URL}/transaction`, { waitUntil: "networkidle" });
    await openCreateDialog(page, "Pay card");
    await dialog(page).waitFor({ state: "visible" });
    await fillField(dialog(page), "Description", "Visa bill");
    await pickSelect(page, dialog(page), "Card", "Visa (BRL)");
    await pickSelect(page, dialog(page), "Pay from wallet", "Checking");
    await fillField(dialog(page), "Amount", "50000");
    await page.getByRole("button", { name: "Record payment" }).click();
    await dialog(page).waitFor({ state: "hidden", timeout: 10_000 });

    await waitForRowCount(page, 2);

    await page.goto(`${WEB_URL}/credit-card`, { waitUntil: "networkidle" });
    await waitForRowCount(page, 1);

    const card = (await rowFor(page, "Visa"))?.join(" | ") ?? "";

    expect(card).toContain("R$ 700,00"); // 1200 - 500 outstanding
    expect(card).toContain("R$ 2.300,00"); // available

    await page.goto(`${WEB_URL}/wallet`, { waitUntil: "networkidle" });
    await waitForRowCount(page, 1);

    const wallet = (await rowFor(page, "Checking"))?.join(" | ") ?? "";

    expect(wallet).toContain("R$ 4.500,00");
  }, 90_000);

  test("the dashboard counts the purchase once, not twice", async () => {
    await page.goto(`${WEB_URL}/dashboard`, { waitUntil: "networkidle" });
    await page
      .getByText("BRL")
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });

    const body = await bodyText(page);

    // Purchase 1.200,00 counted as spending; the 500,00 payment is not a
    // second expense.
    expect(body).toContain("R$ 1.200,00");
    expect(body).not.toContain("R$ 1.700,00");
  }, 90_000);

  test("a card row offers its own editor, not the plain one", async () => {
    await page.goto(`${WEB_URL}/transaction`, { waitUntil: "networkidle" });
    await waitForRowCount(page, 2);

    const detail = await openTransaction(page, "Laptop");
    const actions = await detail.getByRole("button").allInnerTexts();

    expect(actions).toContain("Edit purchase");

    await page.keyboard.press("Escape");
    await dialog(page).waitFor({ state: "hidden" });
  }, 90_000);

  test("editing a purchase re-prices the card", async () => {
    await openTransaction(page, "Laptop");
    await openFromDetail(page, "Edit purchase", "Edit card purchase");
    await fillField(dialog(page), "Amount", "80000");
    await page.getByRole("button", { name: "Save changes" }).click();
    await dialog(page).waitFor({ state: "hidden", timeout: 10_000 });

    await page.goto(`${WEB_URL}/credit-card`, { waitUntil: "networkidle" });
    await waitForRowCount(page, 1);

    const card = (await rowFor(page, "Visa"))?.join(" | ") ?? "";

    expect(card).toContain("R$ 300,00"); // 800 - 500 outstanding
  }, 90_000);

  test("cards can be filtered out of the transaction list by kind", async () => {
    await page.goto(`${WEB_URL}/transaction`, { waitUntil: "networkidle" });
    await waitForRowCount(page, 2);

    await pickSelect(page, page, "Kind", "Card payment");
    await waitForRowCount(page, 1);

    expect((await rowTexts(page)).flat()).toContain("Card payment");
  }, 90_000);

  test("statements open on first purchase and settle when allocated", async () => {
    await page.goto(`${WEB_URL}/credit-card`, { waitUntil: "networkidle" });
    await waitForRowCount(page, 1);

    await openRecord(page, "Visa");
    await openFromDetail(page, "Statements", "Statements — Visa");

    // Wait for the statement row itself, not just the title: the title renders
    // while the query is still loading.
    await page
      .getByText("Showing 1–1 of 1 statements")
      .waitFor({ state: "visible", timeout: 15_000 });

    const body = await bodyText(page);

    // The Laptop purchase (edited to 800,00) opened one statement, and its
    // cycle closes next month, so it is still open rather than due.
    expect(body).toContain("R$ 800,00");
    expect(body).toContain("Open");
    expect(body).not.toContain("Awaiting payment");

    await page.keyboard.press("Escape");
    await dialog(page).waitFor({ state: "hidden" });
  }, 90_000);

  test("allocating a payment to a statement marks it paid", async () => {
    await page.goto(`${WEB_URL}/transaction`, { waitUntil: "networkidle" });
    await openCreateDialog(page, "Pay card");
    await dialog(page).waitFor({ state: "visible" });
    await fillField(dialog(page), "Description", "Statement settled");
    await pickSelect(page, dialog(page), "Card", "Visa (BRL)");
    await pickSelect(page, dialog(page), "Pay from wallet", "Checking");

    // The select offers the unpaid statement by its period.
    await dialog(page).getByLabel("Statement", { exact: true }).click();
    await page.getByRole("option").first().waitFor({ state: "visible" });
    const statements = await page.getByRole("option").allInnerTexts();
    expect(statements.length).toBeGreaterThan(1);
    await page.getByRole("option").nth(1).click();

    await fillField(dialog(page), "Amount", "80000");
    await page.getByRole("button", { name: "Record payment" }).click();
    await dialog(page).waitFor({ state: "hidden", timeout: 10_000 });

    await page.goto(`${WEB_URL}/credit-card`, { waitUntil: "networkidle" });
    await waitForRowCount(page, 1);
    await openRecord(page, "Visa");
    await openFromDetail(page, "Statements", "Statements — Visa");
    await page
      .getByText("Showing 1–1 of 1 statements")
      .waitFor({ state: "visible", timeout: 15_000 });

    const body = await bodyText(page);

    // Allocating the full 800,00 settles the statement.
    expect(body).toContain("Paid");
    expect(body).toContain("R$ 0,00");

    await page.keyboard.press("Escape");
  }, 90_000);

  /**
   * The payment form scopes two fields to the chosen card — the statement list
   * is that card's, and the wallet list is filtered to its currency — but it
   * clears neither by hand when the card changes. It does not have to: Base UI's
   * Select drops a value that is no longer among its own `items` and reports the
   * change, so both fields empty themselves. Nothing else states that, and the
   * form is only correct *because* of it — carrying either value into the submit
   * would earn a server conflict about a field the trigger renders as blank.
   */
  test("changing the card clears the statement and wallet it scoped", async () => {
    // A second card in another currency, so the wallet list it allows and the
    // statements it owns are both different from the first card's.
    await page.goto(`${WEB_URL}/credit-card`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Create Card" }).click();
    await dialog(page).waitFor({ state: "visible" });
    await fillField(dialog(page), "Name", "Dollar Card");
    await fillField(dialog(page), "Limit", "300000");
    await pickSelect(
      page,
      dialog(page),
      "Currency",
      "USD - United States Dollar",
    );
    await page.getByRole("button", { name: "Create card" }).click();
    await dialog(page).waitFor({ state: "hidden", timeout: 10_000 });

    // A fresh purchase, so Visa has an unpaid statement to allocate against —
    // the one the earlier test opened has already been settled in full, and
    // the select only offers statements with something still owing.
    await page.goto(`${WEB_URL}/transaction`, { waitUntil: "networkidle" });
    await openCreateDialog(page, "Card purchase");
    await dialog(page).waitFor({ state: "visible" });
    await fillField(dialog(page), "Description", "Monitor");
    await pickSelect(page, dialog(page), "Card", "Visa (BRL)");
    await fillField(dialog(page), "Amount", "50000");
    await page.getByRole("button", { name: "Record purchase" }).click();
    await dialog(page).waitFor({ state: "hidden", timeout: 10_000 });

    await openCreateDialog(page, "Pay card");
    await dialog(page).waitFor({ state: "visible" });

    await pickSelect(page, dialog(page), "Card", "Visa (BRL)");
    await pickSelect(page, dialog(page), "Pay from wallet", "Checking");
    await dialog(page).getByLabel("Statement", { exact: true }).click();
    await page.getByRole("option").first().waitFor({ state: "visible" });
    await page.getByRole("option").nth(1).click();

    await pickSelect(page, dialog(page), "Card", "Dollar Card (USD)");
    await fillField(dialog(page), "Amount", "10000");
    await page.getByRole("button", { name: "Record payment" }).click();

    // Asserted through the submit, not the trigger's label: a select whose
    // value is not among its own options renders the placeholder whether or not
    // the value behind it was actually dropped, so the screen looks the same
    // either way. Where the complaint comes from is what separates them — the
    // field's own required error means the value is gone, a server conflict
    // toast would mean it had been sent.
    await dialog(page)
      .getByText("Wallet is required")
      .waitFor({ state: "visible", timeout: 10_000 });

    const body = await bodyText(page);

    expect(body).not.toContain("belongs to a different card");
    expect(body).not.toContain("must use the card's currency");

    await page.keyboard.press("Escape");
    await dialog(page).waitFor({ state: "hidden" });
  }, 90_000);

  test("no console or page errors", () => {
    expect(session.consoleErrors).toEqual([]);
  });
});
