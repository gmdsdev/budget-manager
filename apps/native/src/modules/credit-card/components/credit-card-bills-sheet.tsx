import {
  BILL_STATUS_KEYS,
  type BillStatus,
  getErrorMessage,
} from "@budget-manager/client";
import type { CreditCardRow } from "@budget-manager/client";
import { useCreditCardBillsQuery } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { useState } from "react";
import { View } from "react-native";

import { Amount } from "@/components/amount";
import { Pagination } from "@/components/ui/pagination";
import { Plate } from "@/components/ui/plate";
import { Sheet } from "@/components/ui/sheet";
import { SkeletonList } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useColors } from "@/theme/theme-provider";
import { BORDER_WIDTH, SPACING } from "@/theme/tokens";

const STATUS_TONE: Record<BillStatus, "muted" | "destructive" | "success"> = {
  open: "muted",
  awaiting_payment: "destructive",
  paid: "success",
};

/**
 * A card's statements. Scoped to one card and paginated like every other listing;
 * it is outside the filter rule because the dialog is already scoped by the row it
 * was opened from, and its most useful reading — the status — is derived.
 */
export function CreditCardBillsSheet({
  card,
  open,
  onOpenChange,
}: {
  card: CreditCardRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, formatDateString } = useI18n();
  const colors = useColors();
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, isFetching } = useCreditCardBillsQuery(
    card.id,
    page,
  );

  return (
    <Sheet
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("creditCard.bills.title", { name: card.name })}
      description={t("creditCard.bills.description", {
        closeDay: card.closeDay,
        dueDay: card.dueDay,
      })}
    >
      {isPending ? (
        <SkeletonList label={t("creditCard.bills.loading")} count={2} height={72} />
      ) : isError ? (
        <Text tone="destructive">{getErrorMessage(error)}</Text>
      ) : data.rows.length === 0 ? (
        <Text variant="small" tone="muted">
          {t("creditCard.bills.empty")}
        </Text>
      ) : (
        <>
          <Plate shadow="none">
            {data.rows.map((bill, index) => (
              <View
                key={bill.id}
                style={{
                  padding: SPACING.md,
                  gap: SPACING.xs,
                  borderTopWidth: index > 0 ? BORDER_WIDTH : 0,
                  borderColor: colors.muted,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: SPACING.sm,
                  }}
                >
                  <Text variant="bodyMedium">
                    {formatDateString(bill.periodStart, "dayShort")} –{" "}
                    {formatDateString(bill.periodEnd, "day")}
                  </Text>
                  <Amount
                    cents={bill.remainingCents}
                    currencyCode={data.currencyCode}
                    negativeIsDestructive={false}
                  />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: SPACING.sm,
                  }}
                >
                  <Text variant="tiny" tone="muted">
                    {t("creditCard.bills.due")}{" "}
                    {formatDateString(bill.dueAt, "day")}
                  </Text>
                  <Text variant="tiny" tone={STATUS_TONE[bill.status]}>
                    {t(BILL_STATUS_KEYS[bill.status])}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: SPACING.sm,
                  }}
                >
                  <Text variant="tiny" tone="muted">
                    {t("creditCard.bills.statement")}{" "}
                    {formatMinorUnits(bill.statementTotalCents, data.currencyCode)}
                  </Text>
                  <Text variant="tiny" tone="muted">
                    {t("creditCard.bills.paid")}{" "}
                    {formatMinorUnits(bill.paidCents, data.currencyCode)}
                  </Text>
                </View>
              </View>
            ))}
          </Plate>

          <Pagination
            page={page}
            total={data.total}
            onPageChange={setPage}
            isFetching={isFetching}
            resource="statements"
          />
        </>
      )}
    </Sheet>
  );
}
