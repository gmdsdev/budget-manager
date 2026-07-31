import type { MessageKey } from "@budget-manager/i18n";
import {
  CreditCardIcon,
  GearIcon,
  ReceiptIcon,
  SquaresFourIcon,
  TagIcon,
  WalletIcon,
} from "@phosphor-icons/react";

/** The one list of destinations, shared by the desktop nav and the mobile sheet. */
export const MAIN_LINKS = [
  { to: "/dashboard", label: "nav.dashboard", icon: SquaresFourIcon },
  { to: "/transaction", label: "nav.transactions", icon: ReceiptIcon },
] as const satisfies readonly { to: string; label: MessageKey; icon: unknown }[];

export const SETTINGS_LINKS = [
  { to: "/wallet", label: "nav.wallets", icon: WalletIcon },
  { to: "/credit-card", label: "nav.creditCards", icon: CreditCardIcon },
  { to: "/category", label: "nav.categories", icon: TagIcon },
  { to: "/settings/user", label: "nav.settings", icon: GearIcon },
] as const satisfies readonly { to: string; label: MessageKey; icon: unknown }[];

/**
 * Narrower than `MessageKey`: these keys take no placeholders, so a component
 * given one can call `t(label)` with no second argument.
 */
export type NavLabel =
  | (typeof MAIN_LINKS)[number]["label"]
  | (typeof SETTINGS_LINKS)[number]["label"];
