import { useEnumLabels } from "@/lib/enum-labels";
import { useTranslate } from "@budget-manager/i18n/react";
import { WalletCurrency } from "@budget-manager/schemas";
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

export function PreferencesForm({
  preferredCurrency,
}: {
  preferredCurrency: WalletCurrency;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const formId = useId();

  const currencyItems = Object.values(WalletCurrency).map((currency) => ({
    label: labels.currency(currency),
    value: currency,
  }));
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
      title={t("settings.defaults.title")}
      description={t("settings.defaults.description")}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("settings.defaults.submit")}
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
                  <FieldLabel htmlFor={field.name}>
                    {t("settings.defaults.currency")}
                  </FieldLabel>
                  <Select
                    items={currencyItems}
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
                      {currencyItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {t("settings.defaults.currencyHint")}
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
