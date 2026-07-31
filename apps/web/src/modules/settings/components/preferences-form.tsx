import {
  type WalletCurrency,
  WalletCurrencyLabelMap,
} from "@budget-manager/schemas";
import { Button } from "@budget-manager/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@budget-manager/ui/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@budget-manager/ui/components/select";
import { useId } from "react";
import { usePreferencesForm } from "../hooks/use-preferences-form";
import { useUpdatePreferencesMutation } from "../mutations/use-user-mutation";
import { SettingsSection } from "./settings-section";

const CURRENCY_ITEMS = Object.entries(WalletCurrencyLabelMap).map(
  ([value, label]) => ({ label, value }),
);

export function PreferencesForm({
  preferredCurrency,
}: {
  preferredCurrency: WalletCurrency;
}) {
  const formId = useId();
  const updateMutation = useUpdatePreferencesMutation();

  const form = usePreferencesForm({
    defaultValues: { preferredCurrency },
    onSubmit: (values) => updateMutation.mutateAsync(values),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <SettingsSection
      title="Defaults"
      description="What a new account starts as, and which currency the dashboard opens on."
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save defaults"}
            </Button>
          )}
        </form.Subscribe>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <FieldGroup>
          <form.Field name="preferredCurrency">
            {(field) => {
              const showErrors =
                field.state.meta.isTouched && !field.state.meta.isValid;
              const errorId = `${field.name}-error`;

              return (
                <Field data-invalid={showErrors}>
                  <FieldLabel htmlFor={field.name}>Default currency</FieldLabel>
                  <Select
                    items={CURRENCY_ITEMS}
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onValueChange={(value) =>
                      field.handleChange(value as WalletCurrency)
                    }
                  >
                    <SelectTrigger
                      aria-invalid={showErrors || undefined}
                      aria-describedby={showErrors ? errorId : undefined}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Preselected when you create a wallet or a credit card, and
                    the currency the dashboard scopes to when you have more than
                    one.
                  </FieldDescription>
                  <FieldError
                    id={errorId}
                    errors={showErrors ? field.state.meta.errors : []}
                  />
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>
      </form>
    </SettingsSection>
  );
}
