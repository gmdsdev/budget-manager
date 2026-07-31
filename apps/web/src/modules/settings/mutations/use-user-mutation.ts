import { useApiMutation } from "@/hooks/use-api-mutation";
import { authClient } from "@/lib/auth-client";
import { runAuthAction } from "@/lib/auth-error";
import { invalidateSessionCache } from "@/lib/session";
import { t } from "@budget-manager/i18n";
import type {
  ChangePasswordFormDto,
  LanguageFormDto,
  PreferencesFormDto,
  ProfileFormDto,
} from "@budget-manager/schemas";

export function useUpdateProfileMutation() {
  return useApiMutation<void, ProfileFormDto>({
    mutationFn: async ({ name }) => {
      await runAuthAction(authClient.updateUser({ name }));
      invalidateSessionCache();
    },
    successMessage: t("settings.profile.updated"),
  });
}

export function useChangePasswordMutation() {
  return useApiMutation<void, ChangePasswordFormDto>({
    mutationFn: async ({ currentPassword, newPassword }) => {
      await runAuthAction(
        authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        }),
      );
      invalidateSessionCache();
    },
    successMessage: t("settings.password.updated"),
  });
}

export function useUpdatePreferencesMutation() {
  return useApiMutation<void, PreferencesFormDto>({
    mutationFn: async ({ preferredCurrency }) => {
      await runAuthAction(authClient.updateUser({ preferredCurrency }));
      invalidateSessionCache();
    },
    successMessage: t("settings.defaults.updated"),
  });
}

/**
 * The toast is resolved *before* the mutation runs, so it still arrives in the
 * language the user was reading when they pressed Save. Once the session cache
 * is invalidated, `AppI18nProvider` picks the new locale up and the rest of the
 * app switches.
 */
export function useUpdateLanguageMutation() {
  return useApiMutation<void, LanguageFormDto>({
    mutationFn: async ({ preferredLocale }) => {
      await runAuthAction(authClient.updateUser({ preferredLocale }));
      invalidateSessionCache();
    },
    successMessage: t("settings.language.updated"),
  });
}
