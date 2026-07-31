import { authClient } from "@/lib/auth-client";
import { toPreferredCurrency, type WalletCurrency } from "@budget-manager/schemas";

export function usePreferredCurrency(): WalletCurrency {
  const { data: session } = authClient.useSession();

  return toPreferredCurrency(session?.user.preferredCurrency);
}
