import { WalletCurrency, WalletType } from "@budget-manager/schemas";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Page } from "playwright";

import { requireWeb, WEB_URL } from "../support/env";
import { card, transaction, wallet } from "../support/fixtures";
import {
  apiForPage,
  closeApp,
  fillField,
  openApp,
  pickSelect,
  rows,
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

  const api = await apiForPage(page);

  const [checking, euro] = await Promise.all([
    api.wallet.create.mutate(wallet({ name: "Checking" })),
    api.wallet.create.mutate(
      wallet({
        name: "Euro Savings",
        type: WalletType.SAVINGS,
        currencyCode: WalletCurrency.EUR,
      }),
    ),
  ]);

  await Promise.all([
    api.creditCard.create.mutate(
      card({ name: "Billed Visa", defaultBillingWalletId: checking.id }),
    ),
    api.creditCard.create.mutate(
      card({ name: "Unbilled Master", defaultBillingWalletId: null }),
    ),
    api.transaction.create.mutate(
      transaction(checking.id, { name: "Zebra Rent" }),
    ),
    api.transaction.create.mutate(
      transaction(euro.id, { name: "Coffee Beans" }),
    ),
  ]);
}, 60_000);

afterAll(async () => {
  await closeApp(session);
}, 30_000);

/** Every filter bar sits above the table, so the first cell names the row. */
async function firstCells() {
  return (await rowTexts(page)).map((cells) => cells[0]);
}

describe("wallet filters", () => {
  beforeAll(async () => {
    await page.goto(`${WEB_URL}/wallet`, { waitUntil: "networkidle" });
    await waitForRowCount(page, 2);
  }, 60_000);

  test("narrows by name as typing settles", async () => {
    await fillField(page, "Name", "euro");
    await waitForRowCount(page, 1);

    expect(await firstCells()).toEqual(["Euro Savings"]);
  });

  test("clears back to every wallet", async () => {
    await page.getByRole("button", { name: "Clear filters" }).click();
    await waitForRowCount(page, 2);
  });

  test("narrows by type", async () => {
    await pickSelect(page, page, "Type", "Savings");
    await waitForRowCount(page, 1);

    expect(await firstCells()).toEqual(["Euro Savings"]);

    await page.getByRole("button", { name: "Clear filters" }).click();
    await waitForRowCount(page, 2);
  });

  test("narrows by currency", async () => {
    await pickSelect(page, page, "Currency", "EUR - Euro");
    await waitForRowCount(page, 1);

    expect(await firstCells()).toEqual(["Euro Savings"]);

    await page.getByRole("button", { name: "Clear filters" }).click();
    await waitForRowCount(page, 2);
  });
});

describe("credit card filters", () => {
  beforeAll(async () => {
    await page.goto(`${WEB_URL}/credit-card`, { waitUntil: "networkidle" });
    await waitForRowCount(page, 2);
  }, 60_000);

  test("narrows to the cards with no billing wallet", async () => {
    await pickSelect(page, page, "Billing wallet", "No billing wallet");
    await waitForRowCount(page, 1);

    expect(await firstCells()).toEqual(["Unbilled Master"]);
  });

  test("narrows to a specific billing wallet", async () => {
    await pickSelect(page, page, "Billing wallet", "Checking");
    await waitForRowCount(page, 1);

    expect(await firstCells()).toEqual(["Billed Visa"]);

    await page.getByRole("button", { name: "Clear filters" }).click();
    await waitForRowCount(page, 2);
  });
});

describe("transaction filters", () => {
  beforeAll(async () => {
    await page.goto(`${WEB_URL}/transaction`, { waitUntil: "networkidle" });
    await waitForRowCount(page, 2);
  }, 60_000);

  test("narrows by description", async () => {
    await fillField(page, "Description", "zebra");
    await waitForRowCount(page, 1);

    expect((await rowTexts(page)).flat()).toContain("Zebra Rent");

    await page.getByRole("button", { name: "Clear filters" }).click();
    await waitForRowCount(page, 2);
  });

  test("narrows by the account that owns the row", async () => {
    await pickSelect(page, page, "Account", "Euro Savings");
    await waitForRowCount(page, 1);

    expect((await rowTexts(page)).flat()).toContain("Coffee Beans");

    await page.getByRole("button", { name: "Clear filters" }).click();
    await waitForRowCount(page, 2);
  });

  test("narrows to one-off rows", async () => {
    await pickSelect(page, page, "Repeats", "One-off");
    await waitForRowCount(page, 2);

    await page.getByRole("button", { name: "Clear filters" }).click();
    await waitForRowCount(page, 2);
  });
});

describe("the bar carries no visible labels", () => {
  test("every filter names its column through the control itself", async () => {
    for (const path of ["/wallet", "/category", "/credit-card", "/transaction"]) {
      await page.goto(`${WEB_URL}${path}`, { waitUntil: "networkidle" });
      await rows(page).first().waitFor({ state: "visible" });

      // Dialog forms keep their labels; the bar sits outside every dialog.
      const barLabels = await page
        .locator("label:not([role=dialog] label)")
        .count();

      expect(barLabels).toBe(0);
    }
  }, 60_000);

  test("an unfiltered select reads as the column name", async () => {
    await page.goto(`${WEB_URL}/transaction`, { waitUntil: "networkidle" });
    await waitForRowCount(page, 2);

    expect(
      await page.getByLabel("Category", { exact: true }).innerText(),
    ).toContain("Category");

    await pickSelect(page, page, "Category", "Uncategorized");

    expect(
      await page.getByLabel("Category", { exact: true }).innerText(),
    ).toContain("Uncategorized");

    await page.getByRole("button", { name: "Clear filters" }).click();
    await waitForRowCount(page, 2);
  }, 60_000);
});

describe("console hygiene", () => {
  test("no console or page errors across every filter bar", () => {
    expect(session.consoleErrors).toEqual([]);
  });
});
