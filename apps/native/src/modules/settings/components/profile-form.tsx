import {
  fieldErrors,
  isFieldInvalid,
  useProfileForm,
  useUpdateProfileMutation,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useSelector } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SettingsSection } from "@/modules/settings/components/settings-section";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const t = useTranslate();
  const updateMutation = useUpdateProfileMutation();

  const form = useProfileForm({
    defaultValues: { name },
    onSubmit: (values) => updateMutation.mutateAsync(values),
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <SettingsSection
      title={t("settings.profile.title")}
      description={t("settings.profile.description")}
      footer={
        <Button
          label={isSubmitting ? t("common.saving") : t("settings.profile.submit")}
          loading={isSubmitting}
          onPress={() => void form.handleSubmit()}
        />
      }
    >
      <FieldGroup>
        <form.Field name="name">
          {(field) => (
            <Field label={t("common.name")} errors={fieldErrors(field)}>
              <Input
                value={field.state.value}
                invalid={isFieldInvalid(field)}
                accessibilityLabel={t("common.name")}
                autoComplete="name"
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
              />
            </Field>
          )}
        </form.Field>

        <Field
          label={t("auth.email")}
          description={t("settings.profile.emailHint")}
        >
          <Input value={email} editable={false} accessibilityLabel={t("auth.email")} />
        </Field>
      </FieldGroup>
    </SettingsSection>
  );
}
