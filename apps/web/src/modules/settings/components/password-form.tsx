import { Button } from "@budget-manager/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@budget-manager/ui/components/field";
import { useTranslate } from "@budget-manager/i18n/react";
import { Input } from "@budget-manager/ui/components/input";
import { useId } from "react";
import { usePasswordForm } from "@budget-manager/client/react";
import { useChangePasswordMutation } from "@budget-manager/client/react";
import { SettingsSection } from "./settings-section";

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
  const formId = useId();
  const changeMutation = useChangePasswordMutation();

  const form = usePasswordForm({
    onSubmit: async (values) => {
      await changeMutation.mutateAsync(values);
      form.reset();
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <SettingsSection
      title={t("settings.password.title")}
      description={t("settings.password.description")}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting
                ? t("settings.password.submitting")
                : t("settings.password.submit")}
            </Button>
          )}
        </form.Subscribe>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <FieldGroup>
          {PASSWORD_FIELDS.map((entry) => (
            <form.Field key={entry.name} name={entry.name}>
              {(field) => {
                const showErrors =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                const errorId = `${field.name}-error`;

                return (
                  <Field data-invalid={showErrors}>
                    <FieldLabel htmlFor={field.name}>{t(entry.label)}</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      autoComplete={entry.autoComplete}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={showErrors || undefined}
                      aria-describedby={showErrors ? errorId : undefined}
                    />
                    <FieldError
                      id={errorId}
                      errors={showErrors ? field.state.meta.errors : []}
                    />
                  </Field>
                );
              }}
            </form.Field>
          ))}
        </FieldGroup>
      </form>
    </SettingsSection>
  );
}
