import { type BudgetRow, repeatsLabel } from "@budget-manager/client";
import { useI18n } from "@budget-manager/i18n/react";
import { formatMinorUnits } from "@budget-manager/money";
import { Feather } from "@expo/vector-icons";

import {
  RecordGlyph,
  RecordList,
  RecordRow,
  RecordTag,
} from "@/components/record-row";
import { Text } from "@/components/ui/text";
import { categoryColor } from "@/modules/category/colors";
import { useColors } from "@/theme/theme-provider";

export function BudgetRows({
  budgets,
  onSelect,
}: {
  budgets: BudgetRow[];
  onSelect: (budget: BudgetRow) => void;
}) {
  const { t, formatMonthString } = useI18n();
  const colors = useColors();

  return (
    <RecordList label={t("budget.caption")}>
      {budgets.map((budget) => {
        const ink = categoryColor(colors, budget.categoryColor);

        return (
          <RecordRow
            key={budget.id}
            label={t("budget.detail.open", { name: budget.categoryName })}
            onSelect={() => onSelect(budget)}
            glyph={
              <RecordGlyph color={ink}>
                <Feather name="target" size={20} color={ink} />
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
              <Text
                variant="figureRow"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatMinorUnits(budget.amountCents, budget.currencyCode)}
              </Text>
            }
          />
        );
      })}
    </RecordList>
  );
}
