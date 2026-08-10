import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { InteractionManager, Pressable, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { CreateCardPaymentSheet } from "@/modules/transaction/components/create-card-payment-sheet";
import { CreateCardPurchaseSheet } from "@/modules/transaction/components/create-card-purchase-sheet";
import { CreateTransactionSheet } from "@/modules/transaction/components/create-transaction-sheet";
import { CreateTransferSheet } from "@/modules/transaction/components/create-transfer-sheet";
import { useColors } from "@/theme/theme-provider";
import { CONTROL_HEIGHT, RADIUS, SPACING } from "@/theme/tokens";

type CreateSheet =
  | "transaction"
  | "cardPurchase"
  | "cardPayment"
  | "transfer"
  | null;

type FeatherName = React.ComponentProps<typeof Feather>["name"];

/** The three rarer shapes, in the order the web's own menu offers them. */
const SECONDARY = [
  {
    sheet: "cardPurchase",
    label: "cardPurchase.create.trigger",
    icon: "credit-card",
  },
  {
    sheet: "cardPayment",
    label: "cardPayment.create.trigger",
    icon: "dollar-sign",
  },
  { sheet: "transfer", label: "transfer.create.trigger", icon: "repeat" },
] as const satisfies readonly {
  sheet: Exclude<CreateSheet, null>;
  label: string;
  icon: FeatherName;
}[];

/**
 * Recording something is **one** action on the bar, with the rarer shapes behind a
 * second, quieter one beside it — never four peers of equal weight, which made the
 * everyday income or expense as hard to find as a card payment.
 *
 * Both are this app's own controls, and the hierarchy is stated in the two variants the
 * design language already has: the primary is the filled `primary` pill, the secondary
 * is the outlined icon chip. They used to be **native bar button items**, which cost
 * more than it sounds — a prominent item *is* Liquid Glass, and glass is translucent, so
 * `tintColor` tinted the material rather than filling it and the brand ink resolved
 * darker over this app's dark plane than it would have over a pale one. A colour that
 * changes with its backdrop is not the brand colour, so the primary already had to opt
 * out with `hidesSharedBackground`. Drawing both ourselves is the same hierarchy without
 * the escape hatch, and it is the same on Android.
 *
 * The second one opens a **bottom sheet**, not a menu anchored to the bar. A menu drops
 * its items at the top-right corner, which is the least reachable point on a phone, and
 * this app already answers that question the same way one row to the left: the account
 * mark opens a sheet of destinations, so the create mark opens a sheet of shapes. A
 * dialog is a sheet here.
 *
 * The sheets **stay mounted**, which is what keeps their reset-on-open behaviour: the
 * date defaults to today and the wallet to the first one, both read from outside the
 * form. That is why this is a hook returning the actions *and* the sheets — the header
 * is remounted per screen, so the state has to live above it.
 */
export function useCreateTransactionActions() {
  const t = useTranslate();
  const colors = useColors();
  const router = useRouter();
  const [sheet, setSheet] = useState<CreateSheet>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function close(next: boolean) {
    if (!next) setSheet(null);
  }

  // Dismissing one modal while presenting another in the same frame is exactly the
  // case iOS drops on the floor — the second sheet never appears. Waiting for this
  // one's dismissal is what makes the tap land, and it is what pushing a screen from
  // the account menu needs too.
  function fromMenu(next: () => void) {
    setMenuOpen(false);
    void InteractionManager.runAfterInteractions(next);
  }

  const actions = (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}
    >
      <Button
        size="sm"
        label={t("transaction.create.trigger")}
        leading={
          <Feather name="plus" size={16} color={colors.primaryForeground} />
        }
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
  );

  const sheets = (
    <>
      <Sheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t("transaction.create.moreTypes")}
      >
        <View style={{ gap: 2 }}>
          {SECONDARY.map((entry) => (
            <MenuRow
              key={entry.sheet}
              icon={entry.icon}
              label={t(entry.label)}
              onPress={() => fromMenu(() => setSheet(entry.sheet))}
            />
          ))}
        </View>

        {/* Pushes a screen rather than opening a sheet, so it stays out of
            SECONDARY and carries the chevron the account menu's own pushes do —
            the import flow is a screen of its own. */}
        <View>
          <MenuRow
            icon="upload"
            label={t("transaction.import.trigger")}
            pushes
            onPress={() => fromMenu(() => router.push("/transaction-import"))}
          />
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

  return { actions, sheets };
}

/** The account menu's row, so a menu in a sheet reads the same wherever it opens from. */
function MenuRow({
  icon,
  label,
  pushes = false,
  onPress,
}: {
  icon: FeatherName;
  label: string;
  pushes?: boolean;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: CONTROL_HEIGHT.default,
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.lg,
        backgroundColor: pressed ? colors.accent : "transparent",
      })}
    >
      <Feather name={icon} size={20} color={colors.foreground} />
      <Text variant="bodyMedium" style={{ flex: 1 }}>
        {label}
      </Text>
      {pushes ? (
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      ) : null}
    </Pressable>
  );
}
