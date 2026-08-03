import type { PendingItem } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { Feather } from "@expo/vector-icons";

import {
  RecordGlyph,
  RecordList,
  RecordRow,
  RecordTag,
} from "@/components/record-row";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { categoryColorOrNeutral } from "@/modules/category/colors";
import { useColors } from "@/theme/theme-provider";

/**
 * Everything awaiting payment, overdue included and oldest first. A row here reads
 * exactly as it does in the ledger, because it is the same record — but `PendingItem`
 * is a projection of one, not a `TransactionRow`, so a row cannot open the transaction
 * detail sheet without inventing fields the payload does not carry. It sends the
 * reader to the ledger instead.
 */
export function PendingList({
  items,
  today,
  onOpenTransactions,
}: {
  items: PendingItem[];
  today: string;
  onOpenTransactions: () => void;
}) {
  const { t, formatDateString } = useI18n();
  const colors = useColors();
  const overdueCount = items.filter((item) => item.occurrenceDate < today).length;

  return (
    <Card>
      <CardHeader
        title={t("dashboard.pending.title")}
        description={
          overdueCount > 0
            ? t("dashboard.pending.overdue", { count: overdueCount })
            : t("dashboard.pending.none")
        }
      />

      {items.length === 0 ? (
        <Text variant="meta" tone="muted">
          {t("dashboard.pending.empty")}
        </Text>
      ) : (
        <>
          <RecordList label={t("dashboard.pending.title")}>
            {items.map((item) => {
              const overdue = item.occurrenceDate < today;
              const ink = overdue
                ? colors.destructive
                : categoryColorOrNeutral(colors, item.categoryColor);

              return (
                <RecordRow
                  key={item.id}
                  label={t("dashboard.pending.open", { name: item.name })}
                  onSelect={onOpenTransactions}
                  glyph={
                    <RecordGlyph color={ink}>
                      <Feather name="clock" size={20} color={ink} />
                    </RecordGlyph>
                  }
                  primary={item.name}
                  // The kind is the one field the ledger's own rows carry that this
                  // list drops: account names are long enough that a fourth entry
                  // pushed the line past two rows, and the glyph plus the amount
                  // opposite already say which direction this is.
                  meta={[
                    formatDateString(item.occurrenceDate, "monthDay"),
                    item.walletName ?? item.creditCardName ?? t("common.none"),
                    item.categoryName ?? t("category.uncategorized"),
                  ]}
                  tag={
                    overdue ? (
                      <RecordTag tone="negative">
                        {t("dashboard.pending.overdueFlag")}
                      </RecordTag>
                    ) : undefined
                  }
                  trailing={
                    <Text
                      variant="figureRow"
                      tone={overdue ? "destructive" : "default"}
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {formatMinorUnits(item.amountCents, item.walletCurrencyCode)}
                    </Text>
                  }
                />
              );
            })}
          </RecordList>

          <Button
            variant="outline"
            size="sm"
            label={t("dashboard.pending.action")}
            onPress={onOpenTransactions}
          />
        </>
      )}
    </Card>
  );
}
