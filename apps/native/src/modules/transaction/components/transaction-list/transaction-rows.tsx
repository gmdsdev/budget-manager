import type { TransactionRow } from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import {
  CREDITED_TRANSACTION_KINDS,
  TransactionKind,
  TransactionStatus,
} from "@budget-manager/schemas";
import { Feather } from "@expo/vector-icons";
import { Fragment } from "react";
import { View } from "react-native";

import {
  RecordGlyph,
  RecordGroupHeader,
  RecordList,
  RecordRow,
  RecordTag,
  type RecordTagTone,
} from "@/components/record-row";
import { Text } from "@/components/ui/text";
import { categoryColor } from "@/modules/category/colors";
import { useColors } from "@/theme/theme-provider";
import { SPACING } from "@/theme/tokens";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

/**
 * The glyph says what kind of movement this is; its tint says which category it
 * spends. Neither is the message — the meta line names both in words, so the
 * circle is decoration and stays hidden from assistive tech.
 */
const KIND_ICONS: Record<TransactionKind, FeatherName> = {
  [TransactionKind.INCOME]: "arrow-down",
  [TransactionKind.EXPENSE]: "arrow-up",
  [TransactionKind.TRANSFER_IN]: "repeat",
  [TransactionKind.TRANSFER_OUT]: "repeat",
  [TransactionKind.CREDIT_CARD_PURCHASE]: "credit-card",
  [TransactionKind.CREDIT_CARD_PAYMENT]: "dollar-sign",
};

const STATUS_TONE: Record<TransactionStatus, RecordTagTone> = {
  [TransactionStatus.PAID]: "positive",
  [TransactionStatus.WAITING_PAYMENT]: "warning",
  [TransactionStatus.CANCELLED]: "neutral",
};

/**
 * The ledger as a list of movements rather than a grid of columns: a row is one
 * thing that happened, so its description, what it spends and where it sits read
 * as a single block, with the amount opposite. Eight nowrap columns put the figure
 * a reader is scanning for at the far edge of a phone.
 *
 * The rows themselves are the shared `RecordRow`; what this file adds is the day
 * grouping, which no other listing has — a date is stated once and ruled off
 * rather than repeated on every row.
 */
export function TransactionRows({
  transactions,
  onSelect,
}: {
  transactions: TransactionRow[];
  onSelect: (transaction: TransactionRow) => void;
}) {
  const { t, formatDateString } = useI18n();
  const labels = useEnumLabels();
  const colors = useColors();

  // Rows arrive sorted by date, so grouping never reorders — it only stops the
  // same date being restated on every row.
  const groups: { date: string; rows: TransactionRow[] }[] = [];

  for (const transaction of transactions) {
    const last = groups.at(-1);

    if (last && last.date === transaction.occurrenceDate) {
      last.rows.push(transaction);
    } else {
      groups.push({ date: transaction.occurrenceDate, rows: [transaction] });
    }
  }

  return (
    <RecordList label={t("transaction.caption")}>
      {groups.map((group) => (
        <Fragment key={group.date}>
          <View style={{ marginTop: SPACING.md }}>
            <RecordGroupHeader label={formatDateString(group.date, "day")} />
          </View>
          {group.rows.map((transaction) => {
            const isCredit = CREDITED_TRANSACTION_KINDS.includes(
              transaction.kind,
            );
            const ink = transaction.categoryColor
              ? categoryColor(colors, transaction.categoryColor)
              : colors.mutedForeground;

            return (
              <RecordRow
                key={transaction.id}
                label={t("transaction.detail.open", { name: transaction.name })}
                onSelect={() => onSelect(transaction)}
                glyph={
                  <RecordGlyph color={ink}>
                    <Feather
                      name={KIND_ICONS[transaction.kind]}
                      size={20}
                      color={ink}
                    />
                  </RecordGlyph>
                }
                primary={transaction.name}
                // What it spends and where it sits — and nothing else. The repeats
                // label was a third entry that wrapped the line onto a second row on
                // every recurring transaction, which is most of them; it is stated in
                // the detail sheet the row opens.
                meta={[
                  transaction.categoryName ?? t("category.uncategorized"),
                  transaction.walletName ??
                    transaction.creditCardName ??
                    t("common.none"),
                ]}
                tag={
                  <RecordTag tone={STATUS_TONE[transaction.status]}>
                    {labels.transactionStatus(transaction.status)}
                  </RecordTag>
                }
                trailing={
                  <Text
                    variant="figureRow"
                    tone={isCredit ? "success" : "default"}
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {`${isCredit ? "+" : "−"}${formatMinorUnits(
                      transaction.amountCents,
                      transaction.walletCurrencyCode ?? "BRL",
                    )}`}
                  </Text>
                }
              />
            );
          })}
        </Fragment>
      ))}
    </RecordList>
  );
}
