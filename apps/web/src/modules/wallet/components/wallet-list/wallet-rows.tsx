import {
  RecordFigure,
  RecordGlyph,
  RecordList,
  RecordRow,
} from "@/components/record-row";
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
            // The bare code, not `labels.currency` — that resolves to "BRL -
            // Brazilian Real", which on its own is most of a phone's row. The
            // projected balance rides here rather than under the figure: a
            // labelled figure is wider than most wallet names, and anything in
            // the trailing rail is measured against the name and wins. The
            // opening balance is the least-read figure a wallet has and lives in
            // the detail dialog.
            meta={[
              labels.walletType(wallet.type),
              wallet.currencyCode,
              hasPending
                ? t("wallet.projected", {
                    amount: formatMinorUnits(
                      wallet.projectedBalanceCents,
                      wallet.currencyCode,
                    ),
                  })
                : null,
            ]}
            trailing={
              <RecordFigure
                tone={wallet.balanceCents < 0 ? "negative" : "default"}
              >
                {formatMinorUnits(wallet.balanceCents, wallet.currencyCode)}
              </RecordFigure>
            }
          />
        );
      })}
    </RecordList>
  );
}
