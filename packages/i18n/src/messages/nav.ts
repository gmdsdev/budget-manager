import type { MessageTable } from "./table";

export const nav = {
  "nav.dashboard": { en: "Dashboard", "pt-BR": "Painel" },
  "nav.transactions": { en: "Transactions", "pt-BR": "Transações" },
  "nav.wallets": { en: "Wallets", "pt-BR": "Carteiras" },
  "nav.creditCards": { en: "Credit Cards", "pt-BR": "Cartões de Crédito" },
  "nav.categories": { en: "Categories", "pt-BR": "Categorias" },
  "nav.settings": { en: "Settings", "pt-BR": "Configurações" },
  "nav.main": { en: "Main", "pt-BR": "Principal" },
  "nav.homeLink": { en: "Kivo dashboard", "pt-BR": "Painel do Kivo" },
  "nav.signIn": { en: "Sign In", "pt-BR": "Entrar" },
  "nav.signOut": { en: "Sign Out", "pt-BR": "Sair" },
  "nav.appDescription": {
    en: "Kivo is a personal finance app for wallets, cards and bills",
    "pt-BR": "Kivo é um app de finanças pessoais para carteiras, cartões e faturas",
  },
} as const satisfies MessageTable;
