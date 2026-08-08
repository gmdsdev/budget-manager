import { useTranslate } from "@budget-manager/i18n/react";
import { SUBSCRIPTION_SLUG } from "@budget-manager/schemas";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

type Destination = "checkout" | "portal";

export function useBillingActions() {
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

        window.location.href = url;
      } catch {
        setPending(null);
        toast.error(
          destination === "checkout"
            ? t("subscription.checkoutFailed")
            : t("subscription.portalFailed"),
        );
      }
    },
    [t],
  );

  return {
    pending,
    subscribe: useCallback(() => void go("checkout"), [go]),
    manage: useCallback(() => void go("portal"), [go]),
  };
}
