import {
  RecurrenceType,
  RecurrenceTypeLabelMap,
} from "@budget-manager/schemas";
import { Checkbox } from "@budget-manager/ui/components/checkbox";
import { DatePicker } from "@budget-manager/ui/components/date-picker";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@budget-manager/ui/components/field";
import { Input } from "@budget-manager/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@budget-manager/ui/components/select";

export type RepeatState = {
  /** Off keeps this a one-off transaction. */
  enabled: boolean;
  recurrenceType: RecurrenceType;
  interval: number;
  installments: number | null;
  endsOn: string | null;
};

export const NO_REPEAT_STATE: RepeatState = {
  enabled: false,
  recurrenceType: RecurrenceType.MONTHLY,
  interval: 1,
  installments: 12,
  endsOn: null,
};

const RECURRENCE_ITEMS = Object.values(RecurrenceType).map((type) => ({
  label: RecurrenceTypeLabelMap[type],
  value: type,
}));

const UNIT: Record<RecurrenceType, string> = {
  [RecurrenceType.FIXED]: "months",
  [RecurrenceType.WEEKLY]: "weeks",
  [RecurrenceType.MONTHLY]: "months",
  [RecurrenceType.YEARLY]: "years",
};

/**
 * Recurrence lives on the transaction form itself: a repeating transaction is a
 * transaction with recurrence fields, not a separate kind of record. Per the
 * design draft it hides behind a single checkbox at the end of the form.
 */
export function RepeatsFields({
  value,
  onChange,
}: {
  value: RepeatState;
  onChange: (next: RepeatState) => void;
}) {
  const isFixed = value.recurrenceType === RecurrenceType.FIXED;

  return (
    <>
      <Field orientation="horizontal">
        <Checkbox
          id="transaction-recurrence"
          checked={value.enabled}
          onCheckedChange={(checked) =>
            onChange({ ...value, enabled: checked === true })
          }
        />
        <FieldLabel htmlFor="transaction-recurrence">
          Enable recurrence
        </FieldLabel>
      </Field>

      {value.enabled && (
        <>
          <Field>
            <FieldLabel htmlFor="transaction-repeats">
              Recurrence type
            </FieldLabel>
            <Select<string>
              items={RECURRENCE_ITEMS}
              id="transaction-repeats"
              value={value.recurrenceType}
              onValueChange={(next) =>
                onChange({
                  ...value,
                  recurrenceType: (next ??
                    RecurrenceType.MONTHLY) as RecurrenceType,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="transaction-repeat-interval">Every</FieldLabel>
            <Input
              id="transaction-repeat-interval"
              type="number"
              min={1}
              value={value.interval}
              onChange={(event) =>
                onChange({ ...value, interval: Number(event.target.value) })
              }
            />
            <FieldDescription>
              {UNIT[value.recurrenceType]} between occurrences.
            </FieldDescription>
          </Field>

          {isFixed ? (
            <Field>
              <FieldLabel htmlFor="transaction-repeat-installments">
                Installments
              </FieldLabel>
              <Input
                id="transaction-repeat-installments"
                type="number"
                min={1}
                value={value.installments ?? ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    installments: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }
              />
            </Field>
          ) : (
            <Field>
              <FieldLabel htmlFor="transaction-repeat-ends">
                Repeat until
              </FieldLabel>
              <DatePicker
                id="transaction-repeat-ends"
                clearable
                placeholder="No end date"
                value={value.endsOn}
                onValueChange={(next) =>
                  onChange({ ...value, endsOn: next || null })
                }
              />
              <FieldDescription>
                Leave empty to keep repeating; a year is scheduled at a time.
              </FieldDescription>
            </Field>
          )}
        </>
      )}
    </>
  );
}
