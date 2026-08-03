import { RecordGlyph, RecordList, RecordRow } from "@/components/record-row";
import type { WalletRow } from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { WalletIcon } from "@phosphor-icons/react";

export function WalletRows({
  wallets,
  onSelect,
}: {
  wallets: WalletRow[];
  onSelect: (wallet: WalletRow) => void;
}) {
  const { t } = useI18n();
  const labels = useEnumLabels();

  return (
    <RecordList label={t("wallet.caption")}>
      {wallets.map((wallet) => {
        const hasPending =
          wallet.projectedBalanceCents !== wallet.balanceCents;

        return (
          <RecordRow
            key={wallet.id}
            label={t("wallet.detail.open", { name: wallet.name })}
            onSelect={() => onSelect(wallet)}
            glyph={
              <RecordGlyph>
                <WalletIcon className="size-5" />
              </RecordGlyph>
            }
            primary={wallet.name}
            meta={[
              labels.walletType(wallet.type),
              labels.currency(wallet.currencyCode),
              t("wallet.column.openingBalanceValue", {
                amount: formatMinorUnits(
                  wallet.openingBalanceCents,
                  wallet.currencyCode,
                ),
              }),
            ]}
            trailing={
              <>
                <p
                  data-list-cell
                  className={`text-lg font-bold tracking-[-0.025em] tabular-nums ${
                    wallet.balanceCents < 0 ? "text-destructive" : ""
                  }`}
                >
                  {formatMinorUnits(wallet.balanceCents, wallet.currencyCode)}
                </p>
                {hasPending ? (
                  <p
                    data-list-cell
                    className="text-xs text-muted-foreground tabular-nums"
                  >
                    {t("wallet.projected", {
                      amount: formatMinorUnits(
                        wallet.projectedBalanceCents,
                        wallet.currencyCode,
                      ),
                    })}
                  </p>
                ) : null}
              </>
            }
          />
        );
      })}
    </RecordList>
  );
}
