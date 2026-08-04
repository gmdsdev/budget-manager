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

/** A fresh focus, which the browser arrives at with the whole value selected. */
function tabInto(element: HTMLInputElement) {
  element.setSelectionRange(0, element.value.length);
  fireEvent.focus(element);
}

/** Where the caret sits once a keystroke has landed: past the last character. */
function caretAtEnd(element: HTMLInputElement) {
  element.setSelectionRange(element.value.length, element.value.length);
}

function press(element: HTMLInputElement, character: string) {
  const start = element.selectionStart ?? element.value.length;
  const end = element.selectionEnd ?? element.value.length;
  const next = element.value.slice(0, start) + character + element.value.slice(end);

  fireEvent.change(element, {
    target: { value: next, selectionStart: start + 1, selectionEnd: start + 1 },
  });
}

function backspace(element: HTMLInputElement) {
  const start = element.selectionStart ?? element.value.length;
  const end = element.selectionEnd ?? element.value.length;
  const from = start === end ? Math.max(0, start - 1) : start;
  const next = element.value.slice(0, from) + element.value.slice(end);

  fireEvent.change(element, {
    target: { value: next, selectionStart: from, selectionEnd: from },
  });
}

function flat(element: HTMLInputElement) {
  return element.value.replace(/\s/g, " ");
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

  test("shifts digits in from the right, one keystroke at a time", () => {
    render(<Harness />);
    const input = amountInput();

    tabInto(input);

    const reading = ["R$ 0,01", "R$ 0,12", "R$ 1,23", "R$ 12,34", "R$ 123,45"];

    for (const [index, digit] of ["1", "2", "3", "4", "5"].entries()) {
      press(input, digit);

      expect(flat(input)).toBe(reading[index]!);
      expect(input.selectionStart).toBe(input.value.length);
    }

    expect(screen.getByTestId("value").textContent).toBe("12345");
  });

  test("leaves the select-all a fresh focus brings, so a fill still replaces", () => {
    render(<Harness initial={150000} />);
    const input = amountInput();

    tabInto(input);

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
  });

  test("drops the rightmost digit on backspace", () => {
    render(<Harness initial={12345} />);
    const input = amountInput();

    caretAtEnd(input);
    backspace(input);

    expect(flat(input)).toBe("R$ 12,34");

    backspace(input);

    expect(flat(input)).toBe("R$ 1,23");
    expect(screen.getByTestId("value").textContent).toBe("123");
  });

  test("refuses to move the caret off the end", () => {
    render(<Harness initial={12345} />);
    const input = amountInput();

    input.setSelectionRange(3, 3);

    for (const key of ["ArrowLeft", "ArrowRight", "Home", "End", "ArrowUp"]) {
      const moved = fireEvent.keyDown(input, { key });

      expect(moved).toBe(false);
      expect(input.selectionStart).toBe(input.value.length);
    }
  });

  test("leaves a shifted key alone so a selection can still be made", () => {
    render(<Harness initial={12345} />);
    const input = amountInput();

    tabInto(input);

    expect(fireEvent.keyDown(input, { key: "ArrowLeft", shiftKey: true })).toBe(
      true,
    );
    expect(fireEvent.keyDown(input, { key: "Backspace" })).toBe(true);
  });

  test("keeps the caret at the end when a digit is typed mid-string", () => {
    render(<Harness initial={1234} />);
    const input = amountInput();

    input.setSelectionRange(4, 4);
    press(input, "9");

    expect(input.selectionStart).toBe(input.value.length);
    expect(screen.getByTestId("value").textContent).toBe("19234");
  });

  test("replaces the whole value when the selection covers it", () => {
    render(<Harness initial={12345} />);
    const input = amountInput();

    tabInto(input);
    input.setSelectionRange(0, input.value.length);
    press(input, "7");

    expect(flat(input)).toBe("R$ 0,07");
    expect(screen.getByTestId("value").textContent).toBe("7");
  });

  test("ignores a keystroke that is not a digit", () => {
    render(<Harness initial={1234} />);
    const input = amountInput();

    caretAtEnd(input);
    press(input, "a");

    expect(flat(input)).toBe("R$ 12,34");
    expect(screen.getByTestId("value").textContent).toBe("1234");
  });

  test("takes a whole-string replacement at its word", () => {
    render(<Harness initial={200000} />);
    const input = amountInput();

    expect(flat(input)).toBe("R$ 2.000,00");

    fireEvent.change(input, { target: { value: "250000" } });

    expect(screen.getByTestId("value").textContent).toBe("250000");
    expect(flat(input)).toBe("R$ 2.500,00");
  });

  test("drops a digit when a separator is cut out of the middle", () => {
    render(<Harness initial={12345} />);
    const input = amountInput();

    const without = input.value.replace(",", "");

    fireEvent.change(input, { target: { value: without } });

    expect(screen.getByTestId("value").textContent).toBe("1234");
  });

  test("drops a digit when backspace lands on the currency symbol", () => {
    render(<Harness initial={123456} currencyCode="EUR" />);
    const input = amountInput();

    caretAtEnd(input);

    expect(flat(input).endsWith("€")).toBe(true);

    backspace(input);

    expect(screen.getByTestId("value").textContent).toBe("12345");
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
