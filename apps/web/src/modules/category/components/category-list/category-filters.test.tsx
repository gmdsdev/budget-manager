import { CategoryType } from "@budget-manager/schemas";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { EMPTY_CATEGORY_FILTERS } from "@budget-manager/client";
import { CategoryFilters } from "./category-filters";

describe("CategoryFilters", () => {
  test("reads as the column name while the column is unfiltered", () => {
    render(
      <CategoryFilters
        filters={EMPTY_CATEGORY_FILTERS}
        onFiltersChange={() => undefined}
      />,
    );

    expect(screen.getByLabelText("Type").textContent).toContain("Type");
    expect(screen.queryByText("All types")).toBeNull();
  });

  test("shows the selected type in place of the column name", () => {
    render(
      <CategoryFilters
        filters={{ ...EMPTY_CATEGORY_FILTERS, type: CategoryType.INCOME }}
        onFiltersChange={() => undefined}
      />,
    );

    expect(screen.getByLabelText("Type").textContent).toContain("Income");
  });

  test("carries no visible label, only the accessible one", () => {
    render(
      <CategoryFilters
        filters={EMPTY_CATEGORY_FILTERS}
        onFiltersChange={() => undefined}
      />,
    );

    expect(document.querySelectorAll("label").length).toBe(0);
    expect(screen.getByLabelText("Name")).toBeDefined();
    expect(screen.getByLabelText("Type")).toBeDefined();
  });

  test("names the column in the search placeholder", () => {
    render(
      <CategoryFilters
        filters={EMPTY_CATEGORY_FILTERS}
        onFiltersChange={() => undefined}
      />,
    );

    expect(screen.getByLabelText("Name").getAttribute("placeholder")).toBe(
      "Filter by name",
    );
  });

  test("offers a clear action only once something is filtered", () => {
    const { rerender } = render(
      <CategoryFilters
        filters={EMPTY_CATEGORY_FILTERS}
        onFiltersChange={() => undefined}
      />,
    );

    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();

    rerender(
      <CategoryFilters
        filters={{ ...EMPTY_CATEGORY_FILTERS, search: "coffee" }}
        onFiltersChange={() => undefined}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Clear filters" }),
    ).toBeDefined();
  });
});
