import {
  fieldErrors,
  isFieldInvalid,
  useLanguageForm,
  useUpdateLanguageMutation,
} from "@budget-manager/client/react";
import { type Locale, LocaleLabelMap, LOCALES } from "@budget-manager/i18n";
import { useTranslate } from "@budget-manager/i18n/react";
import { useSelector } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { SettingsSection } from "@/modules/settings/components/settings-section";

/**
 * Each language names itself, so the options are the one thing on this screen that is
 * *not* translated — a reader looking for their own language in a list they cannot read
 * finds "Português", never "Portuguese".
 */
const LANGUAGE_ITEMS = LOCALES.map((locale) => ({
  label: LocaleLabelMap[locale],
  value: locale,
}));

export function LanguageForm({ preferredLocale }: { preferredLocale: Locale }) {
  const t = useTranslate();
  const updateMutation = useUpdateLanguageMutation();

  const form = useLanguageForm({
    defaultValues: { preferredLocale },
    onSubmit: (values) => updateMutation.mutateAsync(values),
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <SettingsSection
      title={t("settings.language.title")}
      description={t("settings.language.description")}
      footer={
        <Button
          label={isSubmitting ? t("common.saving") : t("settings.language.submit")}
          loading={isSubmitting}
          onPress={() => void form.handleSubmit()}
        />
      }
    >
      <FieldGroup>
        <form.Field name="preferredLocale">
          {(field) => (
            <Field
              label={t("settings.language.label")}
              description={t("settings.language.hint")}
              errors={fieldErrors(field)}
            >
              <Select
                label={t("settings.language.label")}
                items={LANGUAGE_ITEMS}
                value={field.state.value}
                invalid={isFieldInvalid(field)}
                onValueChange={(value) => field.handleChange(value as Locale)}
              />
            </Field>
          )}
        </form.Field>
      </FieldGroup>
    </SettingsSection>
  );
}
