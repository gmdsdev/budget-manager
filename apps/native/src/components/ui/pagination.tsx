import { PAGE_SIZE, pageCount, pageRange } from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/theme/tokens";

/**
 * The row count is named per resource rather than by interpolating a noun into
 * one sentence: "No {label}" needs an article in Portuguese, and the article
 * follows the noun's gender ("Nenhuma carteira" but "Nenhum cartão"), so a single
 * parameterised message cannot be written correctly for both languages.
 */
export type PaginatedResource =
  | "wallets"
  | "categories"
  | "cards"
  | "transactions"
  | "budgets"
  | "statements";

export function Pagination({
  page,
  total,
  pageSize = PAGE_SIZE,
  onPageChange,
  resource,
  isFetching,
}: {
  page: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  resource: PaginatedResource;
  isFetching?: boolean;
}) {
  const t = useTranslate();
  const pages = pageCount(total, pageSize);
  const { from, to } = pageRange({ page, total, pageSize });

  // A single page needs no controls, but the count is still worth stating.
  const showControls = pages > 1;

  return (
    <View style={{ gap: SPACING.sm, paddingVertical: SPACING.md }}>
      <Text variant="meta" tone="muted" accessibilityLiveRegion="polite">
        {total === 0
          ? t(`pagination.${resource}.empty`)
          : t(`pagination.${resource}.summary`, { from, to, total })}
      </Text>

      {showControls && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
          <Button
            variant="outline"
            size="sm"
            label={t("pagination.previous")}
            disabled={page <= 1 || isFetching}
            onPress={() => onPageChange(page - 1)}
            style={{ flex: 1 }}
          />
          <Text variant="meta" tone="muted" style={{ fontVariant: ["tabular-nums"] }}>
            {t("pagination.pageOf", { page, pages })}
          </Text>
          <Button
            variant="outline"
            size="sm"
            label={t("pagination.next")}
            disabled={page >= pages || isFetching}
            onPress={() => onPageChange(page + 1)}
            style={{ flex: 1 }}
          />
        </View>
      )}
    </View>
  );
}
