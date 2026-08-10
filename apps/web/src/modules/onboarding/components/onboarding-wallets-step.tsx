import { useEnumLabels, useWalletsQuery } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";

import { CreateWalletDialog } from "@/modules/wallet/components/create-wallet-dialog";

export function OnboardingWalletsStep() {
  const t = useTranslate();
  const labels = useEnumLabels();
  const walletsQuery = useWalletsQuery();
  const wallets = walletsQuery.data?.rows ?? [];

  return (
    <div className="flex flex-col gap-4">
      {wallets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("onboarding.wallets.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border">
          {wallets.map((wallet) => (
            <li
              key={wallet.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{wallet.name}</span>
                <span className="text-sm text-muted-foreground">
                  {labels.walletType(wallet.type)} ·{" "}
                  {labels.currency(wallet.currencyCode)}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">
                {formatMinorUnits(wallet.balanceCents, wallet.currencyCode)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div>
        <CreateWalletDialog />
      </div>
    </div>
  );
}
