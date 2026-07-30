/** The one list of destinations, shared by the desktop nav and the mobile sheet. */
export const MAIN_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/transaction", label: "Transactions" },
] as const;

export const SETTINGS_LINKS = [
  { to: "/wallet", label: "Wallets" },
  { to: "/credit-card", label: "Credit Cards" },
  { to: "/category", label: "Categories" },
] as const;
