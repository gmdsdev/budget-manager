import {
  TransactionStatus,
  type TransferFormDto,
} from "@budget-manager/schemas";
import { act, render } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { useTransferForm } from "./forms";

const WALLET_A = "6d1f6b26-6a4a-4f6f-9a1a-2a0d0f8a1111";
const WALLET_B = "0f7a5b6b-2c3d-4e5f-8a9b-1c2d3e4f2222";

type Form = ReturnType<typeof useTransferForm>;

/**
 * Registers the same fields the dialog does — field instances have to exist for
 * error state to be tracked per field. The wallet fields are driven through the
 * form API because Base UI's Select never emits a blur event, which is the
 * condition that used to strand validation errors and block submission.
 */
function mountForm() {
  const captured: { form?: Form; submitted: unknown[] } = { submitted: [] };

  function Harness() {
    const form = useTransferForm({
      defaultValues: {
        status: TransactionStatus.PAID,
        name: "",
        amountCents: 0,
        occurrenceDate: "2026-07-30",
        fromWalletId: "",
        toWalletId: "",
        notes: null,
      },
      onSubmit: (values) => {
        captured.submitted.push(values);

        return Promise.resolve();
      },
    });

    captured.form = form;

    return (
      <>
        <form.Field name="name">
          {(field) => (
            <input
              aria-label="name"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
        <form.Field name="fromWalletId">
          {(field) => <span data-testid="from">{field.state.value}</span>}
        </form.Field>
        <form.Field name="toWalletId">
          {(field) => <span data-testid="to">{field.state.value}</span>}
        </form.Field>
        <form.Field name="amountCents">
          {(field) => <span data-testid="amount">{field.state.value}</span>}
        </form.Field>
      </>
    );
  }

  render(<Harness />);

  if (!captured.form) throw new Error("form not captured");

  return captured as { form: Form; submitted: unknown[] };
}

async function setValues(form: Form, values: Partial<TransferFormDto>) {
  // Object.entries widens the key to string, so narrow it once here.
  const entries = Object.entries(values) as [keyof TransferFormDto, never][];

  await act(async () => {
    for (const [key, value] of entries) {
      form.setFieldValue(key, value);
    }

    // Validation runs off the change event, so let the microtask queue drain.
    await Promise.resolve();
  });
}

async function submit(form: Form) {
  await act(async () => {
    await form.handleSubmit();
  });
}

const VALID: Partial<TransferFormDto> = {
  name: "To savings",
  fromWalletId: WALLET_A,
  toWalletId: WALLET_B,
  amountCents: 30_000,
};

describe("useTransferForm", () => {
  test("refuses to submit while required values are missing", async () => {
    const { form, submitted } = mountForm();

    await submit(form);

    expect(submitted.length).toBe(0);
    expect(form.state.canSubmit).toBe(false);
  });

  test("becomes submittable from select-only edits, with no blur", async () => {
    const { form } = mountForm();

    await setValues(form, VALID);

    expect(form.state.canSubmit).toBe(true);
  });

  test("submits on the first attempt once the values are valid", async () => {
    const { form, submitted } = mountForm();

    await setValues(form, VALID);
    await submit(form);

    expect(submitted.length).toBe(1);
  });

  test("recovers after a rejected submit without needing a blur", async () => {
    const { form, submitted } = mountForm();

    await submit(form);
    expect(submitted.length).toBe(0);

    await setValues(form, VALID);
    await submit(form);

    expect(submitted.length).toBe(1);
  });

  test("still refuses two identical wallets", async () => {
    const { form, submitted } = mountForm();

    await setValues(form, { ...VALID, toWalletId: WALLET_A });
    await submit(form);

    expect(submitted.length).toBe(0);
    expect(form.state.canSubmit).toBe(false);
  });
});
