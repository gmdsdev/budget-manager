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
                <Text
                  variant="figureRow"
                  tone={wallet.balanceCents < 0 ? "destructive" : "default"}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatMinorUnits(wallet.balanceCents, wallet.currencyCode)}
                </Text>
                {hasPending ? (
                  <Text
                    variant="meta"
                    tone="muted"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {t("wallet.projected", {
                      amount: formatMinorUnits(
                        wallet.projectedBalanceCents,
                        wallet.currencyCode,
                      ),
                    })}
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
