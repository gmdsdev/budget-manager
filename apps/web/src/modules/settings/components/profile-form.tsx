import { Button } from "@budget-manager/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@budget-manager/ui/components/field";
import { useTranslate } from "@budget-manager/i18n/react";
import { Input } from "@budget-manager/ui/components/input";
import { useId } from "react";
import { useProfileForm } from "@budget-manager/client/react";
import { useUpdateProfileMutation } from "@budget-manager/client/react";
import { SettingsSection } from "./settings-section";

export function ProfileForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const t = useTranslate();
  const formId = useId();
  const emailId = useId();
  const updateMutation = useUpdateProfileMutation();

  const form = useProfileForm({
    defaultValues: { name },
    onSubmit: (values) => updateMutation.mutateAsync(values),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <SettingsSection
      title={t("settings.profile.title")}
      description={t("settings.profile.description")}
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("settings.profile.submit")}
            </Button>
          )}
        </form.Subscribe>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <FieldGroup>
          <form.Field name="name">
            {(field) => {
              const showErrors =
                field.state.meta.isTouched && !field.state.meta.isValid;
              const errorId = `${field.name}-error`;

              return (
                <Field data-invalid={showErrors}>
                  <FieldLabel htmlFor={field.name}>{t("common.name")}</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    autoComplete="name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
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

          <Field>
            <FieldLabel htmlFor={emailId}>{t("auth.email")}</FieldLabel>
            <Input
              id={emailId}
              type="email"
              value={email}
              readOnly
              className="text-muted-foreground"
            />
            <FieldDescription>
              {t("settings.profile.emailHint")}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </SettingsSection>
  );
}
