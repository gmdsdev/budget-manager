import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { authClient } from "@/lib/auth-client";
import { invalidateSessionCache } from "@/lib/session";

/**
 * Shared by the desktop account menu and the mobile nav sheet. Dropping every cached
 * query matters as much as dropping the session: the next account to sign in on this
 * browser must not be shown the previous one's wallets while its own are fetched.
 */
export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useCallback(() => {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          invalidateSessionCache();
          queryClient.clear();
          void navigate({ to: "/" });
        },
      },
    });
  }, [navigate, queryClient]);
}
