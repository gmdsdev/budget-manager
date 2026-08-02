import { useTranslate } from "@budget-manager/i18n/react";
import {
  type CategoryColor,
  type CategoryType,
  isTransactionKind,
  isWalletCurrency,
  type RecurrenceType,
  type TransactionRepeats,
  type TransactionStatus,
  type WalletType,
} from "@budget-manager/schemas";
import { useMemo } from "react";

/**
 * The display name of a domain enum. These replace the `XLabelMap` constants
 * that used to live in `@budget-manager/schemas`: the enum values still do,
 * because both sides of the wire read them, but the words are catalog entries
 * keyed `enum.<enum>.<value>` — so a label is derived from the value rather
 * than kept in a second map that can fall out of step with it.
 *
 * The two that take a plain `string` are the ones fed by API rows whose column
 * is a bare `text`; an unrecognised code is echoed rather than rendered as a
 * missing key.
 */
export function useEnumLabels() {
  const t = useTranslate();

  return useMemo(
    () => ({
      walletType: (value: WalletType) => t(`enum.walletType.${value}`),
      currency: (value: string) =>
        isWalletCurrency(value) ? t(`enum.currency.${value}`) : value,
      categoryType: (value: CategoryType) => t(`enum.categoryType.${value}`),
      categoryColor: (value: CategoryColor) => t(`enum.categoryColor.${value}`),
      transactionKind: (value: string) =>
        isTransactionKind(value) ? t(`enum.transactionKind.${value}`) : value,
      transactionStatus: (value: TransactionStatus) =>
        t(`enum.transactionStatus.${value}`),
      transactionRepeats: (value: TransactionRepeats) =>
        t(`enum.transactionRepeats.${value}`),
      recurrenceType: (value: RecurrenceType) =>
        t(`enum.recurrenceType.${value}`),
    }),
    [t],
  );
}

export type EnumLabels = ReturnType<typeof useEnumLabels>;
