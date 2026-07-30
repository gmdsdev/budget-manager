import * as React from "react"
import { RiCalendar2Line } from "@remixicon/react"
import { format, isValid, parseISO } from "date-fns"

import { cn } from "@budget-manager/ui/lib/utils"
import { Button } from "@budget-manager/ui/components/button"
import { Calendar } from "@budget-manager/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@budget-manager/ui/components/popover"

const ISO_DATE = "yyyy-MM-dd"

function parseIsoDate(value: string | null | undefined) {
  if (!value) {
    return undefined
  }

  const parsed = parseISO(value)

  return isValid(parsed) ? parsed : undefined
}

function formatIsoDate(date: Date) {
  return format(date, ISO_DATE)
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
              "w-full justify-between border-input font-normal data-[empty=true]:text-muted-foreground dark:bg-input/30",
              className
            )}
            {...props}
          />
        }
      >
        {selected
          ? selected.toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : placeholder}
        <RiCalendar2Line className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-0 p-0">
        <Calendar
          mode="single"
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

export { DatePicker, formatIsoDate, parseIsoDate }
