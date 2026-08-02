import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback } from "react";

import { authClient } from "@/lib/auth-client";

/**
 * Signing out drops every cached query as well as the session: the next account
 * to sign in on this device must not be shown the previous one's wallets while
 * its own are being fetched.
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    void authClient.signOut().finally(() => {
      queryClient.clear();
      router.replace("/login");
    });
  }, [queryClient]);
}
