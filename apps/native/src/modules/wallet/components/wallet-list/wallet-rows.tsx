import type { WalletRow } from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { Feather } from "@expo/vector-icons";

import { RecordGlyph, RecordList, RecordRow } from "@/components/record-row";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";

export function WalletRows({
  wallets,
  onSelect,
}: {
  wallets: WalletRow[];
  onSelect: (wallet: WalletRow) => void;
}) {
  const t = useTranslate();
  const labels = useEnumLabels();
  const colors = useColors();

  return (
    <RecordList label={t("wallet.caption")}>
      {wallets.map((wallet) => {
        const hasPending = wallet.projectedBalanceCents !== wallet.balanceCents;

        return (
          <RecordRow
            key={wallet.id}
            label={t("wallet.detail.open", { name: wallet.name })}
            onSelect={() => onSelect(wallet)}
            glyph={
              <RecordGlyph>
                <Feather
                  name="credit-card"
                  size={20}
                  color={colors.mutedForeground}
                />
              </RecordGlyph>
            }
            primary={wallet.name}
            // The bare code, not `labels.currency` — that resolves to
            // "BRL - Brazilian Real", which on its own is most of a phone's row. And
            // no opening balance: it is the least-read figure a wallet has, and it was
            // pushing the two that matter off the line.
            meta={[labels.walletType(wallet.type), wallet.currencyCode]}
            trailing={
              <>
                <Text
                  variant="figureRow"
                  tone={wallet.balanceCents < 0 ? "destructive" : "default"}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatMinorUnits(wallet.balanceCents, wallet.currencyCode)}
                </Text>
                {/* The figure alone. "R$ 124.215,67 projected" is wider than the
                    wallet's own name, and it was winning — the name truncated to
                    "Nubank Che…" to make room for it. The projected balance is a
                    field in the detail sheet, which is a tap away. */}
                {hasPending ? (
                  <Text variant="meta" tone="muted">
                    {t("wallet.pending")}
                  </Text>
                ) : null}
              </>
            }
          />
        );
      })}
    </RecordList>
  );
}
