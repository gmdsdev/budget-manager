import { describe, expect, test } from "bun:test";

import {
  ChangePasswordFormSchema,
  DEFAULT_PREFERRED_CURRENCY,
  PASSWORD_MIN_LENGTH,
  ProfileFormSchema,
  toPreferredCurrency,
} from "./user.schema";
import { WalletCurrency } from "../wallet/wallet.schema";

const VALID = {
  currentPassword: "old-password",
  newPassword: "new-password",
  confirmPassword: "new-password",
};

describe("ChangePasswordFormSchema", () => {
  test("accepts a confirmed, sufficiently long new password", () => {
    expect(ChangePasswordFormSchema.safeParse(VALID).success).toBe(true);
  });

  test("rejects a new password shorter than the minimum", () => {
    const short = "a".repeat(PASSWORD_MIN_LENGTH - 1);
    const result = ChangePasswordFormSchema.safeParse({
      ...VALID,
      newPassword: short,
      confirmPassword: short,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toContainEqual([
      "newPassword",
    ]);
  });

  test("reports a mismatched confirmation on the confirm field", () => {
    const result = ChangePasswordFormSchema.safeParse({
      ...VALID,
      confirmPassword: "something-else",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  test("refuses reusing the current password", () => {
    const result = ChangePasswordFormSchema.safeParse({
      currentPassword: VALID.currentPassword,
      newPassword: VALID.currentPassword,
      confirmPassword: VALID.currentPassword,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["newPassword"]);
  });

  test("requires the current password", () => {
    const result = ChangePasswordFormSchema.safeParse({
      ...VALID,
      currentPassword: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("ProfileFormSchema", () => {
  test("trims the name", () => {
    const result = ProfileFormSchema.safeParse({ name: "  Ada  " });

    expect(result.data?.name).toBe("Ada");
  });

  test("rejects a blank name", () => {
    expect(ProfileFormSchema.safeParse({ name: "   " }).success).toBe(false);
  });
});

describe("toPreferredCurrency", () => {
  test("keeps a supported code", () => {
    expect(toPreferredCurrency("JPY")).toBe(WalletCurrency.JPY);
  });

  test("falls back for a stored value that is no longer supported", () => {
    expect(toPreferredCurrency("XXX")).toBe(DEFAULT_PREFERRED_CURRENCY);
  });

  test("falls back for a missing value", () => {
    expect(toPreferredCurrency(null)).toBe(DEFAULT_PREFERRED_CURRENCY);
    expect(toPreferredCurrency(undefined)).toBe(DEFAULT_PREFERRED_CURRENCY);
  });
});
