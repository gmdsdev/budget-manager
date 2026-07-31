import { Button } from "@budget-manager/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@budget-manager/ui/components/field";
import { Input } from "@budget-manager/ui/components/input";
import { useId } from "react";
import { useProfileForm } from "../hooks/use-profile-form";
import { useUpdateProfileMutation } from "../mutations/use-user-mutation";
import { SettingsSection } from "./settings-section";

export function ProfileForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
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
      title="Profile"
      description="How your account is identified across the app."
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save profile"}
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
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
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
            <FieldLabel htmlFor={emailId}>Email</FieldLabel>
            <Input
              id={emailId}
              type="email"
              value={email}
              readOnly
              className="text-muted-foreground"
            />
            <FieldDescription>
              Your sign-in email cannot be changed here.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </SettingsSection>
  );
}
