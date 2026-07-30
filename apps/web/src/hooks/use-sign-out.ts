import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { authClient } from "@/lib/auth-client";
import { invalidateSessionCache } from "@/lib/session";

/** Shared by the desktop account menu and the mobile nav sheet. */
export function useSignOut() {
  const navigate = useNavigate();

  return useCallback(() => {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          invalidateSessionCache();
          void navigate({ to: "/" });
        },
      },
    });
  }, [navigate]);
}
