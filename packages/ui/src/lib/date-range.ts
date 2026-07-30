import {
  addMonths,
  endOfMonth,
  endOfYear,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns"

const ISO_DATE = "yyyy-MM-dd"

const CAPTION_YEARS = 10

export type DateRangeValue = { from: string; to: string }

export type DateRangePreset = {
  label: string
  getRange: (today?: Date) => DateRangeValue
}

export function parseIsoDate(value: string | null | undefined) {
  if (!value) {
    return undefined
  }

  const parsed = parseISO(value)

  return isValid(parsed) ? parsed : undefined
}

export function formatIsoDate(date: Date) {
  return format(date, ISO_DATE)
}

function range(from: Date, to: Date): DateRangeValue {
  return { from: formatIsoDate(from), to: formatIsoDate(to) }
}

export function currentMonthRange(today = new Date()): DateRangeValue {
  return range(startOfMonth(today), endOfMonth(today))
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    label: "This month",
    getRange: (today = new Date()) => currentMonthRange(today),
  },
  {
    label: "Last month",
    getRange: (today = new Date()) => currentMonthRange(subMonths(today, 1)),
  },
  {
    label: "Last 3 months",
    getRange: (today = new Date()) =>
      range(startOfMonth(subMonths(today, 2)), endOfMonth(today)),
  },
  {
    label: "This year",
    getRange: (today = new Date()) => range(startOfYear(today), endOfYear(today)),
  },
  {
    label: "Next 12 months",
    getRange: (today = new Date()) =>
      range(startOfMonth(today), endOfMonth(addMonths(today, 11))),
  },
]

/**
 * The month and year dropdowns default to a hundred years back and stop at the
 * end of the current year, which puts every future-dated row out of reach.
 */
export function captionMonthRange(today = new Date()) {
  return {
    startMonth: new Date(today.getFullYear() - CAPTION_YEARS, 0, 1),
    endMonth: new Date(today.getFullYear() + CAPTION_YEARS, 11, 31),
  }
}
