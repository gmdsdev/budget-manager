import { t, type Locale } from "@budget-manager/i18n";
import type { OnboardingPreferencesFormDto } from "@budget-manager/schemas";
import { useMutation } from "@tanstack/react-query";

import { runAuthAction } from "../errors";
import { api, authActions } from "../runtime";
import { useApiMutation } from "../use-api-mutation";
import { categoryInvalidations } from "./category";

/**
 * The one onboarding step that cannot be skipped, as one mutation: the
 * preferences land on the account first, then the default categories are
 * written in the language just saved. The locale rides as an explicit input
 * because the request header still carries the language the user was reading
 * when they pressed save.
 */
export function useOnboardingPreferencesMutation() {
  const auth = authActions();
  // The outer mutation reports the failure; without the suppression the shared
  // MutationCache would toast the same error twice.
  const ensureDefaults = useMutation({
    ...api().category.ensureDefaults.mutationOptions(),
    meta: { suppressErrorToast: true },
  });

  return useApiMutation<void, OnboardingPreferencesFormDto>({
    mutationFn: async ({ preferredLocale, preferredCurrency }) => {
      await runAuthAction(
        auth.updateUser({ preferredLocale, preferredCurrency }),
      );
      auth.onSessionChanged?.();
      await ensureDefaults.mutateAsync({ locale: preferredLocale });
    },
    successMessage: t("onboarding.preferences.saved"),
    invalidateQueries: categoryInvalidations(),
  });
}

/**
 * The defaults write on its own, for the native sign-up: that app has no
 * onboarding flow yet, so it writes the set in the device's language right
 * after the account exists — best-effort and silent, because a missing
 * convenience set must not read as a failed sign-up, and the web flow's own
 * save recovers it (an account with no categories gets the full set).
 * `onboardingCompleted` is deliberately left alone, so the first web visit
 * still offers the flow.
 */
export function useEnsureDefaultCategoriesMutation() {
  const ensureDefaults = useMutation({
    ...api().category.ensureDefaults.mutationOptions(),
    meta: { suppressErrorToast: true },
  });

  return useApiMutation<{ created: number; renamed: number }, { locale: Locale }>({
    mutationFn: (variables) => ensureDefaults.mutateAsync(variables),
    suppressErrorToast: true,
    invalidateQueries: categoryInvalidations(),
  });
}

/**
 * Finishing and skipping are the same write: the flag only decides whether the
 * flow is shown again, so nothing else is recorded about how it ended.
 */
export function useCompleteOnboardingMutation() {
  const auth = authActions();

  return useApiMutation<void, void>({
    mutationFn: async () => {
      await runAuthAction(auth.updateUser({ onboardingCompleted: true }));
      auth.onSessionChanged?.();
    },
    successMessage: t("onboarding.completed"),
  });
}
