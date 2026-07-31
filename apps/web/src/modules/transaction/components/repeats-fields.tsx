import { useEnumLabels } from "@/lib/enum-labels";
import type { MessageKey } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
import { RECURRENCE_YEARS, RecurrenceType } from "@budget-manager/schemas";
import { Checkbox } from "@budget-manager/ui/components/checkbox";
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
};

export const NO_REPEAT_STATE: RepeatState = {
  enabled: false,
  recurrenceType: RecurrenceType.MONTHLY,
  interval: 1,
  installments: 12,
};

const UNIT = {
  [RecurrenceType.FIXED]: "recurring.unit.months",
  [RecurrenceType.WEEKLY]: "recurring.unit.weeks",
  [RecurrenceType.MONTHLY]: "recurring.unit.months",
  [RecurrenceType.YEARLY]: "recurring.unit.years",
} as const satisfies Record<RecurrenceType, MessageKey>;

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
  const t = useTranslate();
  const labels = useEnumLabels();

  const recurrenceItems = Object.values(RecurrenceType).map((type) => ({
    label: labels.recurrenceType(type),
    value: type,
  }));

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
          {t("transaction.field.enableRecurrence")}
        </FieldLabel>
      </Field>

      {value.enabled && (
        <>
          <Field>
            <FieldLabel htmlFor="transaction-repeats">
              {t("transaction.field.recurrenceType")}
            </FieldLabel>
            <Select<string>
              items={recurrenceItems}
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
                {recurrenceItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isFixed && (
              <FieldDescription>
                {t("transaction.field.recurrenceHint", {
                  years: RECURRENCE_YEARS,
                })}
              </FieldDescription>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="transaction-repeat-interval">
              {t("recurring.field.every")}
            </FieldLabel>
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
              {t("recurring.field.intervalHint", {
                unit: t(UNIT[value.recurrenceType]),
              })}
            </FieldDescription>
          </Field>

          {isFixed && (
            <Field>
              <FieldLabel htmlFor="transaction-repeat-installments">
                {t("recurring.field.installments")}
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
          )}
        </>
      )}
    </>
  );
}
