import { authClient } from "@/lib/auth-client";
import { useTranslate } from "@budget-manager/i18n/react";
import {
  toPreferredCurrency,
  toPreferredLocale,
} from "@budget-manager/schemas";
import { buttonVariants } from "@budget-manager/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@budget-manager/ui/components/empty";
import { Skeleton } from "@budget-manager/ui/components/skeleton";
import { Link } from "@tanstack/react-router";
import { AppearanceForm } from "../components/appearance-form";
import { LanguageForm } from "../components/language-form";
import { PasswordForm } from "../components/password-form";
import { PreferencesForm } from "../components/preferences-form";
import { ProfileForm } from "../components/profile-form";

export default function UserSettingsPage() {
  const t = useTranslate();
  const { data: session, isPending } = authClient.useSession();

  return (
    <div className="pb-8">
      <header className="flex flex-col gap-1 pt-6 pb-4 sm:pt-10">
        <h1 className="text-xl font-bold tracking-wide uppercase sm:text-2xl">
          {t("settings.title")}
        </h1>
        <p className="text-xs text-muted-foreground">
          {t("settings.description")}
        </p>
      </header>

      {isPending ? (
        <div
          role="status"
          aria-label={t("settings.loading")}
          className="flex max-w-2xl flex-col gap-6"
        >
          {[0, 1, 2, 3, 4].map((key) => (
            <Skeleton key={key} className="h-52 w-full" />
          ))}
        </div>
      ) : session ? (
        <div className="flex max-w-2xl flex-col gap-6">
          <ProfileForm name={session.user.name} email={session.user.email} />
          <PasswordForm />
          <AppearanceForm />
          <LanguageForm
            preferredLocale={toPreferredLocale(session.user.preferredLocale)}
          />
          <PreferencesForm
            preferredCurrency={toPreferredCurrency(
              session.user.preferredCurrency,
            )}
          />
        </div>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>{t("auth.sessionExpired")}</EmptyTitle>
            <EmptyDescription>
              {t("auth.signInAgainToManageSettings")}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/login" className={buttonVariants()}>
              {t("nav.signIn")}
            </Link>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
