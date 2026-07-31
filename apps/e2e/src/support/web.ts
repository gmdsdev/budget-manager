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
 * Data rows of the listing itself: `[data-list-table]` is the `DataTable`, so a
 * summary or breakdown table on the same page never inflates a count, and
 * `data-group-header` rows (one per date on the transaction list) are not rows
 * in any assertion's sense.
 */
const DATA_ROW_SELECTOR = "[data-list-table] tbody tr:not([data-group-header])";

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
 */
export async function rowTexts(page: Page) {
  return page.$$eval(DATA_ROW_SELECTOR, (trs) =>
    trs.map((tr) =>
      Array.from(tr.querySelectorAll("td")).map((td) =>
        (td as HTMLElement).innerText.replace(/[\u00a0\u202f]/g, " ").trim(),
      ),
    ),
  );
}

/**
 * The figures under the transaction list, keyed by their row label — each value
 * is one cell per column, so a single currency reads
 * `{ Expenses: [effective, projected] }`. The key comes from `textContent`, not
 * `innerText`: table headers are uppercased in CSS, which `innerText` reports.
 */
export async function summaryFigures(page: Page) {
  return page.$$eval("section[aria-label='Totals'] tbody tr", (trs) =>
    Object.fromEntries(
      trs.map((tr) => [
        (tr.querySelector("th")?.textContent ?? "").trim(),
        Array.from(tr.querySelectorAll("td")).map((td) =>
          (td as HTMLElement).innerText.replace(/[\u00a0\u202f]/g, " ").trim(),
        ),
      ]),
    ),
  );
}

export async function rowFor(page: Page, name: string) {
  const all = await rowTexts(page);

  return all.find((cells) => cells.includes(name));
}
