import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import { DEFAULT_LOCALE, formatDateString } from "@budget-manager/i18n";
import type { TransactionSummaryRow } from "@budget-manager/client";
import { TransactionSummary } from "./transaction-summary";

function summaryRow(
  overrides: Partial<TransactionSummaryRow> = {},
): TransactionSummaryRow {
  return {
    currencyCode: "BRL",
    balanceCents: 100_000,
    projectedBalanceCents: 90_000,
    incomeCents: 500_000,
    projectedIncomeCents: 550_000,
    expenseCents: 25_000,
    projectedExpenseCents: 35_000,
    netCents: 475_000,
    projectedNetCents: 515_000,
    ...overrides,
  };
}

/** Intl separates money with U+00A0, which a plain space never matches. */
function flatten(value: string | null) {
  return (value ?? "").replace(/[\u00a0\u202f]/g, " ");
}

function figure(name: string) {
  const node = document.querySelector(`[data-summary-figure="${name}"]`);

  return {
    effective: flatten(node?.getAttribute("data-summary-effective") ?? null),
    projected: flatten(node?.getAttribute("data-summary-projected") ?? null),
    text: flatten(node?.textContent ?? null),
  };
}

function panelText() {
  return flatten(screen.getByRole("region", { name: "Totals" }).textContent);
}

describe("TransactionSummary", () => {
  test("leads with the balance and carries each figure's projection", () => {
    render(
      <TransactionSummary
        currencies={[summaryRow()]}
        rangeTo="2026-07-31"
        total={52}
      />,
    );

    expect(figure("wallets")).toMatchObject({
      effective: "R$ 1.000,00",
      projected: "R$ 900,00",
    });
    expect(figure("income")).toMatchObject({
      effective: "R$ 5.000,00",
      projected: "R$ 5.500,00",
    });
    expect(figure("expenses")).toMatchObject({
      effective: "R$ 250,00",
      projected: "R$ 350,00",
    });
    expect(figure("net")).toMatchObject({
      effective: "R$ 4.750,00",
      projected: "R$ 5.150,00",
    });
  });

  test("states what is still waiting rather than a projected column", () => {
    render(
      <TransactionSummary
        currencies={[summaryRow()]}
        rangeTo="2026-07-31"
        total={52}
      />,
    );

    // 5.500,00 projected less 5.000,00 settled.
    expect(figure("income").text).toContain("R$ 500,00 waiting");
    expect(figure("expenses").text).toContain("R$ 100,00 waiting");
  });

  test("says so when a figure has nothing outstanding", () => {
    render(
      <TransactionSummary
        currencies={[
          summaryRow({ incomeCents: 500_000, projectedIncomeCents: 500_000 }),
        ]}
        rangeTo="2026-07-31"
        total={1}
      />,
    );

    expect(figure("income").text).toContain("Fully settled");
  });

  test("reads the pending balance as a magnitude, whichever way it moves", () => {
    render(
      <TransactionSummary
        currencies={[summaryRow()]}
        rangeTo="2026-07-31"
        total={52}
      />,
    );

    // The projection is 100,00 lower than the settled balance, so the amount
    // still waiting must not read as a negative figure.
    expect(figure("wallets").text).toContain(
      "R$ 900,00 projected · R$ 100,00 still waiting",
    );
  });

  test("counts the rows the figures cover and the day they are read as of", () => {
    render(
      <TransactionSummary
        currencies={[summaryRow()]}
        rangeTo="2026-07-31"
        total={52}
      />,
    );

    const asOf = formatDateString(DEFAULT_LOCALE, "2026-07-31", "numeric");

    expect(panelText()).toContain(`52 transactions · through ${asOf}`);
  });

  test("shows one currency at a time, switched by its own control", () => {
    render(
      <TransactionSummary
        currencies={[
          summaryRow(),
          summaryRow({
            currencyCode: "USD",
            balanceCents: 20_000,
            projectedBalanceCents: 20_000,
          }),
        ]}
        rangeTo="2026-07-31"
        total={52}
      />,
    );

    expect(figure("wallets").effective).toBe("R$ 1.000,00");

    fireEvent.click(screen.getByRole("button", { name: "USD" }));

    expect(figure("wallets").effective).toBe("$200.00");
  });

  test("opens on the account's preferred currency when it is held", () => {
    render(
      <TransactionSummary
        currencies={[summaryRow(), summaryRow({ currencyCode: "USD" })]}
        rangeTo="2026-07-31"
        total={52}
        preferredCurrency="USD"
      />,
    );

    expect(
      screen.getByRole("button", { name: "USD" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(figure("wallets").effective).toBe("$1,000.00");
  });

  test("has no currency control for a single-currency account", () => {
    render(
      <TransactionSummary
        currencies={[summaryRow()]}
        rangeTo="2026-07-31"
        total={52}
      />,
    );

    expect(screen.queryByRole("button", { name: "BRL" })).toBeNull();
  });

  test("renders nothing when the user holds no currency yet", () => {
    const { container } = render(
      <TransactionSummary currencies={[]} rangeTo="2026-07-31" total={0} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
