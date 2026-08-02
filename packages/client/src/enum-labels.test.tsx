import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import { useState } from "react";

import { Locale } from "@budget-manager/i18n";
import { I18nProvider, useTranslate } from "@budget-manager/i18n/react";
import { WalletType } from "@budget-manager/schemas";

import { useEnumLabels } from "./enum-labels";

function Subject() {
  const t = useTranslate();
  const labels = useEnumLabels();

  return (
    <dl>
      <dt>title</dt>
      <dd>{t("wallet.title")}</dd>
      <dt>empty</dt>
      <dd>{t("pagination.wallets.empty")}</dd>
      <dt>type</dt>
      <dd>{labels.walletType(WalletType.CHECKING)}</dd>
      <dt>currency</dt>
      <dd>{labels.currency("BRL")}</dd>
      <dt>unknown-currency</dt>
      <dd>{labels.currency("XXX")}</dd>
    </dl>
  );
}

/**
 * The provider passes `children` through, so React can bail out of re-rendering
 * a subtree whose element identity has not changed. Reading through the context
 * is what makes a language change actually reach the screen — a component that
 * called the module-scoped `t()` instead would keep its old words until
 * something else re-rendered it. That is what this pins.
 */
function Harness() {
  const [locale, setLocale] = useState(Locale.EN);

  return (
    <I18nProvider locale={locale}>
      <button type="button" onClick={() => setLocale(Locale.PT_BR)}>
        switch
      </button>
      <Subject />
    </I18nProvider>
  );
}

function valueOf(term: string) {
  return screen.getByText(term).nextElementSibling?.textContent;
}

describe("i18n in the tree", () => {
  test("renders the provider's locale", () => {
    render(
      <I18nProvider locale={Locale.PT_BR}>
        <Subject />
      </I18nProvider>,
    );

    expect(valueOf("title")).toBe("Carteiras");
    expect(valueOf("empty")).toBe("Nenhuma carteira");
    expect(valueOf("type")).toBe("Conta corrente");
  });

  test("changing the locale re-renders every consumer", () => {
    render(<Harness />);

    expect(valueOf("title")).toBe("Wallets");

    fireEvent.click(screen.getByRole("button", { name: "switch" }));

    expect(valueOf("title")).toBe("Carteiras");
    expect(valueOf("type")).toBe("Conta corrente");
  });
});

describe("useEnumLabels", () => {
  test("names a currency the app supports", () => {
    render(
      <I18nProvider locale={Locale.EN}>
        <Subject />
      </I18nProvider>,
    );

    expect(valueOf("currency")).toBe("BRL - Brazilian Real");
  });

  // Currency arrives from a plain `text` column, so an unrecognised code has to
  // read as itself rather than as a missing key.
  test("echoes a code it does not know", () => {
    render(
      <I18nProvider locale={Locale.EN}>
        <Subject />
      </I18nProvider>,
    );

    expect(valueOf("unknown-currency")).toBe("XXX");
  });
});
