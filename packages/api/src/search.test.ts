import { describe, expect, test } from "bun:test";
import { containsPattern } from "./search";

describe("containsPattern", () => {
  test("matches anywhere in the column", () => {
    expect(containsPattern("coffee")).toBe("%coffee%");
  });

  test("escapes percent so it is searched for literally", () => {
    expect(containsPattern("50% off")).toBe("%50\\% off%");
  });

  test("escapes underscore so it does not match any single character", () => {
    expect(containsPattern("a_b")).toBe("%a\\_b%");
  });

  test("escapes the escape character itself", () => {
    expect(containsPattern("back\\slash")).toBe("%back\\\\slash%");
  });

  test("keeps an empty term harmless", () => {
    expect(containsPattern("")).toBe("%%");
  });
});
