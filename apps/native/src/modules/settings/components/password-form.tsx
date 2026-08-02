import {
  fieldErrors,
  isFieldInvalid,
  useChangePasswordMutation,
  usePasswordForm,
} from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { useSelector } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SettingsSection } from "@/modules/settings/components/settings-section";

const PASSWORD_FIELDS = [
  {
    name: "currentPassword",
    label: "settings.password.current",
    autoComplete: "current-password",
  },
  {
    name: "newPassword",
    label: "settings.password.new",
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    label: "settings.password.confirm",
    autoComplete: "new-password",
  },
] as const;

export function PasswordForm() {
  const t = useTranslate();
  const changeMutation = useChangePasswordMutation();

  const form = usePasswordForm({
    onSubmit: async (values) => {
      await changeMutation.mutateAsync(values);
      form.reset();
    },
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <SettingsSection
      title={t("settings.password.title")}
      description={t("settings.password.description")}
      footer={
        <Button
          label={
            isSubmitting
              ? t("settings.password.submitting")
              : t("settings.password.submit")
          }
          loading={isSubmitting}
          onPress={() => void form.handleSubmit()}
        />
      }
    >
      <FieldGroup>
        {PASSWORD_FIELDS.map((entry) => (
          <form.Field key={entry.name} name={entry.name}>
            {(field) => (
              <Field label={t(entry.label)} errors={fieldErrors(field)}>
                <Input
                  value={field.state.value}
                  invalid={isFieldInvalid(field)}
                  accessibilityLabel={t(entry.label)}
                  secureTextEntry
                  autoComplete={entry.autoComplete}
                  onBlur={field.handleBlur}
                  onChangeText={field.handleChange}
                />
              </Field>
            )}
          </form.Field>
        ))}
      </FieldGroup>
    </SettingsSection>
  );
}
