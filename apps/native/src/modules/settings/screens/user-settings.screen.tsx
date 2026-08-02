import { useTranslate } from "@budget-manager/i18n/react";
import { toPreferredCurrency, toPreferredLocale } from "@budget-manager/schemas";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { PageHeader, Screen } from "@/components/ui/screen";
import { SkeletonList } from "@/components/ui/skeleton";
import { useSignOut } from "@/hooks/use-sign-out";
import { authClient } from "@/lib/auth-client";
import { AppearanceForm } from "@/modules/settings/components/appearance-form";
import { LanguageForm } from "@/modules/settings/components/language-form";
import { PasswordForm } from "@/modules/settings/components/password-form";
import { PreferencesForm } from "@/modules/settings/components/preferences-form";
import { ProfileForm } from "@/modules/settings/components/profile-form";
import { SPACING } from "@/theme/tokens";

export function UserSettingsScreen() {
  const t = useTranslate();
  const { data: session, isPending } = authClient.useSession();
  const signOut = useSignOut();

  return (
    <Screen>
      <PageHeader title={t("settings.title")} description={t("settings.description")} />

      {isPending ? (
        <SkeletonList label={t("settings.loading")} count={4} height={140} />
      ) : session ? (
        <View style={{ gap: SPACING.lg }}>
          <ProfileForm name={session.user.name} email={session.user.email} />
          <PasswordForm />
          <AppearanceForm />
          <LanguageForm
            preferredLocale={toPreferredLocale(session.user.preferredLocale)}
          />
          <PreferencesForm
            preferredCurrency={toPreferredCurrency(session.user.preferredCurrency)}
          />
          <Button
            variant="destructive"
            label={t("nav.signOut")}
            onPress={signOut}
          />
        </View>
      ) : (
        <Empty
          title={t("auth.sessionExpired")}
          description={t("auth.signInAgainToManageSettings")}
        />
      )}
    </Screen>
  );
}
