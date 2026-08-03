import { useEnumLabels } from "@budget-manager/client/react";
import { useI18n } from "@budget-manager/i18n/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@budget-manager/ui/components/card";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { ClockIcon } from "@phosphor-icons/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { buttonVariants } from "@budget-manager/ui/components/button";
import type { PendingItem } from "@budget-manager/client";

import {
  RecordGlyph,
  RecordList,
  RecordRow,
  RecordTag,
} from "@/components/record-row";
import { categoryColorVarOrNeutral } from "@/modules/category/colors";

/**
 * A row here reads exactly as it does in the ledger, because it is the same
 * record — but `PendingItem` is a projection of one, not a `TransactionRow`, so
 * a row cannot open the transaction detail dialog without inventing fields the
 * payload does not carry. It sends the reader to the ledger instead.
 */
export function PendingList({
  items,
  today,
}: {
  items: PendingItem[];
  today: string;
}) {
  const { t, formatDateString } = useI18n();
  const labels = useEnumLabels();
  const navigate = useNavigate();
  const overdueCount = items.filter((item) => item.occurrenceDate < today)
    .length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.pending.title")}</CardTitle>
        <CardDescription>
          {overdueCount > 0
            ? t("dashboard.pending.overdue", { count: overdueCount })
            : t("dashboard.pending.none")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("dashboard.pending.empty")}
          </p>
        ) : (
          <RecordList label={t("dashboard.pending.title")}>
            {items.map((item) => {
              const overdue = item.occurrenceDate < today;

              return (
                <RecordRow
                  key={item.id}
                  label={t("dashboard.pending.open", { name: item.name })}
                  onSelect={() => void navigate({ to: "/transaction" })}
                  glyph={
                    <RecordGlyph
                      color={
                        overdue
                          ? "var(--destructive)"
                          : categoryColorVarOrNeutral(item.categoryColor)
                      }
                    >
                      <ClockIcon className="size-5" />
                    </RecordGlyph>
                  }
                  primary={item.name}
                  meta={[
                    formatDateString(item.occurrenceDate, "monthDay"),
                    item.walletName ?? item.creditCardName ?? t("common.none"),
                    item.categoryName ?? t("category.uncategorized"),
                    labels.transactionKind(item.kind),
                  ]}
                  tag={
                    overdue ? (
                      <RecordTag tone="negative">
                        {t("dashboard.pending.overdueFlag")}
                      </RecordTag>
                    ) : undefined
                  }
                  trailing={
                    <p
                      data-list-cell
                      className={`text-lg font-bold tracking-[-0.025em] tabular-nums ${
                        overdue ? "text-destructive" : ""
                      }`}
                    >
                      {formatMinorUnits(
                        item.amountCents,
                        item.walletCurrencyCode,
                      )}
                    </p>
                  }
                />
              );
            })}
          </RecordList>
        )}
      </CardContent>

      {items.length > 0 && (
        <CardContent className="pt-0">
          <Link
            to="/transaction"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("dashboard.pending.action")}
          </Link>
        </CardContent>
      )}
    </Card>
  );
}
