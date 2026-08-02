import type { ChangePasswordFormDto } from "@budget-manager/schemas";
import { act, render } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { usePasswordForm } from "./forms";

type Form = ReturnType<typeof usePasswordForm>;

const FIELDS = [
  "currentPassword",
  "newPassword",
  "confirmPassword",
] as const satisfies readonly (keyof ChangePasswordFormDto)[];

function mountForm() {
  const captured: { form?: Form; submitted: ChangePasswordFormDto[] } = {
    submitted: [],
  };

  function Harness() {
    const form = usePasswordForm({
      onSubmit: (values) => {
        captured.submitted.push(values);

        return Promise.resolve();
      },
    });

    captured.form = form;

    return (
      <>
        {FIELDS.map((name) => (
          <form.Field key={name} name={name}>
            {(field) => (
              <input
                aria-label={name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            )}
          </form.Field>
        ))}
      </>
    );
  }

  render(<Harness />);

  if (!captured.form) throw new Error("form not captured");

  return captured as { form: Form; submitted: ChangePasswordFormDto[] };
}

async function setValues(form: Form, values: Partial<ChangePasswordFormDto>) {
  const entries = Object.entries(values) as [
    keyof ChangePasswordFormDto,
    never,
  ][];

  await act(async () => {
    for (const [key, value] of entries) {
      form.setFieldValue(key, value);
    }

    await Promise.resolve();
  });
}

async function submit(form: Form) {
  await act(async () => {
    await form.handleSubmit();
  });
}

const VALID: ChangePasswordFormDto = {
  currentPassword: "old-password",
  newPassword: "new-password",
  confirmPassword: "new-password",
};

describe("usePasswordForm", () => {
  test("refuses to submit while empty", async () => {
    const { form, submitted } = mountForm();

    await submit(form);

    expect(submitted.length).toBe(0);
    expect(form.state.canSubmit).toBe(false);
  });

  test("submits on the first attempt once the values are valid", async () => {
    const { form, submitted } = mountForm();

    await setValues(form, VALID);
    await submit(form);

    expect(submitted).toEqual([VALID]);
  });

  test("blocks a mismatched confirmation and reports it on that field", async () => {
    const { form, submitted } = mountForm();

    await setValues(form, { ...VALID, confirmPassword: "different" });
    await submit(form);

    expect(submitted.length).toBe(0);
    expect(form.getFieldMeta("confirmPassword")?.errors.length).toBeGreaterThan(
      0,
    );
  });

  test("clears the mismatch on change alone, with no blur", async () => {
    const { form } = mountForm();

    await setValues(form, { ...VALID, confirmPassword: "different" });
    expect(form.state.canSubmit).toBe(false);

    await setValues(form, { confirmPassword: VALID.newPassword });

    expect(form.state.canSubmit).toBe(true);
    expect(form.getFieldMeta("confirmPassword")?.errors.length).toBe(0);
  });

  test("refuses reusing the current password", async () => {
    const { form, submitted } = mountForm();

    await setValues(form, {
      currentPassword: VALID.currentPassword,
      newPassword: VALID.currentPassword,
      confirmPassword: VALID.currentPassword,
    });
    await submit(form);

    expect(submitted.length).toBe(0);
    expect(form.getFieldMeta("newPassword")?.errors.length).toBeGreaterThan(0);
  });
});
