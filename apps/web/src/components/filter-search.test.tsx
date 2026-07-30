import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { FilterSearch } from "./filter-search";

function field() {
  return screen.getByLabelText<HTMLInputElement>("Search");
}

function renderSearch({
  value = "",
  onValueChange = () => undefined,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
} = {}) {
  return render(
    <FilterSearch
      id="search"
      label="Search"
      value={value}
      onValueChange={onValueChange}
      delay={10}
    />,
  );
}

describe("FilterSearch", () => {
  test("commits once, after typing settles", async () => {
    const committed: string[] = [];

    renderSearch({ onValueChange: (value) => committed.push(value) });

    fireEvent.change(field(), { target: { value: "cof" } });
    fireEvent.change(field(), { target: { value: "coffee" } });

    expect(committed).toEqual([]);

    await waitFor(() => expect(committed.length).toBe(1));
    expect(committed).toEqual(["coffee"]);
  });

  test("does not re-commit the term the parent already holds", async () => {
    const committed: string[] = [];

    renderSearch({
      value: "coffee",
      onValueChange: (value) => committed.push(value),
    });

    await waitFor(() => expect(field().value).toBe("coffee"));
    expect(committed).toEqual([]);
  });

  test("mirrors a reset coming from outside", () => {
    const { rerender } = renderSearch({ value: "coffee" });

    expect(field().value).toBe("coffee");

    rerender(
      <FilterSearch
        id="search"
        label="Search"
        value=""
        onValueChange={() => undefined}
        delay={10}
      />,
    );

    expect(field().value).toBe("");
  });
});
