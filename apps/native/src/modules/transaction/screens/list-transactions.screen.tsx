import {
  defaultTransactionFilters,
  isTransactionFiltered,
  type TransactionFiltersState,
  type TransactionRow,
} from "@budget-manager/client";
import {
  usePagedFilters,
  useTransactionsQuery,
  useTransactionSummaryQuery,
} from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { Fragment, useState } from "react";
import { View } from "react-native";

import { ListError, ListLoading } from "@/components/list-state";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Pagination } from "@/components/ui/pagination";
import { RowCardList, RowGroupHeader } from "@/components/ui/row-card";
import { PageHeader, Screen } from "@/components/ui/screen";
import {
  CreateCardPaymentSheet,
} from "@/modules/transaction/components/create-card-payment-sheet";
import {
  CreateCardPurchaseSheet,
} from "@/modules/transaction/components/create-card-purchase-sheet";
import {
  CreateTransactionSheet,
} from "@/modules/transaction/components/create-transaction-sheet";
import {
  CreateTransferSheet,
} from "@/modules/transaction/components/create-transfer-sheet";
import {
  TransactionFilters,
} from "@/modules/transaction/components/transaction-list/transaction-filters";
import {
  TransactionRowCard,
} from "@/modules/transaction/components/transaction-list/transaction-row-card";
import {
  TransactionSummary,
} from "@/modules/transaction/components/transaction-list/transaction-summary";
import { SPACING } from "@/theme/tokens";

type CreateSheet = "plain" | "transfer" | "purchase" | "payment" | null;

export function ListTransactionsScreen() {
  const { t, formatDateString } = useI18n();
  const [creating, setCreating] = useState<CreateSheet>(null);
  const { filters, page, setFilters, setPage } =
    usePagedFilters<TransactionFiltersState>(defaultTransactionFilters());

  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useTransactionsQuery(filters, page);

  // Its own query, keyed on the filters alone: the totals cover every matching row,
  // so turning a page must not refetch them.
  const summary = useTransactionSummaryQuery(filters);

  const isFiltered = isTransactionFiltered(filters);

  // Rows arrive sorted by date, so grouping never reorders — it only stops the
  // date repeating on every card.
  const groups = groupByDate(data?.rows ?? []);

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <PageHeader title={t("transaction.title")}>
        {/* Four ways to record something, two per row so every one keeps a full
            tap target. */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm }}>
          <Button
            variant="outline"
            label={t("cardPurchase.create.trigger")}
            onPress={() => setCreating("purchase")}
            style={{ flexGrow: 1, flexBasis: 140 }}
          />
          <Button
            variant="outline"
            label={t("cardPayment.create.trigger")}
            onPress={() => setCreating("payment")}
            style={{ flexGrow: 1, flexBasis: 140 }}
          />
          <Button
            variant="outline"
            label={t("transfer.create.trigger")}
            onPress={() => setCreating("transfer")}
            style={{ flexGrow: 1, flexBasis: 140 }}
          />
          <Button
            label={t("transaction.create.trigger")}
            onPress={() => setCreating("plain")}
            style={{ flexGrow: 1, flexBasis: 140 }}
          />
        </View>
      </PageHeader>

      <TransactionFilters filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <ListLoading label={t("transaction.loading")} />
      ) : isError ? (
        <ListError
          title={t("transaction.loadFailed")}
          error={error}
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
        />
      ) : data.rows.length === 0 ? (
        <Empty
          title={
            isFiltered
              ? t("transaction.emptyFiltered.title")
              : t("transaction.empty.title")
          }
          description={
            isFiltered
              ? t("transaction.emptyFiltered.description")
              : t("transaction.empty.description")
          }
        />
      ) : (
        <>
          <RowCardList>
            {groups.map((group) => (
              <Fragment key={group.date}>
                <RowGroupHeader label={formatDateString(group.date, "numeric")} />
                {group.rows.map((row) => (
                  <TransactionRowCard key={row.id} transaction={row} />
                ))}
              </Fragment>
            ))}
          </RowCardList>

          {summary.data ? (
            <TransactionSummary
              currencies={summary.data.currencies}
              rangeTo={filters.dateTo}
              isFetching={summary.isFetching}
            />
          ) : null}

          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="transactions"
          />
        </>
      )}

      <CreateTransactionSheet
        open={creating === "plain"}
        onOpenChange={(next) => setCreating(next ? "plain" : null)}
      />
      <CreateTransferSheet
        open={creating === "transfer"}
        onOpenChange={(next) => setCreating(next ? "transfer" : null)}
      />
      <CreateCardPurchaseSheet
        open={creating === "purchase"}
        onOpenChange={(next) => setCreating(next ? "purchase" : null)}
      />
      <CreateCardPaymentSheet
        open={creating === "payment"}
        onOpenChange={(next) => setCreating(next ? "payment" : null)}
      />
    </Screen>
  );
}

function groupByDate(rows: TransactionRow[]) {
  const groups: { date: string; rows: TransactionRow[] }[] = [];

  for (const row of rows) {
    const last = groups.at(-1);

    if (last && last.date === row.occurrenceDate) {
      last.rows.push(row);
    } else {
      groups.push({ date: row.occurrenceDate, rows: [row] });
    }
  }

  return groups;
}
