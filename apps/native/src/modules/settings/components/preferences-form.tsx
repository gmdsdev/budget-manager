import {
  fieldErrors,
  isFieldInvalid,
  useEnumLabels,
  usePreferencesForm,
  useUpdatePreferencesMutation,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { WalletCurrency } from "@budget-manager/schemas";
import { useSelector } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { SettingsSection } from "@/modules/settings/components/settings-section";

export function PreferencesForm({
  preferredCurrency,
}: {
  preferredCurrency: WalletCurrency;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const updateMutation = useUpdatePreferencesMutation();

  const currencyItems = Object.values(WalletCurrency).map((currency) => ({
    label: labels.currency(currency),
    value: currency,
  }));

  const form = usePreferencesForm({
    defaultValues: { preferredCurrency },
    onSubmit: (values) => updateMutation.mutateAsync(values),
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <SettingsSection
      title={t("settings.defaults.title")}
      description={t("settings.defaults.description")}
      footer={
        <Button
          label={isSubmitting ? t("common.saving") : t("settings.defaults.submit")}
          loading={isSubmitting}
          onPress={() => void form.handleSubmit()}
        />
      }
    >
      <FieldGroup>
        <form.Field name="preferredCurrency">
          {(field) => (
            <Field
              label={t("settings.defaults.currency")}
              description={t("settings.defaults.currencyHint")}
              errors={fieldErrors(field)}
            >
              <Select
                label={t("settings.defaults.currency")}
                items={currencyItems}
                value={field.state.value}
                invalid={isFieldInvalid(field)}
                onValueChange={(value) => field.handleChange(value as WalletCurrency)}
              />
            </Field>
          )}
        </form.Field>
      </FieldGroup>
    </SettingsSection>
  );
}
