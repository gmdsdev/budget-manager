import { TransactionKind, TransactionStatus } from "@budget-manager/schemas";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Page } from "playwright";

import { WEB_URL, requireWeb } from "../support/env";
import { dayThisMonth, seedBasics, transaction } from "../support/fixtures";
import {
  closeApp,
  apiForPage,
  openApp,
  pickSelect,
  rowTexts,
  signUpThroughUi,
  waitForRowCount,
  type Session,
} from "../support/web";

const PAGE_SIZE = 20;
const EXPENSES = 25;
const INCOMES = 2;

let session: Session;
let page: Page;

function summary() {
  return page.getByTestId("pagination-summary");
}

beforeAll(async () => {
  await requireWeb();
  session = await openApp();
  page = session.page;
  await signUpThroughUi(page);

  const api = await apiForPage(page);
  const seed = await seedBasics(api);

  for (let index = 0; index < EXPENSES; index++) {
    await api.transaction.create.mutate(
      transaction(seed.checking.id, {
        name: `Expense ${index}`,
        amountCents: (index + 1) * 100,
        occurrenceDate: dayThisMonth(index + 1),
        categoryId: seed.groceries.id,
        status: TransactionStatus.PAID,
      }),
    );
  }

  for (let index = 0; index < INCOMES; index++) {
    await api.transaction.create.mutate(
      transaction(seed.checking.id, {
        kind: TransactionKind.INCOME,
        name: `Income ${index}`,
        amountCents: 500_000,
        occurrenceDate: dayThisMonth(index + 26),
        categoryId: seed.salary.id,
      }),
    );
  }
}, 120_000);

afterAll(async () => {
  await closeApp(session);
}, 30_000);

describe("transaction pagination", () => {
  test("caps the first page and states the true total", async () => {
    await page.goto(`${WEB_URL}/transaction`, { waitUntil: "networkidle" });
    await waitForRowCount(page, PAGE_SIZE);

    // The old behaviour showed a silently truncated list with no total at all.
    expect(await summary().isVisible()).toBe(true);
    expect(await summary().innerText()).toBe(
      `Showing 1–${PAGE_SIZE} of ${EXPENSES + INCOMES} transactions`,
    );
    expect(await page.getByText("Page 1 of 2").count()).toBe(1);
  }, 60_000);

  test("Previous is disabled on the first page", async () => {
    expect(
      await page.getByRole("button", { name: "Previous" }).isDisabled(),
    ).toBe(true);
  }, 60_000);

  test("Next shows the remainder and disables at the end", async () => {
    const firstPageIds = (await rowTexts(page)).map((cells) => cells[1]);

    await page.getByRole("button", { name: "Next" }).click();
    await waitForRowCount(page, EXPENSES + INCOMES - PAGE_SIZE);

    expect(await summary().innerText()).toBe(
      `Showing ${PAGE_SIZE + 1}–${EXPENSES + INCOMES} of ${
        EXPENSES + INCOMES
      } transactions`,
    );

    const secondPageIds = (await rowTexts(page)).map((cells) => cells[1]);

    // No row may appear on both pages.
    expect(secondPageIds.some((name) => firstPageIds.includes(name))).toBe(
      false,
    );

    expect(await page.getByRole("button", { name: "Next" }).isDisabled()).toBe(
      true,
    );
    expect(
      await page.getByRole("button", { name: "Previous" }).isDisabled(),
    ).toBe(false);
  }, 60_000);

  test("Previous returns to the first page", async () => {
    await page.getByRole("button", { name: "Previous" }).click();
    await waitForRowCount(page, PAGE_SIZE);

    expect(await page.getByText("Page 1 of 2").count()).toBe(1);
  }, 60_000);

  test("filtering from a later page resets to page 1", async () => {
    await page.getByRole("button", { name: "Next" }).click();
    await waitForRowCount(page, EXPENSES + INCOMES - PAGE_SIZE);
    expect(await page.getByText("Page 2 of 2").count()).toBe(1);

    // Income has only 2 rows, so page 2 would not exist. Without the reset the
    // user would be stranded looking at an empty table.
    await pickSelect(page, page, "Kind", "Income");
    await waitForRowCount(page, INCOMES);

    expect(await summary().innerText()).toBe(
      `Showing 1–${INCOMES} of ${INCOMES} transactions`,
    );
    expect(await page.getByText("Page 1 of", { exact: false }).count()).toBe(0);
  }, 60_000);

  test("a filter matching nothing reports no rows rather than a blank page", async () => {
    await pickSelect(page, page, "Status", "Cancelled");
    await page.getByText("No transactions match these filters").waitFor({
      state: "visible",
      timeout: 15_000,
    });

    expect(await summary().innerText()).toBe("No transactions");
  }, 60_000);

  test("no console or page errors", () => {
    expect(session.consoleErrors).toEqual([]);
  });
});
