import { CategoryColor } from "@budget-manager/schemas";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { CategoryDot, CategoryItemLabel, CategoryLabel } from "./category-dot";

describe("CategoryLabel", () => {
  /**
   * The filter bar and the select triggers are asserted on by their text, so a
   * swatch that contributed any would break every one of those checks.
   */
  test("adds no text of its own", () => {
    const { container } = render(
      <CategoryLabel color={CategoryColor.RED} name="Dining Out" />,
    );

    expect(container.textContent).toBe("Dining Out");
    expect(screen.getByText("Dining Out")).toBeDefined();
  });

  test("paints the swatch from the palette token, never a literal", () => {
    const { container } = render(<CategoryDot color={CategoryColor.TEAL} />);
    const dot = container.querySelector("span");

    expect(dot?.getAttribute("style")).toContain("var(--category-teal)");
    expect(dot?.getAttribute("aria-hidden")).toBe("true");
  });

  test("leaves the swatch hollow when a row owns no colour", () => {
    const { container } = render(<CategoryDot color={null} />);
    const dot = container.querySelector("span");

    expect(dot?.getAttribute("style")).toBeNull();
    expect(dot?.className).toContain("border");
  });
});

describe("CategoryItemLabel", () => {
  const items = [
    { label: "Uncategorized", value: "none", color: null },
    { label: "Rent", value: "rent-id", color: CategoryColor.BLUE },
  ];

  test("resolves the selected row so the trigger shows its swatch", () => {
    const { container } = render(
      <CategoryItemLabel items={items} value="rent-id" />,
    );

    expect(container.textContent).toBe("Rent");
    expect(container.querySelector("span span")?.getAttribute("style")).toContain(
      "var(--category-blue)",
    );
  });

  test("renders nothing for a value the options do not carry", () => {
    const { container } = render(
      <CategoryItemLabel items={items} value="not-loaded-yet" />,
    );

    expect(container.textContent).toBe("");
  });
});
