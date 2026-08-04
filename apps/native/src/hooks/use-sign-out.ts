import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback } from "react";

import { authClient } from "@/lib/auth-client";
import { clearWidgetSnapshot } from "@/modules/widget/bridge";
import { WIDGET_APP_GROUP, WIDGET_SNAPSHOT_KEY } from "@/modules/widget/snapshot";

/**
 * Signing out drops every cached query as well as the session: the next account
 * to sign in on this device must not be shown the previous one's wallets while
 * its own are being fetched.
 *
 * The home-screen widget's snapshot goes with it, and for a sharper version of the
 * same reason — it sits on a surface anyone holding the phone can read, so a balance
 * left there would outlive the session it belongs to.
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    void authClient.signOut().finally(() => {
      queryClient.clear();
      void clearWidgetSnapshot(WIDGET_APP_GROUP, WIDGET_SNAPSHOT_KEY).catch(
        () => undefined,
      );
      router.replace("/login");
    });
  }, [queryClient]);
}
