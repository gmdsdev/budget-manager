import { CATEGORY_COLORS, CategoryColor } from "@budget-manager/schemas";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { CategoryColorPicker } from "./category-color-picker";

describe("CategoryColorPicker", () => {
  test("offers every palette slot, named", () => {
    render(
      <CategoryColorPicker
        id="color"
        value={CategoryColor.BLUE}
        onValueChange={() => undefined}
      />,
    );

    expect(screen.getAllByRole("radio").length).toBe(CATEGORY_COLORS.length);
    expect(screen.getByRole("radio", { name: "Purple" })).toBeDefined();
  });

  test("marks exactly the selected slot", () => {
    render(
      <CategoryColorPicker
        id="color"
        value={CategoryColor.LIME}
        onValueChange={() => undefined}
      />,
    );

    const checked = screen
      .getAllByRole("radio")
      .filter((radio) => radio.getAttribute("aria-checked") === "true");

    expect(checked.length).toBe(1);
    expect(checked[0]?.getAttribute("aria-label")).toBe("Lime");
  });

  test("reports the slot the user picks", () => {
    const picked: CategoryColor[] = [];

    render(
      <CategoryColorPicker
        id="color"
        value={CategoryColor.BLUE}
        onValueChange={(color) => picked.push(color)}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Teal" }));

    expect(picked).toEqual([CategoryColor.TEAL]);
  });
});
