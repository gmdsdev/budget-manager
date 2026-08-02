import { DateRangePicker } from "@budget-manager/ui/components/date-picker";
import {
  currentMonthRange,
  DATE_RANGE_PRESETS,
  type DateRangePresetKey,
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

  test("reads the stored range back onto the trigger", () => {
    render(<Harness initial={{ from: "2026-07-01", to: "2026-07-31" }} />);

    expect(trigger().textContent).toContain("Jul 1 – Jul 31, 2026");
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
});

describe("DATE_RANGE_PRESETS", () => {
  const LEAP_FEBRUARY = new Date(2028, 1, 14);

  function rangeFor(labelKey: DateRangePresetKey) {
    return DATE_RANGE_PRESETS.find(
      (preset) => preset.labelKey === labelKey,
    )?.getRange(LEAP_FEBRUARY);
  }

  test("covers whole months, including a leap February", () => {
    expect(rangeFor("dateRange.thisMonth")).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
    expect(rangeFor("dateRange.lastMonth")).toEqual({
      from: "2028-01-01",
      to: "2028-01-31",
    });
    expect(rangeFor("dateRange.last3Months")).toEqual({
      from: "2027-12-01",
      to: "2028-02-29",
    });
  });

  test("reaches the rows a recurring series lands on later", () => {
    expect(rangeFor("dateRange.thisYear")).toEqual({
      from: "2028-01-01",
      to: "2028-12-31",
    });
    expect(rangeFor("dateRange.next12Months")).toEqual({
      from: "2028-02-01",
      to: "2029-01-31",
    });
  });
});
