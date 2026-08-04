import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import type { NativeStackHeaderItem } from "expo-router/build/react-navigation/native-stack/types";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CreateCardPaymentSheet } from "@/modules/transaction/components/create-card-payment-sheet";
import { CreateCardPurchaseSheet } from "@/modules/transaction/components/create-card-purchase-sheet";
import { CreateTransactionSheet } from "@/modules/transaction/components/create-transaction-sheet";
import { CreateTransferSheet } from "@/modules/transaction/components/create-transfer-sheet";
import { useColors } from "@/theme/theme-provider";

type CreateSheet =
  | "transaction"
  | "cardPurchase"
  | "cardPayment"
  | "transfer"
  | null;

/**
 * Recording something is **one** action on the bar. The rarer shapes — card purchase,
 * pay card, transfer — still have sheets here but no affordance opening them; whatever
 * reaches them next sets `sheet` the same way.
 *
 * It is a **native bar button item**, not a React view in the header. A React view
 * placed there is wrapped by iOS 26 in the shared grey glass capsule that groups bar
 * items, so a green pill of our own ended up as a green rectangle inside a grey one.
 * `variant: 'prominent'` is the system's own filled glass button and takes `tintColor`
 * as its fill, which is how the primary action becomes green glass rather than green
 * *on* glass.
 *
 * The sheets are still React and still **stay mounted**, which is what keeps their
 * reset-on-open behaviour: the date defaults to today and the wallet to the first one,
 * both read from outside the form. That is why this is a hook returning the items
 * *and* the sheets — the header can only hand back a callback, so the state has to
 * live with something that renders.
 */
export function useCreateTransactionActions() {
  const t = useTranslate();
  const colors = useColors();
  const [sheet, setSheet] = useState<CreateSheet>(null);

  function close(next: boolean) {
    if (!next) setSheet(null);
  }

  const items: NativeStackHeaderItem[] = [
    {
      // The app's own button, not a `prominent` bar item.
      //
      // A prominent item *is* Liquid Glass, and glass is translucent: `tintColor`
      // tints the material rather than filling it, so what you see is the brand
      // green composited over whatever is behind the bar. On this app's dark plane
      // that resolved several steps darker than `--primary`, and it would have
      // resolved lighter on a pale one — a brand colour that changes with its
      // backdrop is not the brand colour.
      //
      // `hidesSharedBackground` drops the grey capsule iOS 26 otherwise wraps a
      // React header view in, so this is the button on its own: exactly `--primary`
      // with forest-green ink, matching the hero below it. The cost is that this one
      // control is flat rather than glass — the bars around it still are.
      type: "custom",
      hidesSharedBackground: true,
      element: (
        <Button
          size="sm"
          label={t("transaction.create.trigger")}
          leading={
            <Feather name="plus" size={16} color={colors.primaryForeground} />
          }
          onPress={() => setSheet("transaction")}
        />
      ),
    },
  ];

  const sheets = (
    <>
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

  return { items, sheets };
}
