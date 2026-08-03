import { fieldErrors, isFieldInvalid } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { SignUpFormSchema } from "@budget-manager/schemas";
import { useForm, useSelector } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { SPACING } from "@/theme/tokens";

export function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const t = useTranslate();
  const router = useRouter();

  const form = useForm({
    defaultValues: { email: "", password: "", name: "" },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        { email: value.email, password: value.password, name: value.name },
        {
          onSuccess: () => {
            router.replace("/");
            toast.success(t("auth.signUpSuccessful"));
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: { onSubmit: SignUpFormSchema },
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <AuthCard title={t("auth.createAccount")}>
      <FieldGroup>
        <form.Field name="name">
          {(field) => (
            <Field label={t("auth.name")} errors={fieldErrors(field)}>
              <Input
                value={field.state.value}
                invalid={isFieldInvalid(field)}
                accessibilityLabel={t("auth.name")}
                autoComplete="name"
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <Field label={t("auth.email")} errors={fieldErrors(field)}>
              <Input
                value={field.state.value}
                invalid={isFieldInvalid(field)}
                accessibilityLabel={t("auth.email")}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <Field label={t("auth.password")} errors={fieldErrors(field)}>
              <Input
                value={field.state.value}
                invalid={isFieldInvalid(field)}
                accessibilityLabel={t("auth.password")}
                secureTextEntry
                autoComplete="new-password"
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
              />
            </Field>
          )}
        </form.Field>
      </FieldGroup>

      <View style={{ gap: SPACING.sm }}>
        <Button
          size="lg"
          label={isSubmitting ? t("auth.submitting") : t("auth.signUp")}
          loading={isSubmitting}
          onPress={() => void form.handleSubmit()}
        />
        <Button
          variant="link"
          label={t("auth.alreadyHaveAnAccount")}
          onPress={onSwitchToSignIn}
        />
      </View>
    </AuthCard>
  );
}
