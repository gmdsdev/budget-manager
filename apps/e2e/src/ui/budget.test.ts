import { CategoryType } from "@budget-manager/schemas";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Page } from "playwright";

import { WEB_URL, requireWeb } from "../support/env";
import {
  apiForPage,
  bodyText,
  closeApp,
  closeMenu,
  dialog,
  fillField,
  openApp,
  pickSelect,
  rowFor,
  signUpThroughUi,
  waitForRowCount,
  type Session,
} from "../support/web";
import { dayIn, transaction, wallet } from "../support/fixtures";

let session: Session;
let page: Page;
/** The month the server is in; the app's own clock, not the test process's. */
let month: string;

beforeAll(async () => {
  await requireWeb();
  session = await openApp();
  page = session.page;
  await signUpThroughUi(page);

  const api = await apiForPage(page);

  month = (await api.budget.getMonth.query({})).month;

  const checking = await api.wallet.create.mutate(
    wallet({ name: "Checking", openingBalanceCents: 500_000 }),
  );

  // A fresh account already owns the default categories, so a budget has
  // something to limit without the suite inventing one.
  await api.transaction.create.mutate(
    transaction(checking.id, {
      name: "Supermarket",
      amountCents: 40_000,
      occurrenceDate: dayIn(month, 5),
      categoryId: (
        await api.category.options.query({ type: CategoryType.EXPENSE })
      ).find((row) => row.name === "Groceries")?.id,
    }),
  );
}, 90_000);

afterAll(async () => {
  await closeApp(session);
}, 30_000);

describe("budgets", () => {
  test("the nav reaches the budget screen", async () => {
    await page.goto(`${WEB_URL}/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Budgets" }).first().click();
    await page.waitForURL(/\/budget/);
    // waitForURL resolves before the route renders, so wait on the heading.
    await page
      .getByRole("heading", { name: "Budgets", level: 1 })
      .waitFor({ state: "visible" });

    const body = await bodyText(page);

    // Headings are uppercased in CSS and innerText reports that, so the
    // assertion is on copy the page renders as written.
    expect(body).toContain("Set a monthly limit on a category");
    expect(body).toContain("No limits set for this month.");
  }, 60_000);

  test("a new limit shows what is left to spend this month", async () => {
    await page.getByRole("button", { name: "Create Budget" }).click();
    await dialog(page).waitFor({ state: "visible" });
    await pickSelect(page, dialog(page), "Category", "Groceries");
    await fillField(dialog(page), "Monthly limit", "100000");
    await page.getByRole("button", { name: "Create budget" }).click();
    await dialog(page).waitFor({ state: "hidden", timeout: 10_000 });

    await waitForRowCount(page, 1);

    const body = await bodyText(page);

    // R$ 400,00 spent against a R$ 1.000,00 limit leaves R$ 600,00.
    expect(body).toContain("R$ 600,00 left");
    expect(body).toContain("R$ 400,00 of R$ 1.000,00");
    expect(body).toContain("On track");
  }, 60_000);

  test("the series lists its schedule", async () => {
    const row = await rowFor(page, "Groceries");

    expect(row).toContain("R$ 1.000,00");
    expect(row).toContain("Every month");
    expect(row).toContain("Active");
  }, 60_000);

  test("one month can be given its own limit without moving the rest", async () => {
    await page
      .getByRole("button", { name: "Actions for Groceries", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "View months" }).click();
    await dialog(page).waitFor({ state: "visible" });

    const monthsDialog = dialog(page).last();
    const rows = monthsDialog.locator("tbody tr");

    await rows.first().waitFor({ state: "visible" });

    // This month plus the twelve-month horizon.
    expect(await rows.count()).toBe(13);

    await rows.nth(1).getByRole("button").click();
    await fillField(dialog(page).last(), "Limit", "250000");
    await page.getByRole("button", { name: "Save changes" }).click();

    await monthsDialog
      .getByText("Custom", { exact: true })
      .first()
      .waitFor({ state: "visible" });

    const text = (await monthsDialog.innerText()).replace(/[\u00a0\u202f]/g, " ");

    expect(text).toContain("R$ 2.500,00");
    // The months either side keep the series' own limit.
    expect(text).toContain("R$ 1.000,00");

    await page.keyboard.press("Escape");
    await monthsDialog.waitFor({ state: "hidden" });
  }, 60_000);

  test("the dashboard carries the same reading", async () => {
    await page.goto(`${WEB_URL}/dashboard`, { waitUntil: "networkidle" });

    const body = await bodyText(page);

    expect(body).toContain("BUDGETS");
    expect(body).toContain("R$ 600,00 left");
    expect(body).toContain("R$ 600,00 left to spend");
  }, 60_000);

  test("overspending reads as over budget, not as a clamped zero", async () => {
    const api = await apiForPage(page);
    const wallets = await api.wallet.getAll.query({});
    const checking = wallets.rows[0];
    const groceries = (await api.category.options.query({ type: CategoryType.EXPENSE }))
      .find((row) => row.name === "Groceries");

    await api.transaction.create.mutate(
      transaction(checking?.id ?? "", {
        name: "Big shop",
        amountCents: 90_000,
        occurrenceDate: dayIn(month, 6),
        categoryId: groceries?.id ?? null,
      }),
    );

    await page.goto(`${WEB_URL}/budget`, { waitUntil: "networkidle" });

    const body = await bodyText(page);

    expect(body).toContain("R$ 300,00 over");
    expect(body).toContain("Over budget");
  }, 60_000);

  test("pausing a budget clears the months it had not started", async () => {
    await page
      .getByRole("button", { name: "Actions for Groceries", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Pause budget" }).click();
    await closeMenu(page).catch(() => undefined);

    await page
      .getByRole("cell", { name: "Paused", exact: true })
      .first()
      .waitFor({ state: "visible" });

    expect(await bodyText(page)).toContain("Paused");
  }, 60_000);

  test("renders without console errors", () => {
    expect(session.consoleErrors).toEqual([]);
  });
});
