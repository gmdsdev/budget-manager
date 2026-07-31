import {
  DEFAULT_CATEGORIES,
  DEFAULT_INCOME_CATEGORY_NAMES,
} from "@budget-manager/schemas";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Page } from "playwright";

import { WEB_URL, requireWeb } from "../support/env";
import {
  bodyText,
  closeApp,
  dialog,
  fillField,
  openApp,
  pickSelect,
  rowFor,
  rowTexts,
  signUpThroughUi,
  summaryFigures,
  waitForRowCount,
  type Session,
} from "../support/web";

const PAGE_SIZE = 20;

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

async function createWallet(name: string, type: string, balance?: string) {
  await page.goto(`${WEB_URL}/wallet`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Create Wallet" }).click();
  await dialog(page).waitFor({ state: "visible" });
  await fillField(dialog(page), "Name", name);
  await pickSelect(page, dialog(page), "Type", type);

  if (balance) {
    await fillField(dialog(page), "Opening Balance", balance);
  }

  await page.getByRole("button", { name: "Create wallet" }).click();
  await dialog(page).waitFor({ state: "hidden" });
}

async function createCategory(name: string, type: string) {
  await page.goto(`${WEB_URL}/category`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Create Category" }).click();
  await dialog(page).waitFor({ state: "visible" });
  await fillField(dialog(page), "Name", name);
  await pickSelect(page, dialog(page), "Type", type);
  await page.getByRole("button", { name: "Create category" }).click();
  await dialog(page).waitFor({ state: "hidden" });
}

describe("wallet page", () => {
  test("shows an empty state, then the created wallets", async () => {
    await page.goto(`${WEB_URL}/wallet`, { waitUntil: "networkidle" });

    expect(await page.getByText("No wallets yet").count()).toBeGreaterThan(0);

    await createWallet("Checking", "Checking", "1000");
    await waitForRowCount(page, 1);

    await createWallet("Savings", "Savings");
    await waitForRowCount(page, 2);

    const checking = await rowFor(page, "Checking");
    expect(checking?.some((cell) => cell.includes("10,00"))).toBe(true);
  }, 60_000);
});

describe("category page", () => {
  test("lists the defaults a sign-up created", async () => {
    await page.goto(`${WEB_URL}/category`, { waitUntil: "networkidle" });
    await waitForRowCount(page, PAGE_SIZE);

    expect(await rowFor(page, "Groceries")).toBeTruthy();
    expect(await bodyText(page)).toContain(`of ${DEFAULT_CATEGORIES.length}`);
  }, 60_000);

  test("creates categories and filters them by type", async () => {
    // Names chosen to sort ahead of the seeded defaults, so the new row is on
    // the first page of its filtered list.
    await createCategory("Consulting", "Income");
    await createCategory("Coffee Runs", "Expense");

    await page.goto(`${WEB_URL}/category`, { waitUntil: "networkidle" });

    await pickSelect(page, page, "Type", "Income");
    await waitForRowCount(page, DEFAULT_INCOME_CATEGORY_NAMES.length + 1);
    expect((await rowTexts(page)).every((row) => row.includes("Income"))).toBe(
      true,
    );
    expect(await rowFor(page, "Consulting")).toBeTruthy();

    await pickSelect(page, page, "Type", "Expense");
    await waitForRowCount(page, PAGE_SIZE);
    expect((await rowTexts(page)).every((row) => row.includes("Expense"))).toBe(
      true,
    );
    expect(await rowFor(page, "Coffee Runs")).toBeTruthy();

    await pickSelect(page, page, "Type", "All types");
    await waitForRowCount(page, PAGE_SIZE);
    expect(await bodyText(page)).toContain(
      `of ${DEFAULT_CATEGORIES.length + 2}`,
    );
  }, 60_000);
});

describe("transaction page", () => {
  test("records an expense with a joined wallet and category", async () => {
    await page.goto(`${WEB_URL}/transaction`, { waitUntil: "networkidle" });

    expect(await page.getByText("No transactions yet").count()).toBeGreaterThan(
      0,
    );

    await page.getByRole("button", { name: "Create Transaction" }).click();
    await dialog(page).waitFor({ state: "visible" });
    await fillField(dialog(page), "Description", "Supermarket");
    await pickSelect(page, dialog(page), "Wallet", "Checking");
    await fillField(dialog(page), "Amount", "25000");
    await pickSelect(page, dialog(page), "Category", "Groceries");
    await page.getByRole("button", { name: "Create transaction" }).click();
    await dialog(page).waitFor({ state: "hidden" });

    await waitForRowCount(page, 1);

    const row = await rowFor(page, "Supermarket");

    expect(row).toContain("Checking");
    expect(row).toContain("Groceries");
    expect(row).toContain("Waiting payment");
    expect(row?.some((cell) => cell.includes("−"))).toBe(true);
  }, 60_000);

  test("creates a transfer as two signed legs, on the first submit", async () => {
    await page.getByRole("button", { name: "Transfer", exact: true }).click();
    await dialog(page).waitFor({ state: "visible" });
    await fillField(dialog(page), "Description", "To savings");
    await pickSelect(page, dialog(page), "From wallet", "Checking (BRL)");
    await pickSelect(page, dialog(page), "To wallet", "Savings (BRL)");
    await fillField(dialog(page), "Amount", "30000");

    // A single click has to be enough: the form must not be stuck behind a
    // stale canSubmit. This is the regression that shipped once already.
    await page.getByRole("button", { name: "Create transfer" }).click();
    await dialog(page).waitFor({ state: "hidden", timeout: 10_000 });

    await waitForRowCount(page, 3);

    const cells = (await rowTexts(page)).flat();

    expect(cells).toContain("Transfer out");
    expect(cells).toContain("Transfer in");
    expect(cells.some((c) => c.includes("+R$ 300,00"))).toBe(true);
    expect(cells.some((c) => c.includes("−R$ 300,00"))).toBe(true);
  }, 60_000);

  test("blocks a transfer between the same wallet, showing the reason", async () => {
    await page.getByRole("button", { name: "Transfer", exact: true }).click();
    await dialog(page).waitFor({ state: "visible" });
    await fillField(dialog(page), "Description", "Self move");
    await pickSelect(page, dialog(page), "From wallet", "Checking (BRL)");
    await pickSelect(page, dialog(page), "To wallet", "Checking (BRL)");
    await fillField(dialog(page), "Amount", "500");
    await page.getByRole("button", { name: "Create transfer" }).click();

    await page
      .getByText("Source and destination wallets must be different")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });

    expect(await dialog(page).count()).toBe(1);

    await page.keyboard.press("Escape");
    await dialog(page).waitFor({ state: "hidden" });
  }, 60_000);

  test("filters by kind and clears back to everything", async () => {
    await pickSelect(page, page, "Kind", "Transfer out");
    await waitForRowCount(page, 1);
    expect((await rowTexts(page)).flat()).toContain("Transfer out");

    await page.getByRole("button", { name: "Clear filters" }).click();
    await waitForRowCount(page, 3);
  }, 60_000);

  test("totals the rows under the list, effective beside projected", async () => {
    const figures = await summaryFigures(page);

    // Both legs of the transfer land in wallets the user owns, so the position
    // is still the opening balance whatever the transfer's status.
    expect(figures["In wallets"]?.[0]).toBe("R$ 10,00");
    // The pending expense counts toward projected only, and a transfer is never
    // spending.
    expect(figures.Expenses).toEqual(["R$ 0,00", "R$ 250,00"]);
    expect(figures.Income).toEqual(["R$ 0,00", "R$ 0,00"]);
  }, 60_000);

  test("scopes the totals to the filters, without counting as list rows", async () => {
    await pickSelect(page, page, "Kind", "Transfer out");
    // The three summary rows must stay out of the row count.
    await waitForRowCount(page, 1);

    const filtered = await summaryFigures(page);

    expect(filtered.Expenses).toEqual(["R$ 0,00", "R$ 0,00"]);
    // A balance covers every wallet, so a row filter cannot narrow it.
    expect(filtered["In wallets"]?.[0]).toBe("R$ 10,00");

    await page.getByRole("button", { name: "Clear filters" }).click();
    await waitForRowCount(page, 3);
  }, 60_000);
});

describe("balances", () => {
  test("the wallet page reflects the transactions just recorded", async () => {
    await page.goto(`${WEB_URL}/wallet`, { waitUntil: "networkidle" });
    await waitForRowCount(page, 2);

    // Checking: opening 10.00, paid transfer out 300.00 → settled -290.00,
    // plus a pending 250.00 expense → projected -540.00.
    const checking = (await rowFor(page, "Checking"))?.join(" | ") ?? "";
    const savings = (await rowFor(page, "Savings"))?.join(" | ") ?? "";

    expect(checking).toMatch(/290,00/);
    expect(checking).toMatch(/projected/);
    expect(savings).toMatch(/300,00/);
  }, 60_000);
});

describe("console hygiene", () => {
  test("no console or page errors across every flow", () => {
    expect(session.consoleErrors).toEqual([]);
  });
});
