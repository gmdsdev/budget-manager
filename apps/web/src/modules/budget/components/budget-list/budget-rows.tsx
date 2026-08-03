import {
  RecordGlyph,
  RecordList,
  RecordRow,
  RecordTag,
} from "@/components/record-row";
import { categoryColorVar } from "@/modules/category/colors";
import { repeatsLabel, type BudgetRow } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/ui/lib/currency";
import { TargetIcon } from "@phosphor-icons/react";

export function BudgetRows({
  budgets,
  onSelect,
}: {
  budgets: BudgetRow[];
  onSelect: (budget: BudgetRow) => void;
}) {
  const { t, formatMonthString } = useI18n();

  return (
    <RecordList label={t("budget.caption")}>
      {budgets.map((budget) => (
        <RecordRow
          key={budget.id}
          label={t("budget.detail.open", { name: budget.categoryName })}
          onSelect={() => onSelect(budget)}
          glyph={
            <RecordGlyph color={categoryColorVar(budget.categoryColor)}>
              <TargetIcon className="size-5" />
            </RecordGlyph>
          }
          primary={budget.categoryName}
          meta={[
            budget.currencyCode,
            repeatsLabel(t, budget),
            formatMonthString(budget.startsOn, "monthYear"),
          ]}
          tag={
            <RecordTag tone={budget.isActive ? "neutral" : "warning"}>
              {budget.isActive
                ? t("budget.repeats.active")
                : t("budget.repeats.paused")}
            </RecordTag>
          }
          trailing={
            <p
              data-list-cell
              className="text-lg font-bold tracking-[-0.025em] tabular-nums"
            >
              {formatMinorUnits(budget.amountCents, budget.currencyCode)}
            </p>
          }
        />
      ))}
    </RecordList>
  );
}
