import {
  Locale,
  type MessageKey,
  translate,
  type TranslateArgs,
} from "@budget-manager/i18n";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Page } from "playwright";

import { requireWeb, WEB_URL } from "../support/env";
import {
  bodyText,
  closeApp,
  dialog,
  openApp,
  pickSelect,
  signUpThroughUi,
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

/**
 * Asserted against the catalog rather than against copy pasted in here: a
 * translation may be reworded, but the *screen* has to keep matching the
 * catalog, and that is what this pins.
 */
function pt<K extends MessageKey>(key: K, ...args: TranslateArgs<K>) {
  return translate(Locale.PT_BR, key, ...args);
}

function en<K extends MessageKey>(key: K, ...args: TranslateArgs<K>) {
  return translate(Locale.EN, key, ...args);
}

/**
 * Headings, buttons and table headers are uppercased in CSS, which `innerText`
 * reports — so a catalog string never matches the page verbatim. Folding both
 * sides is what lets these assertions read as the copy rather than as SHOUTING.
 */
async function screenText() {
  return (await bodyText(page)).toLocaleLowerCase();
}

function says(text: string, expected: string) {
  return text.includes(expected.toLocaleLowerCase());
}

async function switchLanguage(triggerLabel: string, option: string) {
  await page.goto(`${WEB_URL}/settings/user`, { waitUntil: "networkidle" });
  await pickSelect(page, page, triggerLabel, option);
  await page.getByRole("button", { name: /save language|salvar idioma/i }).click();
}

describe("language", () => {
  test("a new account reads English", async () => {
    await page.goto(`${WEB_URL}/settings/user`, { waitUntil: "networkidle" });

    expect(says(await screenText(), en("settings.title"))).toBe(true);
    expect(says(await screenText(), en("settings.language.title"))).toBe(true);
  }, 30_000);

  test("switching to Portuguese translates the app in place", async () => {
    await switchLanguage(en("settings.language.label"), "Português (Brasil)");

    // The same elements re-render; nothing reloads.
    await page
      .getByRole("heading", { name: pt("settings.title") })
      .waitFor({ state: "visible" });

    const text = await screenText();

    expect(says(text, pt("settings.profile.title"))).toBe(true);
    expect(says(text, pt("settings.defaults.title"))).toBe(true);
    expect(says(text, pt("settings.defaults.currencyHint"))).toBe(true);
    expect(says(text, en("settings.defaults.currencyHint"))).toBe(false);
  }, 30_000);

  test("the nav, the page and its empty state follow", async () => {
    await page.goto(`${WEB_URL}/wallet`, { waitUntil: "networkidle" });

    const text = await screenText();

    expect(says(text, pt("nav.transactions"))).toBe(true);
    expect(says(text, pt("wallet.title"))).toBe(true);
    expect(says(text, pt("wallet.create.trigger"))).toBe(true);
    // "Nenhuma carteira ainda" — the gendered empty state the per-resource
    // pagination keys exist for.
    expect(says(text, pt("wallet.empty.title"))).toBe(true);
    expect(says(text, pt("pagination.wallets.empty"))).toBe(true);
  }, 30_000);

  test("the choice rides on the account, so a reload keeps it", async () => {
    await page.reload({ waitUntil: "networkidle" });

    expect(says(await screenText(), pt("wallet.title"))).toBe(true);
    expect(await page.getAttribute("html", "lang")).toBe(Locale.PT_BR);
  }, 30_000);

  test("shared Zod messages resolve in the chosen language", async () => {
    await page
      .getByRole("button", { name: pt("wallet.create.trigger") })
      .click();
    await dialog(page).waitFor({ state: "visible" });

    // An empty name is refused by the same schema the server validates with;
    // its messages resolve when the form validates, not when it was defined.
    await dialog(page)
      .getByRole("button", { name: pt("wallet.create.submit") })
      .click();

    await dialog(page)
      .getByText(pt("validation.nameRequired"))
      .first()
      .waitFor({ state: "visible" });

    await page.keyboard.press("Escape");
  }, 30_000);

  test("switching back restores English", async () => {
    await switchLanguage(pt("settings.language.label"), "English");

    await page
      .getByRole("heading", { name: en("settings.title") })
      .waitFor({ state: "visible" });

    expect(await page.getAttribute("html", "lang")).toBe(Locale.EN);
  }, 30_000);

  test("no console errors along the way", () => {
    expect(session.consoleErrors).toEqual([]);
  });
});
