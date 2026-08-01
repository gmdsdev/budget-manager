import { CurrencyInput } from "@budget-manager/ui/components/currency-input";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import { useState } from "react";

function Harness({
  initial = 0,
  currencyCode = "BRL",
}: {
  initial?: number;
  currencyCode?: string;
}) {
  const [value, setValue] = useState(initial);

  return (
    <>
      <CurrencyInput
        aria-label="amount"
        value={value}
        currencyCode={currencyCode}
        onValueChange={setValue}
      />
      <output data-testid="value">{value}</output>
    </>
  );
}

function amountInput() {
  return screen.getByLabelText<HTMLInputElement>("amount");
}

describe("CurrencyInput", () => {
  test("reads typed digits as minor units", () => {
    render(<Harness />);
    const input = amountInput();

    fireEvent.change(input, { target: { value: "1234" } });

    expect(screen.getByTestId("value").textContent).toBe("1234");
    expect(input.value).toContain("12,34");
  });

  test("reformats when the currency changes, with no keystroke", () => {
    const { rerender } = render(
      <CurrencyInput
        aria-label="amount"
        value={1050}
        currencyCode="BRL"
        onValueChange={() => {}}
      />,
    );

    expect(amountInput().value).toContain("10,50");

    rerender(
      <CurrencyInput
        aria-label="amount"
        value={1050}
        currencyCode="JPY"
        onValueChange={() => {}}
      />,
    );

    expect(amountInput().value).toContain("1,050");
    expect(amountInput().value).not.toContain("10.50");
  });

  test("keeps the caret in place when editing mid-string", () => {
    render(<Harness initial={150000} />);
    const input = amountInput();

    const beforeDigits = 3;
    let offset = 0;
    let seen = 0;

    for (let index = 0; index < input.value.length; index++) {
      const character = input.value[index]!;
      if (character >= "0" && character <= "9" && ++seen === beforeDigits) {
        offset = index + 1;
        break;
      }
    }

    const next = input.value.slice(0, offset) + "9" + input.value.slice(offset);

    fireEvent.change(input, {
      target: {
        value: next,
        selectionStart: offset + 1,
        selectionEnd: offset + 1,
      },
    });

    const caret = input.selectionStart ?? -1;
    let digitsBeforeCaret = 0;

    for (let index = 0; index < caret; index++) {
      const character = input.value[index]!;
      if (character >= "0" && character <= "9") digitsBeforeCaret++;
    }

    expect(digitsBeforeCaret).toBe(4);
    expect(caret).toBeLessThan(input.value.length);
  });

  test("rejects amounts beyond the int4 column ceiling without emitting", () => {
    render(<Harness initial={1234} />);
    const input = amountInput();

    fireEvent.change(input, { target: { value: "99999999999" } });

    expect(screen.getByTestId("value").textContent).toBe("1234");
  });

  test("treats cleared input as zero", () => {
    render(<Harness initial={1234} />);
    const input = amountInput();

    fireEvent.change(input, { target: { value: "" } });

    expect(screen.getByTestId("value").textContent).toBe("0");
  });

  test("puts the caret at the end after clearing everything", () => {
    render(<Harness initial={1234} />);
    const input = amountInput();

    fireEvent.change(input, { target: { value: "" } });

    expect(input.selectionStart).toBe(input.value.length);

    const next = input.value + "5";

    fireEvent.change(input, {
      target: {
        value: next,
        selectionStart: next.length,
        selectionEnd: next.length,
      },
    });

    expect(screen.getByTestId("value").textContent).toBe("5");
    expect(input.value).toContain("0,05");
  });
});
