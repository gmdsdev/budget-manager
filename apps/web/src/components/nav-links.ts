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
  { to: "/dashboard", label: "Dashboard", icon: SquaresFourIcon },
  { to: "/transaction", label: "Transactions", icon: ReceiptIcon },
] as const;

export const SETTINGS_LINKS = [
  { to: "/wallet", label: "Wallets", icon: WalletIcon },
  { to: "/credit-card", label: "Credit Cards", icon: CreditCardIcon },
  { to: "/category", label: "Categories", icon: TagIcon },
  { to: "/settings/user", label: "Settings", icon: GearIcon },
] as const;
