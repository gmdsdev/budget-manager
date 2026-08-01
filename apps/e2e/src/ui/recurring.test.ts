import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Page } from "playwright";

import { WEB_URL, requireWeb } from "../support/env";
import {
  closeApp,
  closeMenu,
  dialog,
  fillField,
  openApp,
  pickDateRangePreset,
  pickSelect,
  rowFor,
  rowTexts,
  setCheckbox,
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

describe("recurrence lives on the transaction form", () => {
  test("there is no separate recurring screen in the nav", async () => {
    await page.goto(`${WEB_URL}/transaction`, { waitUntil: "networkidle" });

    // A repeating transaction is a transaction, not its own section.
    expect(await page.getByRole("link", { name: "Recurring" }).count()).toBe(0);
  }, 60_000);

  test("a plain transaction stays a one-off", async () => {
    await page.getByRole("button", { name: "Create Transaction" }).click();
    await dialog(page).waitFor({ state: "visible" });
    await fillField(dialog(page), "Description", "Coffee");
    await pickSelect(page, dialog(page), "Wallet", "Checking");
    await fillField(dialog(page), "Amount", "1500");
    await page.getByRole("button", { name: "Create transaction" }).click();
    await dialog(page).waitFor({ state: "hidden", timeout: 10_000 });

    await waitForRowCount(page, 1);

    expect(await rowFor(page, "Coffee")).toContain("One-off");
  }, 60_000);

  test("the recurrence fields stay hidden until the checkbox is ticked", async () => {
    await page.getByRole("button", { name: "Create Transaction" }).click();
    await dialog(page).waitFor({ state: "visible" });

    expect(
      await dialog(page).getByLabel("Recurrence type", { exact: true }).count(),
    ).toBe(0);

    await setCheckbox(dialog(page), "Enable recurrence", true);

    // Monthly by default: a type and an interval, and no end date to fill in —
    // an open-ended series is bounded by the derived 50-year end.
    expect(
      await dialog(page).getByLabel("Recurrence type", { exact: true }).count(),
    ).toBe(1);
    expect(await dialog(page).getByLabel("Every", { exact: true }).count()).toBe(
      1,
    );
    expect(
      await dialog(page).getByLabel("Repeat until", { exact: true }).count(),
    ).toBe(0);
    expect(
      await dialog(page).getByLabel("Ends on", { exact: true }).count(),
    ).toBe(0);

    await pickSelect(
      page,
      dialog(page),
      "Recurrence type",
      "Fixed installments",
    );

    // A fixed series is the one shape that carries a bound of its own.
    expect(
      await dialog(page).getByLabel("Installments", { exact: true }).count(),
    ).toBe(1);

    await setCheckbox(dialog(page), "Enable recurrence", false);

    expect(
      await dialog(page).getByLabel("Recurrence type", { exact: true }).count(),
    ).toBe(0);

    await page.keyboard.press("Escape");
    await dialog(page).waitFor({ state: "hidden" });
  }, 60_000);

  test("adding a schedule turns the same form into a series", async () => {
    await page.getByRole("button", { name: "Create Transaction" }).click();
    await dialog(page).waitFor({ state: "visible" });
    await fillField(dialog(page), "Description", "Sofa");
    await pickSelect(page, dialog(page), "Wallet", "Checking");
    await fillField(dialog(page), "Amount", "60000");
    await setCheckbox(dialog(page), "Enable recurrence", true);
    await pickSelect(
      page,
      dialog(page),
      "Recurrence type",
      "Fixed installments",
    );
    await fillField(dialog(page), "Installments", "6");

    // The submit label reflects what will actually be created.
    await page.getByRole("button", { name: "Create series" }).click();
    await dialog(page).waitFor({ state: "hidden", timeout: 10_000 });

    // The list opens on the current month; the series runs past it.
    await pickDateRangePreset(page, "Next 12 months");

    // Six scheduled rows plus the earlier one-off, all in one list.
    await waitForRowCount(page, 7);

    const cells = (await rowTexts(page)).flat();

    expect(cells).toContain("6× monthly");
    expect(cells).toContain("One-off");
  }, 60_000);

  test("recurring and one-off rows sit side by side in the ledger", async () => {
    const rows = await rowTexts(page);
    const oneOff = rows.filter((cells) => cells.includes("One-off")).length;
    const series = rows.filter((cells) => cells.includes("6× monthly")).length;

    expect(oneOff).toBe(1);
    expect(series).toBe(6);
  }, 60_000);

  test("a series row offers series actions; a one-off does not", async () => {
    await page.getByRole("button", { name: "Actions for Sofa" }).first().click();
    await page
      .getByRole("menuitem", { name: "Edit series" })
      .waitFor({ state: "visible" });

    const seriesItems = await page.getByRole("menuitem").allInnerTexts();

    expect(seriesItems).toContain("Edit series");
    expect(seriesItems).toContain("Pause series");
    expect(seriesItems).toContain("Delete series");

    // Wait for the menu to actually go away: reading too early returns the
    // previous menu's items.
    await closeMenu(page);

    await page.getByRole("button", { name: "Actions for Coffee" }).click();
    await page
      .getByRole("menuitem", { name: "Edit" })
      .first()
      .waitFor({ state: "visible" });

    const oneOffItems = await page.getByRole("menuitem").allInnerTexts();

    expect(oneOffItems).not.toContain("Edit series");

    await closeMenu(page);
  }, 60_000);

  test("editing the series from a row re-prices its scheduled rows", async () => {
    await page.getByRole("button", { name: "Actions for Sofa" }).first().click();
    await page
      .getByRole("menuitem", { name: "Edit series" })
      .waitFor({ state: "visible" });
    await page.getByRole("menuitem", { name: "Edit series" }).click();
    await dialog(page).waitFor({ state: "visible" });
    await fillField(dialog(page), "Amount", "90000");
    await page.getByRole("button", { name: "Save changes" }).click();
    await dialog(page).waitFor({ state: "hidden", timeout: 10_000 });

    await page.reload({ waitUntil: "networkidle" });
    await pickDateRangePreset(page, "Next 12 months");
    await waitForRowCount(page, 7);

    const cells = (await rowTexts(page)).flat();

    expect(cells.some((cell) => cell.includes("900,00"))).toBe(true);
  }, 60_000);

  test("deleting the series asks first, then leaves the one-off behind", async () => {
    await page.getByRole("button", { name: "Actions for Sofa" }).first().click();
    await page
      .getByRole("menuitem", { name: "Delete series" })
      .waitFor({ state: "visible" });
    await page.getByRole("menuitem", { name: "Delete series" }).click();

    // Dropping a rule and every occurrence still ahead of today is the most
    // destructive thing in the app, so it is confirmed like the rest of them.
    const confirm = page.getByRole("alertdialog");

    await confirm.waitFor({ state: "visible" });
    // Titles and buttons are uppercased in CSS, and innerText reports that.
    expect((await confirm.innerText()).toLowerCase()).toContain(
      "delete “sofa”?",
    );

    await confirm.getByRole("button", { name: "Delete series" }).click();

    // Every scheduled row goes, including the one dated today, which was
    // still unpaid.
    await waitForRowCount(page, 1);

    expect(await rowFor(page, "Coffee")).toContain("One-off");
  }, 60_000);

  test("no console or page errors", () => {
    expect(session.consoleErrors).toEqual([]);
  });
});
