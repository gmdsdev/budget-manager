import {
  RecordFigure,
  RecordGlyph,
  RecordRow,
  RecordTag,
} from "@/components/record-row";
import {
  transactionRepeatsLabel,
  type TransactionRow,
} from "@budget-manager/client";
import { useEnumLabels } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import {
  CREDITED_TRANSACTION_KINDS,
  TransactionKind,
  TransactionStatus,
} from "@budget-manager/schemas";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import {
  ArrowDownIcon,
  ArrowsLeftRightIcon,
  ArrowUpIcon,
  BankIcon,
  CreditCardIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

import { categoryColorVar } from "@/modules/category/colors";

/**
 * The glyph says what kind of movement this is; its tint says which category it
 * spends. Neither is the message — the meta line names both in words, so the
 * circle is decoration and stays `aria-hidden`.
 */
const KIND_ICONS: Record<TransactionKind, PhosphorIcon> = {
  [TransactionKind.INCOME]: ArrowDownIcon,
  [TransactionKind.EXPENSE]: ArrowUpIcon,
  [TransactionKind.TRANSFER_IN]: ArrowsLeftRightIcon,
  [TransactionKind.TRANSFER_OUT]: ArrowsLeftRightIcon,
  [TransactionKind.CREDIT_CARD_PURCHASE]: CreditCardIcon,
  [TransactionKind.CREDIT_CARD_PAYMENT]: BankIcon,
};

const STATUS_TONE = {
  [TransactionStatus.PAID]: "positive",
  [TransactionStatus.WAITING_PAYMENT]: "warning",
  [TransactionStatus.CANCELLED]: "neutral",
} as const;

/**
 * The ledger as a list of movements rather than a grid of columns: a row is one
 * thing that happened, so its description, what it spends and where it sits read
 * as a single block, with the amount opposite. Eight nowrap columns wanted about
 * 1000px and put the figure a reader is scanning for at the far edge.
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
    <ul
      data-list-table=""
      aria-label={t("transaction.caption")}
      className="flex flex-col gap-6"
    >
      {groups.map((group) => (
        <li key={group.date}>
          <p
            data-group-header
            className="mb-1 border-b border-border px-2 pb-2 text-sm font-semibold text-content-secondary"
          >
            {formatDateString(group.date, "day")}
          </p>
          <ul>
            {group.rows.map((transaction) => {
              const isCredit = CREDITED_TRANSACTION_KINDS.includes(
                transaction.kind,
              );
              const Icon = KIND_ICONS[transaction.kind];

              return (
                <RecordRow
                  key={transaction.id}
                  label={t("transaction.detail.open", {
                    name: transaction.name,
                  })}
                  onSelect={() => onSelect(transaction)}
                  glyph={
                    <RecordGlyph
                      color={
                        transaction.categoryColor
                          ? categoryColorVar(transaction.categoryColor)
                          : undefined
                      }
                    >
                      <Icon className="size-5" />
                    </RecordGlyph>
                  }
                  primary={transaction.name}
                  meta={[
                    transaction.categoryName ?? t("category.uncategorized"),
                    transaction.walletName ??
                      transaction.creditCardName ??
                      t("common.none"),
                    labels.transactionKind(transaction.kind),
                    transactionRepeatsLabel(t, labels, transaction),
                  ]}
                  tag={
                    <RecordTag tone={STATUS_TONE[transaction.status]}>
                      {labels.transactionStatus(transaction.status)}
                    </RecordTag>
                  }
                  trailing={
                    <RecordFigure tone={isCredit ? "positive" : "default"}>
                      {isCredit ? "+" : "−"}
                      {formatMinorUnits(
                        transaction.amountCents,
                        transaction.walletCurrencyCode ?? "BRL",
                      )}
                    </RecordFigure>
                  }
                />
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}
