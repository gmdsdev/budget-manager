import { DateRangePicker } from "@budget-manager/ui/components/date-picker";
import {
  currentMonthRange,
  type DateRangeValue,
} from "@budget-manager/client";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "bun:test";
import { useState } from "react";

const EMPTY: DateRangeValue = { from: "", to: "" };

function Harness({ initial = EMPTY }: { initial?: DateRangeValue }) {
  const [value, setValue] = useState(initial);

  return (
    <>
      <DateRangePicker
        aria-label="range"
        numberOfMonths={1}
        value={value}
        onValueChange={setValue}
      />
      <output data-testid="value">{`${value.from}/${value.to}`}</output>
    </>
  );
}

function trigger() {
  return screen.getByLabelText<HTMLButtonElement>("range");
}

function committed() {
  return screen.getByTestId("value").textContent;
}

async function openCalendar() {
  fireEvent.click(trigger());

  return screen.findAllByRole("grid");
}

describe("DateRangePicker", () => {
  test("shows the placeholder while empty", () => {
    render(<Harness />);

    expect(trigger().textContent).toContain("Pick a date range");
  });

  test("names a whole month rather than reciting its ends", () => {
    render(<Harness initial={{ from: "2026-07-01", to: "2026-07-31" }} />);

    expect(trigger().textContent).toContain("July 2026");
  });

  test("states what a hand-drawn range's two ends share only once", () => {
    render(<Harness initial={{ from: "2026-07-06", to: "2026-07-18" }} />);

    expect(trigger().textContent).toContain("Jul 6 – 18, 2026");
  });

  test("a single day reads as that day, not as a range of one", () => {
    render(<Harness initial={{ from: "2026-07-06", to: "2026-07-06" }} />);

    expect(trigger().textContent).toContain("Jul 6, 2026");
  });

  test("selects the stored days, not the UTC-shifted ones", async () => {
    render(<Harness initial={{ from: "2026-07-01", to: "2026-07-03" }} />);
    const [grid] = await openCalendar();

    expect(
      Array.from(
        grid?.querySelectorAll('[role="gridcell"][data-selected="true"]') ?? [],
      ).map((cell) => cell.getAttribute("data-day")),
    ).toEqual(["2026-07-01", "2026-07-02", "2026-07-03"]);
  });

  test("commits nothing until both ends are picked", async () => {
    render(<Harness initial={{ from: "2026-07-01", to: "2026-07-31" }} />);
    await openCalendar();

    fireEvent.click(screen.getByRole("button", { name: /July 6th, 2026/ }));

    expect(committed()).toBe("2026-07-01/2026-07-31");

    fireEvent.click(screen.getByRole("button", { name: /July 9th, 2026/ }));

    expect(committed()).toBe("2026-07-06/2026-07-09");
  });

  test("orders the range when the second click lands earlier", async () => {
    render(<Harness initial={{ from: "2026-07-01", to: "2026-07-31" }} />);
    await openCalendar();

    fireEvent.click(screen.getByRole("button", { name: /July 9th, 2026/ }));
    fireEvent.click(screen.getByRole("button", { name: /July 6th, 2026/ }));

    expect(committed()).toBe("2026-07-06/2026-07-09");
  });

  test("applies a preset in one click", async () => {
    render(<Harness initial={{ from: "2026-07-01", to: "2026-07-31" }} />);
    await openCalendar();

    fireEvent.click(screen.getByRole("button", { name: "This month" }));

    const month = currentMonthRange();

    expect(committed()).toBe(`${month.from}/${month.to}`);
  });

  test("offers month and year selectors", async () => {
    render(<Harness initial={{ from: "2026-07-01", to: "2026-07-31" }} />);
    await openCalendar();

    expect(screen.getByRole("combobox", { name: /month/i })).toBeDefined();
    expect(screen.getByRole("combobox", { name: /year/i })).toBeDefined();
  });

  test("Custom applies nothing and leaves the calendar open to pick on", async () => {
    render(<Harness initial={{ from: "2026-07-01", to: "2026-07-31" }} />);
    await openCalendar();

    fireEvent.click(screen.getByRole("button", { name: "Custom" }));

    // It is the one option that sets no range: the popup stays open so the reader
    // can draw one, and until they do the range is untouched.
    expect(committed()).toBe("2026-07-01/2026-07-31");
    expect(screen.getAllByRole("grid").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /July 6th, 2026/ }));
    fireEvent.click(screen.getByRole("button", { name: /July 9th, 2026/ }));

    expect(committed()).toBe("2026-07-06/2026-07-09");
  });
});
