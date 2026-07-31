import * as React from "react"
import { RiCalendar2Line } from "@remixicon/react"
import type { DateRange } from "react-day-picker"

import { cn } from "@budget-manager/ui/lib/utils"
import {
  captionMonthRange,
  DATE_RANGE_PRESETS,
  formatIsoDate,
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

const DAY_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
}

function formatDay(date: Date) {
  return date.toLocaleDateString(undefined, DAY_FORMAT)
}

function formatRange(from: Date, to: Date) {
  const start =
    from.getFullYear() === to.getFullYear()
      ? from.toLocaleDateString(undefined, { day: "numeric", month: "short" })
      : formatDay(from)

  return `${start} – ${formatDay(to)}`
}

function DatePicker({
  value,
  onValueChange,
  id,
  name,
  placeholder = "Pick a date",
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
              "w-full justify-between border-input font-normal tracking-normal normal-case shadow-none active:translate-x-0 active:translate-y-0 data-[empty=true]:text-muted-foreground",
              className
            )}
            {...props}
          />
        }
      >
        {selected ? formatDay(selected) : placeholder}
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
            Clear
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
 */
function DateRangePicker({
  value,
  onValueChange,
  id,
  placeholder = "Pick a date range",
  presets = DATE_RANGE_PRESETS,
  numberOfMonths = 2,
  disabled,
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
  className?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  "aria-label"?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [anchor, setAnchor] = React.useState<Date | undefined>(undefined)
  const from = parseIsoDate(value.from)
  const to = parseIsoDate(value.to)
  // Two months side by side is wider than a phone, and a popup that scrolls
  // sideways hides half the range being picked.
  const isCompact = useIsCompact()
  const months = isCompact ? 1 : numberOfMonths

  const selected: DateRange | undefined = anchor
    ? { from: anchor, to: anchor }
    : from
      ? { from, to }
      : undefined

  function commit(next: DateRangeValue) {
    setAnchor(undefined)
    onValueChange(next)
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setAnchor(undefined)
        setOpen(next)
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            id={id}
            disabled={disabled}
            data-empty={!from || !to}
            className={cn(
              "w-full justify-between border-input font-normal tracking-normal normal-case shadow-none active:translate-x-0 active:translate-y-0 data-[empty=true]:text-muted-foreground",
              className
            )}
            {...props}
          />
        }
      >
        {from && to ? formatRange(from, to) : placeholder}
        <RiCalendar2Line className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-auto p-0 sm:flex-row"
      >
        {presets.length > 0 ? (
          <div className="flex shrink-0 flex-row flex-wrap gap-1 border-b border-border p-2 sm:w-36 sm:flex-col sm:border-b-0 sm:border-r">
            {presets.map((preset) => {
              const range = preset.getRange()
              const active = range.from === value.from && range.to === value.to

              return (
                <Button
                  key={preset.label}
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className="justify-start font-normal tracking-normal normal-case shadow-none active:translate-x-0 active:translate-y-0"
                  onClick={() => commit(range)}
                >
                  {preset.label}
                </Button>
              )
            })}
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
