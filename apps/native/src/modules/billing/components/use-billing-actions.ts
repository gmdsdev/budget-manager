import { useTranslate } from "@budget-manager/i18n/react";
import { SUBSCRIPTION_SLUG } from "@budget-manager/schemas";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";

type Destination = "checkout" | "portal";

export function useBillingActions({ onReturn }: { onReturn?: () => void } = {}) {
  const t = useTranslate();
  const [pending, setPending] = useState<Destination | null>(null);

  const go = useCallback(
    async (destination: Destination) => {
      setPending(destination);

      try {
        const result =
          destination === "checkout"
            ? await authClient.checkout({ slug: SUBSCRIPTION_SLUG })
            : await authClient.customer.portal();

        const url = result.data?.url;

        if (!url) {
          throw new Error(result.error?.message ?? "no checkout url");
        }

        await WebBrowser.openBrowserAsync(url);
        onReturn?.();
      } catch {
        toast.error(
          destination === "checkout"
            ? t("subscription.checkoutFailed")
            : t("subscription.portalFailed"),
        );
      } finally {
        setPending(null);
      }
    },
    [onReturn, t],
  );

  return {
    pending,
    subscribe: useCallback(() => void go("checkout"), [go]),
    manage: useCallback(() => void go("portal"), [go]),
  };
}
