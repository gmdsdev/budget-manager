import { t } from "@budget-manager/i18n";
import type {
  ChangePasswordFormDto,
  LanguageFormDto,
  PreferencesFormDto,
  ProfileFormDto,
} from "@budget-manager/schemas";

import { runAuthAction } from "../errors";
import { authActions } from "../runtime";
import { useApiMutation } from "../use-api-mutation";

/**
 * User settings are better-auth's, not a tRPC module: it already owns password
 * verification, session revocation and the `user` row. Every call goes through
 * `runAuthAction`, which turns `{ data, error }` into a thrown error so the shared
 * `MutationCache` toast fires — read inline, the `error` would resolve successfully and
 * the user would be told nothing.
 */
export function useUpdateProfileMutation() {
  const auth = authActions();

  return useApiMutation<void, ProfileFormDto>({
    mutationFn: async ({ name }) => {
      await runAuthAction(auth.updateUser({ name }));
      auth.onSessionChanged?.();
    },
    successMessage: t("settings.profile.updated"),
  });
}

export function useChangePasswordMutation() {
  const auth = authActions();

  return useApiMutation<void, ChangePasswordFormDto>({
    mutationFn: async ({ currentPassword, newPassword }) => {
      await runAuthAction(
        auth.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        }),
      );
      auth.onSessionChanged?.();
    },
    successMessage: t("settings.password.updated"),
  });
}

export function useUpdatePreferencesMutation() {
  const auth = authActions();

  return useApiMutation<void, PreferencesFormDto>({
    mutationFn: async ({ preferredCurrency }) => {
      await runAuthAction(auth.updateUser({ preferredCurrency }));
      auth.onSessionChanged?.();
    },
    successMessage: t("settings.defaults.updated"),
  });
}

/**
 * The toast is resolved *before* the mutation runs, so it still arrives in the language
 * the user was reading when they pressed Save. Once the session is re-read, the app's
 * i18n provider picks the new locale up and the rest of the app switches.
 */
export function useUpdateLanguageMutation() {
  const auth = authActions();

  return useApiMutation<void, LanguageFormDto>({
    mutationFn: async ({ preferredLocale }) => {
      await runAuthAction(auth.updateUser({ preferredLocale }));
      auth.onSessionChanged?.();
    },
    successMessage: t("settings.language.updated"),
  });
}
