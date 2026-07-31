import { describe, expect, test } from "bun:test";

import { Locale, setActiveLocale, translate } from "@budget-manager/i18n";

import { TransactionStatus, TransferFormSchema } from "./transaction.schema";

const WALLET_A = "6d1f6b26-6a4a-4f6f-9a1a-2a0d0f8a1111";
const WALLET_B = "0f7a5b6b-2c3d-4e5f-8a9b-1c2d3e4f2222";

function transfer(overrides: Record<string, unknown> = {}) {
  return {
    status: TransactionStatus.PAID,
    name: "Move to savings",
    amountCents: 25_000,
    occurrenceDate: "2026-07-30",
    fromWalletId: WALLET_A,
    toWalletId: WALLET_B,
    notes: null,
    ...overrides,
  };
}

describe("TransferFormSchema", () => {
  test("accepts a transfer between two different wallets", () => {
    expect(TransferFormSchema.safeParse(transfer()).success).toBe(true);
  });

  test("rejects a transfer to the same wallet, on the destination field", () => {
    const result = TransferFormSchema.safeParse(
      transfer({ toWalletId: WALLET_A }),
    );

    expect(result.success).toBe(false);

    const issue = result.error?.issues[0];

    expect(issue?.message).toBe(
      translate(Locale.EN, "validation.sameWalletTransfer"),
    );
    expect(issue?.path).toEqual(["toWalletId"]);
  });

  // The message is resolved when the form validates, not when the schema is
  // defined, which is the whole reason a language switch does not need the
  // schemas rebuilt.
  test("reports the refusal in the active locale", () => {
    setActiveLocale(Locale.PT_BR);

    try {
      const result = TransferFormSchema.safeParse(
        transfer({ toWalletId: WALLET_A }),
      );

      expect(result.error?.issues[0]?.message).toBe(
        translate(Locale.PT_BR, "validation.sameWalletTransfer"),
      );
    } finally {
      setActiveLocale(Locale.EN);
    }
  });

  test("rejects a zero or negative amount", () => {
    expect(TransferFormSchema.safeParse(transfer({ amountCents: 0 })).success).toBe(
      false,
    );
    expect(
      TransferFormSchema.safeParse(transfer({ amountCents: -100 })).success,
    ).toBe(false);
  });

  test("rejects a non-integer amount", () => {
    expect(
      TransferFormSchema.safeParse(transfer({ amountCents: 10.5 })).success,
    ).toBe(false);
  });

  test("rejects a malformed date", () => {
    expect(
      TransferFormSchema.safeParse(transfer({ occurrenceDate: "30-07-2026" }))
        .success,
    ).toBe(false);
  });
});
