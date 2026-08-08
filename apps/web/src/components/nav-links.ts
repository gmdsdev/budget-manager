import type { MessageKey } from "@budget-manager/i18n";
import {
  CreditCardIcon,
  GearIcon,
  ReceiptIcon,
  SealCheckIcon,
  SquaresFourIcon,
  TagIcon,
  TargetIcon,
  WalletIcon,
} from "@phosphor-icons/react";

/** The one list of destinations, shared by the desktop nav and the mobile sheet. */
export const MAIN_LINKS = [
  { to: "/dashboard", label: "nav.dashboard", icon: SquaresFourIcon },
  { to: "/transaction", label: "nav.transactions", icon: ReceiptIcon },
  { to: "/budget", label: "nav.budgets", icon: TargetIcon },
] as const satisfies readonly { to: string; label: MessageKey; icon: unknown }[];

export const SETTINGS_LINKS = [
  { to: "/wallet", label: "nav.wallets", icon: WalletIcon },
  { to: "/credit-card", label: "nav.creditCards", icon: CreditCardIcon },
  { to: "/category", label: "nav.categories", icon: TagIcon },
  { to: "/settings/user", label: "nav.settings", icon: GearIcon },
  { to: "/billing", label: "subscription.title", icon: SealCheckIcon },
] as const satisfies readonly { to: string; label: MessageKey; icon: unknown }[];

/**
 * Narrower than `MessageKey`: these keys take no placeholders, so a component
 * given one can call `t(label)` with no second argument.
 */
export type NavLabel =
  | (typeof MAIN_LINKS)[number]["label"]
  | (typeof SETTINGS_LINKS)[number]["label"];

export type NavGroupHeading =
  | "nav.group.overview"
  | "nav.group.money"
  | "nav.group.account";

/**
 * Seven flat destinations read as one undifferentiated column. The headings are
 * what let the eye skip to the right third of the list.
 */
export const NAV_GROUPS = [
  { heading: "nav.group.overview", links: [MAIN_LINKS[0], MAIN_LINKS[1]] },
  {
    heading: "nav.group.money",
    links: [
      SETTINGS_LINKS[0],
      SETTINGS_LINKS[1],
      MAIN_LINKS[2],
      SETTINGS_LINKS[2],
    ],
  },
  { heading: "nav.group.account", links: [SETTINGS_LINKS[3], SETTINGS_LINKS[4]] },
] as const satisfies readonly {
  heading: NavGroupHeading;
  links: readonly { to: string; label: NavLabel; icon: unknown }[];
}[];
