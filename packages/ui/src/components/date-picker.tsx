import * as React from "react"
import { RiCalendar2Line } from "@remixicon/react"
import type { DateRange } from "react-day-picker"

import { useI18n } from "@budget-manager/i18n/react"
import { cn } from "@budget-manager/ui/lib/utils"
import {
  captionMonthRange,
  DATE_RANGE_CUSTOM_KEY,
  DATE_RANGE_PRESETS,
  formatIsoDate,
  isWholeMonthRange,
  parseIsoDate,
  type DateRangePreset,
  type DateRangeValue,
} from "@budget-manager/ui/lib/date-range"
import { Button } from "@budget-manager/ui/components/button"
import { Calendar } from "@budget-manager/ui/components/calendar"
import { useIsCompact } from "@budget-manager/ui/hooks/use-media-query"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@budget-manager/ui/components/popover"

function DatePicker({
  value,
  onValueChange,
  id,
  name,
  placeholder,
  disabled,
  clearable = false,
  className,
  onBlur,
  ...props
}: {
  value: string | null | undefined
  onValueChange: (value: string) => void
  id?: string
  name?: string
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  className?: string
  onBlur?: React.FocusEventHandler<HTMLButtonElement>
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  "aria-label"?: string
}) {
  const { t, formatDate } = useI18n()
  const [open, setOpen] = React.useState(false)
  const selected = parseIsoDate(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            id={id}
            disabled={disabled}
            data-empty={!selected}
            onBlur={onBlur}
            className={cn(
              "w-full justify-between border-input font-normal data-[empty=true]:text-muted-foreground",
              className
            )}
            {...props}
          />
        }
      >
        {selected
          ? formatDate(selected, "day")
          : (placeholder ?? t("common.pickADate"))}
        <RiCalendar2Line className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-0 p-0">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          {...captionMonthRange()}
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) {
              return
            }

            onValueChange(formatIsoDate(date))
            setOpen(false)
          }}
        />
        {clearable && selected ? (
          <Button
            variant="ghost"
            size="sm"
            className="mx-2 mb-2"
            onClick={() => {
              onValueChange("")
              setOpen(false)
            }}
          >
            {t("common.clear")}
          </Button>
        ) : null}
      </PopoverContent>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
    </Popover>
  )
}

/**
 * One control for a start and an end date. Every pick starts a fresh range — the
 * first click sets the start, the second the end — and only a complete range
 * reaches the caller, so one that requires a range is never handed half of it.
 * An abandoned first click is discarded when the popup closes.
 *
 * The trigger names the period rather than reciting its ends: a whole month reads
 * as `August 2026` and a single day as itself, which is both what a reader calls
 * that range and what leaves room for the stepper arrows beside it.
 */
function DateRangePicker({
  value,
  onValueChange,
  id,
  placeholder,
  presets = DATE_RANGE_PRESETS,
  numberOfMonths = 2,
  disabled,
  size = "default",
  className,
  ...props
}: {
  value: DateRangeValue
  onValueChange: (value: DateRangeValue) => void
  id?: string
  placeholder?: string
  presets?: DateRangePreset[]
  numberOfMonths?: number
  disabled?: boolean
  /** The filter bar wants the 36px chip; a form field wants the 48px default. */
  size?: "default" | "sm"
  className?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  "aria-label"?: string
}) {
  const { t, formatDateStringRange, formatMonthString } = useI18n()
  const [open, setOpen] = React.useState(false)
  const [anchor, setAnchor] = React.useState<Date | undefined>(undefined)
  // `Custom` sets no range, so being on it is the one thing about this control
  // that cannot be read back off the value. It lasts as long as the popup: a
  // reopened picker reads its state from the range again.
  const [custom, setCustom] = React.useState(false)
  const from = parseIsoDate(value.from)
  const to = parseIsoDate(value.to)
  // Two months side by side is wider than a phone, and a popup that scrolls
  // sideways hides half the range being picked.
  const isCompact = useIsCompact()
  const months = isCompact ? 1 : numberOfMonths

  // `Intl` states whatever the two ends share once (`Aug 2 – 8, 2026`) and
  // collapses a range of one day to that day, so neither needs a branch here.
  const label = isWholeMonthRange(value)
    ? formatMonthString(value.from.slice(0, 7), "monthYear")
    : formatDateStringRange(value.from, value.to, "day")

  const selected: DateRange | undefined = anchor
    ? { from: anchor, to: anchor }
    : from
      ? { from, to }
      : undefined

  const activePreset = presets.find((preset) => {
    const range = preset.getRange()

    return range.from === value.from && range.to === value.to
  })

  function commit(next: DateRangeValue) {
    setAnchor(undefined)
    setCustom(false)
    onValueChange(next)
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setAnchor(undefined)
        setCustom(false)
        setOpen(next)
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size={size}
            id={id}
            disabled={disabled}
            data-empty={!from || !to}
            className={cn(
              "w-full justify-between border-input font-normal data-[empty=true]:text-muted-foreground",
              className
            )}
            {...props}
          />
        }
      >
        {from && to ? label : (placeholder ?? t("common.pickADateRange"))}
        <RiCalendar2Line className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-auto p-0 sm:flex-row"
      >
        {presets.length > 0 ? (
          <div className="flex shrink-0 flex-row flex-wrap gap-1 border-b border-border p-2 sm:w-36 sm:flex-col sm:border-b-0 sm:border-r">
            {presets.map((preset) => (
              <Button
                key={preset.labelKey}
                variant={
                  !custom && preset === activePreset ? "secondary" : "ghost"
                }
                size="sm"
                className="justify-start font-normal"
                onClick={() => commit(preset.getRange())}
              >
                {t(preset.labelKey)}
              </Button>
            ))}

            {/* The one option that applies nothing: it marks a range no preset can
                express, and clicking it leaves the popup open on the calendar
                rather than committing anything. */}
            <Button
              variant={custom || !activePreset ? "secondary" : "ghost"}
              size="sm"
              className="justify-start font-normal"
              onClick={() => setCustom(true)}
            >
              {t(DATE_RANGE_CUSTOM_KEY)}
            </Button>
          </div>
        ) : null}
        <Calendar
          className="mx-auto"
          mode="range"
          captionLayout="dropdown"
          {...captionMonthRange()}
          numberOfMonths={months}
          selected={selected}
          defaultMonth={from}
          onSelect={(_range, day) => {
            if (!anchor) {
              setAnchor(day)

              return
            }

            const [earlier, later] = day < anchor ? [day, anchor] : [anchor, day]

            commit({
              from: formatIsoDate(earlier),
              to: formatIsoDate(later),
            })
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker, DateRangePicker }
