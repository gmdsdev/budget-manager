import { fieldErrors, isFieldInvalid } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { SignInFormSchema } from "@budget-manager/schemas";
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

export function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const t = useTranslate();
  const router = useRouter();

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        { email: value.email, password: value.password },
        {
          onSuccess: () => {
            router.replace("/");
            toast.success(t("auth.signInSuccessful"));
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    // The two forms that validate `onSubmit` only — there is nothing to
    // revalidate before the one submit that matters. The schema is the same one
    // `/settings/user` writes through, so sign-up cannot accept a name the
    // profile form would then refuse to save.
    validators: { onSubmit: SignInFormSchema },
  });

  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <AuthCard title={t("auth.welcomeBack")}>
      <FieldGroup>
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
                autoComplete="current-password"
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
          label={isSubmitting ? t("auth.submitting") : t("auth.signIn")}
          loading={isSubmitting}
          onPress={() => void form.handleSubmit()}
        />
        <Button
          variant="link"
          label={t("auth.needAnAccount")}
          onPress={onSwitchToSignUp}
        />
      </View>
    </AuthCard>
  );
}
