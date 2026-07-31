import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import { DEFAULT_LOCALE, formatDateString } from "@budget-manager/i18n";
import type { TransactionSummaryRow } from "../../types";
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

function cellsOf(label: string) {
  const row = screen.getByRole("rowheader", { name: label }).closest("tr");

  return Array.from(row?.querySelectorAll("td") ?? []).map((cell) =>
    flatten(cell.textContent),
  );
}

describe("TransactionSummary", () => {
  test("puts effective and projected side by side for each figure", () => {
    render(
      <TransactionSummary currencies={[summaryRow()]} rangeTo="2026-07-31" />,
    );

    expect(cellsOf("In wallets")).toEqual(["R$ 1.000,00", "R$ 900,00"]);
    expect(cellsOf("Income")).toEqual(["R$ 5.000,00", "R$ 5.500,00"]);
    expect(cellsOf("Expenses")).toEqual(["R$ 250,00", "R$ 350,00"]);
    expect(cellsOf("Net")).toEqual(["R$ 4.750,00", "R$ 5.150,00"]);
  });

  test("gives each currency its own column pair", () => {
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
      />,
    );

    expect(screen.getByRole("columnheader", { name: "BRL" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "USD" })).toBeDefined();
    expect(cellsOf("In wallets")).toEqual([
      "R$ 1.000,00",
      "R$ 900,00",
      "$200.00",
      "$200.00",
    ]);
  });

  test("states the day the balances are read as of", () => {
    render(
      <TransactionSummary currencies={[summaryRow()]} rangeTo="2026-07-31" />,
    );

    expect(
      flatten(screen.getByRole("region", { name: "Totals" }).textContent),
    ).toContain(formatDateString(DEFAULT_LOCALE, "2026-07-31", "numeric"));
  });

  test("renders nothing when the user holds no currency yet", () => {
    const { container } = render(
      <TransactionSummary currencies={[]} rangeTo="2026-07-31" />,
    );

    expect(container.querySelector("table")).toBeNull();
  });
});
