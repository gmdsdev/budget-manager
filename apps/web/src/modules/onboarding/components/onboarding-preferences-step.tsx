import {
  useEnumLabels,
  useOnboardingPreferencesForm,
  useOnboardingPreferencesMutation,
  usePreferredCurrency,
} from "@budget-manager/client/react";
import { LOCALES, LocaleLabelMap, type Locale } from "@budget-manager/i18n";
import { useLocale, useTranslate } from "@budget-manager/i18n/react";
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

/**
 * Each language names itself — a reader looking for their own language in a
 * list they cannot read finds "Português", never "Portuguese".
 */
const LANGUAGE_ITEMS = LOCALES.map((locale) => ({
  label: LocaleLabelMap[locale],
  value: locale,
}));

export function OnboardingPreferencesStep({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const formId = useId();
  const locale = useLocale();
  const preferredCurrency = usePreferredCurrency();
  const saveMutation = useOnboardingPreferencesMutation();

  const currencyItems = Object.values(WalletCurrency).map((currency) => ({
    label: labels.currency(currency),
    value: currency,
  }));

  const form = useOnboardingPreferencesForm({
    defaultValues: { preferredLocale: locale, preferredCurrency },
    onSubmit: async (values) => {
      await saveMutation.mutateAsync(values);
      onSaved();
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <>
      <form id={formId} onSubmit={handleSubmit}>
        <FieldGroup>
          <form.Field name="preferredLocale">
            {(field) => {
              const showErrors =
                field.state.meta.isTouched && !field.state.meta.isValid;
              const errorId = `${field.name}-error`;

              return (
                <Field data-invalid={showErrors}>
                  <FieldLabel htmlFor={field.name}>
                    {t("onboarding.preferences.language")}
                  </FieldLabel>
                  <Select
                    items={LANGUAGE_ITEMS}
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onValueChange={(value) =>
                      field.handleChange(value as Locale)
                    }
                  >
                    <SelectTrigger
                      aria-invalid={showErrors || undefined}
                      aria-describedby={showErrors ? errorId : undefined}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError
                    id={errorId}
                    errors={showErrors ? field.state.meta.errors : []}
                  />
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="preferredCurrency">
            {(field) => {
              const showErrors =
                field.state.meta.isTouched && !field.state.meta.isValid;
              const errorId = `${field.name}-error`;

              return (
                <Field data-invalid={showErrors}>
                  <FieldLabel htmlFor={field.name}>
                    {t("onboarding.preferences.currency")}
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
                    {t("onboarding.preferences.currencyHint")}
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

      <div className="flex justify-end pt-6">
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting
                ? t("common.saving")
                : t("onboarding.preferences.submit")}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </>
  );
}
