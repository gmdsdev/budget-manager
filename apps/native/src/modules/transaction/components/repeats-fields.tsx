import { useEnumLabels } from "@budget-manager/client/react";
import type { MessageKey } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
import { RECURRENCE_YEARS, RecurrenceType } from "@budget-manager/schemas";

import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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
 * transaction with recurrence fields, not a separate kind of record — which is why
 * there is no recurring screen. It hides behind a single checkbox at the end of the
 * form, and choosing a schedule routes the same submit to `recurring.create`.
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
      <Checkbox
        checked={value.enabled}
        onCheckedChange={(checked) => onChange({ ...value, enabled: checked })}
        label={t("transaction.field.enableRecurrence")}
      />

      {value.enabled && (
        <>
          <Field
            label={t("transaction.field.recurrenceType")}
            description={
              isFixed
                ? undefined
                : t("transaction.field.recurrenceHint", { years: RECURRENCE_YEARS })
            }
          >
            <Select
              label={t("transaction.field.recurrenceType")}
              items={recurrenceItems}
              value={value.recurrenceType}
              onValueChange={(next) =>
                onChange({
                  ...value,
                  recurrenceType: (next || RecurrenceType.MONTHLY) as RecurrenceType,
                })
              }
            />
          </Field>

          <Field
            label={t("recurring.field.every")}
            description={t("recurring.field.intervalHint", {
              unit: t(UNIT[value.recurrenceType]),
            })}
          >
            <Input
              keyboardType="number-pad"
              accessibilityLabel={t("recurring.field.every")}
              value={`${value.interval}`}
              onChangeText={(text) => onChange({ ...value, interval: Number(text || 0) })}
            />
          </Field>

          {isFixed && (
            <Field label={t("recurring.field.installments")}>
              <Input
                keyboardType="number-pad"
                accessibilityLabel={t("recurring.field.installments")}
                value={value.installments === null ? "" : `${value.installments}`}
                onChangeText={(text) =>
                  onChange({ ...value, installments: text ? Number(text) : null })
                }
              />
            </Field>
          )}
        </>
      )}
    </>
  );
}
