import { useApiMutation } from "@/hooks/use-api-mutation";
import { authClient } from "@/lib/auth-client";
import { runAuthAction } from "@/lib/auth-error";
import { invalidateSessionCache } from "@/lib/session";
import type {
  ChangePasswordFormDto,
  PreferencesFormDto,
  ProfileFormDto,
} from "@budget-manager/schemas";

export function useUpdateProfileMutation() {
  return useApiMutation<void, ProfileFormDto>({
    mutationFn: async ({ name }) => {
      await runAuthAction(authClient.updateUser({ name }));
      invalidateSessionCache();
    },
    successMessage: "Profile updated successfully",
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
    successMessage: "Password changed successfully",
  });
}

export function useUpdatePreferencesMutation() {
  return useApiMutation<void, PreferencesFormDto>({
    mutationFn: async ({ preferredCurrency }) => {
      await runAuthAction(authClient.updateUser({ preferredCurrency }));
      invalidateSessionCache();
    },
    successMessage: "Preferences updated successfully",
  });
}
