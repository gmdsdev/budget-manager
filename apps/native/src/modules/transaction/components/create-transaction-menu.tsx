import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { InteractionManager, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { CreateCardPaymentSheet } from "@/modules/transaction/components/create-card-payment-sheet";
import { CreateCardPurchaseSheet } from "@/modules/transaction/components/create-card-purchase-sheet";
import { CreateTransactionSheet } from "@/modules/transaction/components/create-transaction-sheet";
import { CreateTransferSheet } from "@/modules/transaction/components/create-transfer-sheet";
import { useColors } from "@/theme/theme-provider";
import { BRAND, SPACING } from "@/theme/tokens";

type CreateSheet =
  | "transaction"
  | "cardPurchase"
  | "cardPayment"
  | "transfer"
  | null;

type FeatherName = React.ComponentProps<typeof Feather>["name"];

/** The three rarer shapes, in the order the sheet offers them. */
const SECONDARY = [
  {
    sheet: "cardPurchase",
    label: "cardPurchase.create.trigger",
    icon: "credit-card",
  },
  { sheet: "cardPayment", label: "cardPayment.create.trigger", icon: "dollar-sign" },
  { sheet: "transfer", label: "transfer.create.trigger", icon: "repeat" },
] as const satisfies readonly {
  sheet: Exclude<CreateSheet, null>;
  label: string;
  icon: FeatherName;
}[];

/**
 * Recording something is one primary action with the rarer shapes behind a second
 * affordance — never four peers of equal weight, which made the everyday income or
 * expense as hard to find as a card payment and took a 2×2 grid of the first screen.
 *
 * It lives in the app bar, so it is reachable from every tab rather than only from
 * the ledger, and the rarer three open as a **sheet**: on a phone a dropdown anchored
 * to the top edge has nowhere to go.
 *
 * The sheets are controlled from here and **stay mounted**, which is what keeps their
 * reset-on-open behaviour: the date defaults to today and the wallet to the first one,
 * both read from outside the form.
 */
export function CreateTransactionMenu() {
  const t = useTranslate();
  const colors = useColors();
  const [sheet, setSheet] = useState<CreateSheet>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function close(next: boolean) {
    if (!next) setSheet(null);
  }

  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
        <Button
          size="sm"
          label={t("transaction.create.trigger")}
          leading={<Feather name="plus" size={16} color={BRAND.forestGreen} />}
          onPress={() => setSheet("transaction")}
        />
        <Button
          variant="outline"
          size="icon-sm"
          accessibilityLabel={t("transaction.create.moreTypes")}
          leading={
            <Feather name="more-horizontal" size={18} color={colors.foreground} />
          }
          onPress={() => setMenuOpen(true)}
        />
      </View>

      <Sheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t("transaction.create.moreTypes")}
      >
        <View style={{ gap: SPACING.sm }}>
          {SECONDARY.map((entry) => (
            <Button
              key={entry.sheet}
              variant="outline"
              label={t(entry.label)}
              leading={
                <Feather name={entry.icon} size={18} color={colors.foreground} />
              }
              // Dismissing one modal while presenting another in the same frame is
              // exactly the case iOS drops on the floor — the second sheet never
              // appears. Waiting for this one's dismissal is what makes the next tap
              // land.
              onPress={() => {
                setMenuOpen(false);
                void InteractionManager.runAfterInteractions(() =>
                  setSheet(entry.sheet),
                );
              }}
            />
          ))}
        </View>
      </Sheet>

      <CreateTransactionSheet
        open={sheet === "transaction"}
        onOpenChange={close}
      />
      <CreateCardPurchaseSheet
        open={sheet === "cardPurchase"}
        onOpenChange={close}
      />
      <CreateCardPaymentSheet
        open={sheet === "cardPayment"}
        onOpenChange={close}
      />
      <CreateTransferSheet open={sheet === "transfer"} onOpenChange={close} />
    </>
  );
}
