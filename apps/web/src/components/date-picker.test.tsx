import { DatePicker } from "@budget-manager/ui/components/date-picker";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import { useState } from "react";

function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState<string>(initial);

  return (
    <>
      <DatePicker
        aria-label="date"
        clearable
        value={value}
        onValueChange={setValue}
      />
      <output data-testid="value">{value}</output>
    </>
  );
}

function trigger() {
  return screen.getByLabelText<HTMLButtonElement>("date");
}

async function openCalendar() {
  fireEvent.click(trigger());

  return screen.findByRole("grid");
}

describe("DatePicker", () => {
  test("shows the placeholder while empty", () => {
    render(<Harness />);

    expect(trigger().textContent).toContain("Pick a date");
  });

  test("selects the stored day, not the UTC-shifted one", async () => {
    render(<Harness initial="2026-07-01" />);
    const grid = await openCalendar();

    expect(
      grid.querySelector('[role="gridcell"][data-selected="true"]')?.getAttribute("data-day"),
    ).toBe("2026-07-01");
  });

  test("emits the picked day as an ISO date string", async () => {
    render(<Harness initial="2026-07-01" />);
    await openCalendar();

    fireEvent.click(screen.getByRole("button", { name: /July 15th, 2026/ }));

    expect(screen.getByTestId("value").textContent).toBe("2026-07-15");
  });

  test("clears to an empty string", async () => {
    render(<Harness initial="2026-07-01" />);
    await openCalendar();

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.getByTestId("value").textContent).toBe("");
  });
});
