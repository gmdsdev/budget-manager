import { type Locale, LOCALES, LocaleLabelMap } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
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
import { useLanguageForm } from "@budget-manager/client/react";
import { useUpdateLanguageMutation } from "@budget-manager/client/react";
import { SettingsSection } from "./settings-section";

/**
 * Each language names itself, so the options are the one thing on this screen
 * that is *not* translated — a reader looking for their own language in a list
 * they cannot read finds "Português", never "Portuguese".
 */
const LANGUAGE_ITEMS = LOCALES.map((locale) => ({
  label: LocaleLabelMap[locale],
  value: locale,
}));

export function LanguageForm({
  preferredLocale,
}: {
  preferredLocale: Locale;
}) {
  const t = useTranslate();
  const formId = useId();
  const updateMutation = useUpdateLanguageMutation();

  const form = useLanguageForm({
    defaultValues: { preferredLocale },
    onSubmit: (values) => updateMutation.mutateAsync(values),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <SettingsSection
      title={t("settings.language.title")}
      description={t("settings.language.description")}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting
                ? t("common.saving")
                : t("settings.language.submit")}
            </Button>
          )}
        </form.Subscribe>
      }
    >
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
                    {t("settings.language.label")}
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
                  <FieldDescription>
                    {t("settings.language.hint")}
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
