import { CategoryType } from "@budget-manager/schemas";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { CATEGORY_TYPE_FILTER_ALL } from "../../types";
import { CategoryTypeFilter } from "./category-type-filter";

describe("CategoryTypeFilter", () => {
  test("shows the all-types label when nothing is filtered", () => {
    render(
      <CategoryTypeFilter
        value={CATEGORY_TYPE_FILTER_ALL}
        onValueChange={() => undefined}
      />,
    );

    expect(screen.getByText("All types")).toBeDefined();
  });

  test("shows the selected type label", () => {
    render(
      <CategoryTypeFilter
        value={CategoryType.INCOME}
        onValueChange={() => undefined}
      />,
    );

    expect(screen.getByText("Income")).toBeDefined();
  });
});
