import { Button } from "@budget-manager/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@budget-manager/ui/components/field";
import { Input } from "@budget-manager/ui/components/input";
import { useId } from "react";
import { usePasswordForm } from "../hooks/use-password-form";
import { useChangePasswordMutation } from "../mutations/use-user-mutation";
import { SettingsSection } from "./settings-section";

const PASSWORD_FIELDS = [
  {
    name: "currentPassword",
    label: "Current password",
    autoComplete: "current-password",
  },
  {
    name: "newPassword",
    label: "New password",
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    label: "Confirm new password",
    autoComplete: "new-password",
  },
] as const;

export function PasswordForm() {
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
      title="Password"
      description="Changing your password signs you out everywhere else."
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting ? "Changing…" : "Change password"}
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
                    <FieldLabel htmlFor={field.name}>{entry.label}</FieldLabel>
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
