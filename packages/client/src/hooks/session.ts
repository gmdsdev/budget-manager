import { toPreferredCurrency, type WalletCurrency } from "@budget-manager/schemas";

import { sessionAccessor } from "../runtime";

/**
 * Read the account's currency through this, never off the session directly:
 * `toPreferredCurrency` falls back for a stored code that is no longer in
 * `WalletCurrency`, which is what keeps a dropped currency from reaching a select as a
 * value with no matching item.
 *
 * It is a *default*, not a scope — the create forms preselect it and the dashboard opens
 * on it, but both still fall back, so it can never hide data.
 */
export function usePreferredCurrency(): WalletCurrency {
  const { data: session } = sessionAccessor().useSession();

  return toPreferredCurrency(session?.user.preferredCurrency);
}
