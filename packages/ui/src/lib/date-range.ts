/**
 * The range arithmetic itself lives in `@budget-manager/client`: the transaction
 * list reads the same helper the picker does, and both apps have to agree about
 * what "this month" means. Only the piece that exists for react-day-picker stays
 * here.
 */
export {
  currentMonthRange,
  DATE_RANGE_PRESETS,
  type DateRangePreset,
  type DateRangePresetKey,
  type DateRangeValue,
  formatIsoDate,
  parseIsoDate,
} from "@budget-manager/client"

const CAPTION_YEARS = 10

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
