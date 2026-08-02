import { describe, expect, test } from "bun:test";

import { PAGE_SIZE, pageCount, pageRange, toOffset } from "./pagination";

describe("toOffset", () => {
  test("page 1 starts at zero", () => {
    expect(toOffset(1)).toBe(0);
  });

  test("advances by the page size", () => {
    expect(toOffset(2)).toBe(PAGE_SIZE);
    expect(toOffset(4, 10)).toBe(30);
  });

  test("never returns a negative offset", () => {
    expect(toOffset(0)).toBe(0);
    expect(toOffset(-5)).toBe(0);
  });
});

describe("pageCount", () => {
  test("is 1 when there is nothing, so the UI never shows 'page 1 of 0'", () => {
    expect(pageCount(0)).toBe(1);
  });

  test("rounds a partial page up", () => {
    expect(pageCount(21, 20)).toBe(2);
    expect(pageCount(40, 20)).toBe(2);
    expect(pageCount(41, 20)).toBe(3);
  });
});

describe("pageRange", () => {
  test("is 0–0 with no rows", () => {
    expect(pageRange({ page: 1, total: 0 })).toEqual({ from: 0, to: 0 });
  });

  test("covers a full first page", () => {
    expect(pageRange({ page: 1, total: 57, pageSize: 20 })).toEqual({
      from: 1,
      to: 20,
    });
  });

  test("clamps the last page to the total", () => {
    expect(pageRange({ page: 3, total: 57, pageSize: 20 })).toEqual({
      from: 41,
      to: 57,
    });
  });

  test("handles a single partial page", () => {
    expect(pageRange({ page: 1, total: 3, pageSize: 20 })).toEqual({
      from: 1,
      to: 3,
    });
  });
});
