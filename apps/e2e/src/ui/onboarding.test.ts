import {
  Locale,
  type MessageKey,
  translate,
  type TranslateArgs,
} from "@budget-manager/i18n";
import { defaultCategoriesForLocale } from "@budget-manager/schemas";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Page } from "playwright";

import { requireWeb, WEB_URL } from "../support/env";
import {
  apiForPage,
  bodyText,
  closeApp,
  openApp,
  pickSelect,
  signUpFormOnly,
  type Session,
} from "../support/web";

let session: Session;
let page: Page;

beforeAll(async () => {
  await requireWeb();
  session = await openApp();
  page = session.page;
}, 60_000);

afterAll(async () => {
  await closeApp(session);
}, 30_000);

function pt<K extends MessageKey>(key: K, ...args: TranslateArgs<K>) {
  return translate(Locale.PT_BR, key, ...args);
}

function en<K extends MessageKey>(key: K, ...args: TranslateArgs<K>) {
  return translate(Locale.EN, key, ...args);
}

describe("onboarding", () => {
  test("a fresh sign-up is gated onto the flow and cannot leave before step one", async () => {
    await signUpFormOnly(page);

    expect(new URL(page.url()).pathname).toBe("/onboarding");
    await page
      .getByRole("heading", { name: en("onboarding.preferences.title") })
      .waitFor({ state: "visible", timeout: 20_000 });

    // The only step that cannot be skipped: no skip affordance exists yet.
    expect(
      await page
        .getByRole("button", { name: en("onboarding.skip"), exact: true })
        .count(),
    ).toBe(0);

    // The rest of the app stays behind the gate.
    await page.goto(`${WEB_URL}/dashboard`);
    await page.waitForURL((url) => url.pathname.startsWith("/onboarding"), {
      timeout: 20_000,
    });
  }, 60_000);

  test("saving Portuguese creates the Portuguese defaults and flips the app", async () => {
    await pickSelect(
      page,
      page,
      en("onboarding.preferences.language"),
      "Português (Brasil)",
    );
    await page
      .getByRole("button", {
        name: en("onboarding.preferences.submit"),
        exact: true,
      })
      .click();

    // Step two arrives already in the saved language.
    await page
      .getByRole("button", { name: pt("onboarding.skip"), exact: true })
      .waitFor({ state: "visible", timeout: 20_000 });
    expect(await bodyText(page)).toContain(pt("onboarding.wallets.title"));

    const api = await apiForPage(page);
    const options = await api.category.options.query({});
    const expected = defaultCategoriesForLocale(Locale.PT_BR);

    expect(new Set(options.map((row) => `${row.type}:${row.name}`))).toEqual(
      new Set(expected.map((row) => `${row.type}:${row.name}`)),
    );
  }, 60_000);

  test("skipping completes the flow and it never shows again", async () => {
    await page
      .getByRole("button", { name: pt("onboarding.skip"), exact: true })
      .click();
    await page.waitForURL((url) => !url.pathname.startsWith("/onboarding"), {
      timeout: 20_000,
    });

    await page.goto(`${WEB_URL}/onboarding`);
    await page.waitForURL((url) => !url.pathname.startsWith("/onboarding"), {
      timeout: 20_000,
    });
  }, 60_000);
});
