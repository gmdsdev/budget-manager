import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { usePagedFilters } from "./use-paged-filters";

type Filters = { kind: string };

describe("usePagedFilters", () => {
  test("starts on page 1 with the given filters", () => {
    const { result } = renderHook(() => usePagedFilters<Filters>({ kind: "" }));

    expect(result.current.page).toBe(1);
    expect(result.current.filters).toEqual({ kind: "" });
  });

  test("paging keeps the filters", () => {
    const { result } = renderHook(() =>
      usePagedFilters<Filters>({ kind: "expense" }),
    );

    act(() => result.current.setPage(3));

    expect(result.current.page).toBe(3);
    expect(result.current.filters).toEqual({ kind: "expense" });
  });

  test("changing a filter resets to page 1", () => {
    const { result } = renderHook(() => usePagedFilters<Filters>({ kind: "" }));

    act(() => result.current.setPage(4));
    expect(result.current.page).toBe(4);

    act(() => result.current.setFilters({ kind: "income" }));

    // Without this, the user lands on an out-of-range page showing nothing.
    expect(result.current.page).toBe(1);
    expect(result.current.filters).toEqual({ kind: "income" });
  });

  test("clamps a page below 1", () => {
    const { result } = renderHook(() => usePagedFilters<Filters>({ kind: "" }));

    act(() => result.current.setPage(0));

    expect(result.current.page).toBe(1);
  });
});
