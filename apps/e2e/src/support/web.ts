import {
  chromium,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
} from "playwright";
import { createClient } from "./api";
import { WEB_URL } from "./env";

export type Session = {
  context: BrowserContext;
  page: Page;
  consoleErrors: string[];
};

/**
 * One Chromium for the whole run, with an isolated context per suite. Launching
 * a browser per suite file starved the machine badly enough that page loads
 * timed out; contexts give the same cookie isolation for a fraction of the cost.
 */
let browserPromise: Promise<Browser> | null = null;

function sharedBrowser() {
  browserPromise ??= chromium.launch();

  return browserPromise;
}

const IGNORED_CONSOLE = /favicon|Download the React DevTools|autocomplete/i;

export async function openApp(): Promise<Session> {
  const browser = await sharedBrowser();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  // Four browser suites plus a dev server on one machine: generous ceilings so a
  // load spike shows up as a slow test rather than a false failure.
  page.setDefaultTimeout(30_000);
  page.setDefaultNavigationTimeout(60_000);

  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error" && !IGNORED_CONSOLE.test(message.text())) {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(`pageerror: ${error.message}`);
  });

  return { context, page, consoleErrors };
}

export async function closeApp(session: Session | undefined) {
  await session?.context.close();
}

/** Signs up through the real form so the app owns its own session cookie. */
export async function signUpThroughUi(page: Page) {
  const email = `ui-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

  await page.goto(`${WEB_URL}/login`, { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: /Need an account\? Sign Up|Sign Up/i })
    .first()
    .click();

  await page.locator("#name").fill("UI Verify");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("SuperSecret123!");
  await page.getByRole("button", { name: "Sign Up", exact: true }).click();

  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 20_000,
  });

  return email;
}

/**
 * "Today" as the *browser* reckons it, for seeding rows a page has to show.
 *
 * `bun test` pins the test process to UTC while Chromium keeps the machine's
 * own zone, so for the hours those two straddle a date boundary a row seeded
 * from the test's clock lands on a different day than the one the page is
 * showing — and on the last day of a month it lands in the next month, which
 * empties the transaction list (always scoped to the browser's current month)
 * and zeroes the dashboard. It is the same disagreement `shiftMonthKey` exists
 * to dodge; here the consumer is the browser, so the browser's clock is the one
 * to anchor on.
 *
 * The returned `Date` reads back the same year, month and day through the local
 * getters the fixtures use, which is what makes it safe to hand to
 * `dayThisMonth`/`dayLastMonth`.
 */
export async function todayInPage(page: Page): Promise<Date> {
  const [year, monthIndex, day] = await page.evaluate(() => {
    const now = new Date();

    return [now.getFullYear(), now.getMonth(), now.getDate()];
  });

  return new Date(year ?? 0, monthIndex ?? 0, day ?? 1);
}

/** The browser's own `YYYY-MM-DD`, for a row that must be dated exactly today. */
export async function todayIsoInPage(page: Page): Promise<string> {
  const today = await todayInPage(page);
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
}

/**
 * An API client bound to the browser's own session, for seeding data as the
 * signed-in user when a test is about rendering rather than form filling.
 */
export async function apiForPage(page: Page) {
  const cookies = await page.context().cookies();
  const cookie = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  if (!cookie) throw new Error("page has no cookies; sign in first");

  return createClient(cookie);
}

/** Closes an open dropdown and waits for it to leave the DOM. */
export async function closeMenu(page: Page) {
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => document.querySelectorAll('[role="menuitem"]').length === 0,
    undefined,
    { timeout: 10_000 },
  );
}

export function dialog(page: Page) {
  return page.getByRole("dialog");
}

/**
 * The transaction page leads with one primary action — `Create Transaction` —
 * and keeps the rarer shapes behind its caret, so opening a card purchase, a
 * card payment or a transfer means going through the menu rather than looking
 * for a peer button.
 */
export async function openCreateDialog(page: Page, item: string) {
  await page.getByRole("button", { name: "More transaction types" }).click();
  await page.getByRole("menuitem", { name: item, exact: true }).click();
  await dialog(page).waitFor({ state: "visible" });

  return dialog(page);
}

/**
 * The transaction list carries no row menu: the row itself opens a detail
 * dialog, and every action on the record lives inside it. This is the way in to
 * all of them, so a suite never reaches for a per-row trigger that is not there.
 *
 * Located by `[data-list-row]` rather than by the row's accessible name: the
 * name is a translated message wrapped in typographic quotes, which a test
 * should not have to spell.
 */
export async function openTransaction(page: Page, name: string) {
  return openRecord(page, name);
}

/**
 * The same way in for every other listing — wallets, cards, budgets,
 * categories — none of which carries a row menu either. It is markup-driven
 * rather than per-screen: `[data-list-row]` is one record on all of them, so
 * this is the one helper any of those suites needs, and the actions inside are
 * plain buttons rather than menu items.
 */
export async function openRecord(page: Page, name: string) {
  await page
    .locator("[data-list-row]")
    .filter({ hasText: name })
    .first()
    .click();
  await dialog(page).waitFor({ state: "visible" });

  return dialog(page);
}

/**
 * A detail-dialog action that opens a second dialog: the detail view closes as
 * the next one opens, so waiting on `dialog(page)` alone can match either. Wait
 * on the heading the new dialog is known by instead.
 */
export async function openFromDetail(
  page: Page,
  action: string,
  heading: string,
) {
  await dialog(page).getByRole("button", { name: action, exact: true }).click();
  await page
    .getByRole("heading", { name: heading })
    .waitFor({ state: "visible", timeout: 10_000 });

  return dialog(page);
}

/**
 * Base UI renders the select popup in a portal, so the option lookup is
 * page-wide while the trigger lookup is scoped to `root`. Label text repeats
 * between the filter bar and the dialogs, hence the explicit scope.
 */
/**
 * Base UI's Checkbox renders a span[role=checkbox] alongside a hidden input, so
 * a label lookup matches twice. Drive the ARIA one.
 */
export async function setCheckbox(
  scope: Locator,
  label: string,
  checked: boolean,
) {
  await scope.getByRole("checkbox", { name: label }).setChecked(checked);
}

export async function pickSelect(
  page: Page,
  root: Page | Locator,
  triggerLabel: string,
  optionText: string,
) {
  await root.getByLabel(triggerLabel, { exact: true }).click();
  await page.getByRole("option", { name: optionText, exact: true }).click();
}

export async function fillField(
  root: Page | Locator,
  label: string,
  value: string,
) {
  await root.getByLabel(label, { exact: true }).fill(value);
}

/**
 * The transaction list is always scoped to a date range, so a suite whose rows
 * sit outside the current month has to widen it first.
 */
export async function pickDateRangePreset(page: Page, preset: string) {
  await page.getByLabel("Date range", { exact: true }).click();
  await page.getByRole("button", { name: preset, exact: true }).click();
  await page
    .getByRole("button", { name: preset, exact: true })
    .waitFor({ state: "hidden" });
}

/** Whole-page text with Intl's non-breaking spaces flattened. */
export async function bodyText(page: Page) {
  const raw = await page.locator("body").innerText();

  return raw.replace(/[\u00a0\u202f]/g, " ");
}

/**
 * Data rows of the listing itself. `[data-list-table]` marks the listing —
 * whether it draws as a `DataTable`'s `<table>`, that table's card fallback, or
 * the transaction ledger's row list — so a summary or breakdown table on the
 * same page never inflates a count. `[data-list-row]` is one record in any of
 * those three, which is what keeps the helpers independent of the markup: a
 * `data-group-header` (one per date) carries no such marker and so is not a row
 * in any assertion's sense.
 */
const DATA_ROW_SELECTOR = "[data-list-table] [data-list-row]";

export function rows(page: Page) {
  return page.locator(DATA_ROW_SELECTOR);
}

/** Waits on a row count rather than sleeping, so the suite is not timing-bound. */
export async function waitForRowCount(page: Page, expected: number) {
  await page.waitForFunction(
    ({ count, selector }) =>
      document.querySelectorAll(selector).length === count,
    { count: expected, selector: DATA_ROW_SELECTOR },
    { timeout: 15_000 },
  );
}

/**
 * Cell text with non-breaking spaces flattened — Intl money formatting uses
 * U+00A0/U+202F, which silently defeats assertions written with a plain space.
 *
 * `[data-list-cell]` is the field marker, so a row reads the same whether it
 * draws as a `<tr>` of `<td>`s or as a list row: the first cell is always the
 * record's name, which is what `cells[0]` assertions rely on.
 */
export async function rowTexts(page: Page) {
  return page.$$eval(DATA_ROW_SELECTOR, (rows) =>
    rows.map((tr) =>
      Array.from(tr.querySelectorAll("[data-list-cell]")).map((td) =>
        (td as HTMLElement).innerText.replace(/[\u00a0\u202f]/g, " ").trim(),
      ),
    ),
  );
}

/**
 * The figures under the transaction list, keyed by figure rather than by label —
 * `{ expenses: [effective, projected] }`. The panel states what is still waiting
 * rather than a projected column, so both figures are read off `data-summary-*`:
 * an assertion about a number has no business breaking when a subline is
 * reworded.
 *
 * Only the currency in view is in the DOM — the panel opens on the account's
 * preferred currency and switches client-side.
 */
export async function summaryFigures(page: Page) {
  return page.$$eval(
    "section[aria-label='Totals'] [data-summary-figure]",
    (nodes) =>
      Object.fromEntries(
        nodes.map((node) => [
          node.getAttribute("data-summary-figure") ?? "",
          ["data-summary-effective", "data-summary-projected"].map((name) =>
            (node.getAttribute(name) ?? "")
              .replace(/[\u00a0\u202f]/g, " ")
              .trim(),
          ),
        ]),
      ),
  );
}

/**
 * Waits until one summary figure reads the expected pair. The row count is not
 * enough on its own: the totals are a query of their own, and a filter key the
 * page has fetched before is served from cache while the refetch is still in
 * flight — reading immediately gets the figures as they stood the last time
 * that filter was applied.
 */
export async function waitForSummaryFigure(
  page: Page,
  figure: string,
  expected: [effective: string, projected: string],
) {
  await page.waitForFunction(
    ([figureName, effective, projected]) => {
      const node = document.querySelector(
        `section[aria-label='Totals'] [data-summary-figure='${figureName}']`,
      );
      const read = (name: string) =>
        (node?.getAttribute(name) ?? "").replace(/[\u00a0\u202f]/g, " ").trim();

      return (
        read("data-summary-effective") === effective &&
        read("data-summary-projected") === projected
      );
    },
    [figure, ...expected] as const,
    { timeout: 15_000 },
  );
}

export async function rowFor(page: Page, name: string) {
  const all = await rowTexts(page);

  return all.find((cells) => cells.includes(name));
}
