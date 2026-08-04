import { Button } from "@budget-manager/ui/components/button";
import { Input } from "@budget-manager/ui/components/input";
import { Label } from "@budget-manager/ui/components/label";
import { useTranslate } from "@budget-manager/i18n/react";
import { SignInFormSchema } from "@budget-manager/schemas";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { invalidateSessionCache } from "@/lib/session";

import Loader from "./loader";
import { KivoLogo } from "./logo";

export default function SignInForm({
  onSwitchToSignUp,
}: {
  onSwitchToSignUp: () => void;
}) {
  const translate = useTranslate();
  const navigate = useNavigate({
    from: "/",
  });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            invalidateSessionCache();
            void navigate({
              to: "/dashboard",
            });
            toast.success(translate("auth.signInSuccessful"));
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      // The shared schema, whose Zod messages resolve at parse time — so they
      // follow the language the reader picked rather than the one the module
      // was loaded in.
      onSubmit: SignInFormSchema,
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 dark:border-transparent">
      <div className="mb-6 flex flex-col items-center gap-6">
        <KivoLogo className="h-12" />
        <h1 className="text-center text-3xl font-bold tracking-[-0.03em]">
          {translate("auth.welcomeBack")}
        </h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{translate("auth.email")}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-xs text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{translate("auth.password")}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-xs text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? translate("auth.submitting") : translate("auth.signIn")}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignUp}
          className="text-link"
        >
          {translate("auth.needAnAccount")}
        </Button>
      </div>
    </div>
  );
}
