import { useTranslate } from "@budget-manager/i18n/react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { NativeStackHeaderItem } from "expo-router/build/react-navigation/native-stack/types";
import { useState } from "react";
import { InteractionManager, Pressable, View } from "react-native";

import { Button, IconButton } from "@/components/ui/button";
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
 * The primary is a **native bar button item**, not a React view in the header.
 *
 * A prominent item *is* Liquid Glass, and glass is translucent: `tintColor` tints the
 * material rather than filling it, so what you see is the brand ink composited over
 * whatever is behind the bar. On this app's dark plane that resolved several steps
 * darker than `--primary`, and it would have resolved lighter on a pale one — a brand
 * colour that changes with its backdrop is not the brand colour. `hidesSharedBackground`
 * drops the grey capsule iOS 26 otherwise wraps a React header view in, so this is the
 * button on its own: exactly `--primary` with its own ink, matching the hero below it.
 * The cost is that this one control is flat rather than glass — the bars around it
 * still are.
 *
 * The ellipsis beside it **keeps** that shared background, which is the cheapest way to
 * state the hierarchy: the primary is our own filled pill, the secondary is a system
 * bar item in the system's own capsule. Two weights drawn by two mechanisms, so they
 * cannot read as peers however the bar is themed.
 *
 * It opens a **bottom sheet**, not a `UIMenu` anchored to the bar. A menu drops its
 * items at the top-right corner, which is the least reachable point on a phone, and
 * this app already answers that question the same way one row to the left: the account
 * mark opens a sheet of destinations, so the create mark opens a sheet of shapes. A
 * dialog is a sheet here.
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

  const items: NativeStackHeaderItem[] = [
    {
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
    {
      type: "custom",
      element: (
        <IconButton
          label={t("transaction.create.moreTypes")}
          onPress={() => setMenuOpen(true)}
        >
          <Feather name="more-horizontal" size={20} color={colors.foreground} />
        </IconButton>
      ),
    },
  ];

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

  return { items, sheets };
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
