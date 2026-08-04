import type { MessageTable } from "./table";

export const wallet = {
  "wallet.title": { en: "Wallets", "pt-BR": "Carteiras" },
  "wallet.caption": { en: "Your wallets", "pt-BR": "Suas carteiras" },
  "wallet.loading": {
    en: "Loading wallets",
    "pt-BR": "Carregando carteiras",
  },
  "wallet.loadFailed": {
    en: "Couldn't load your wallets",
    "pt-BR": "Não foi possível carregar suas carteiras",
  },
  "wallet.emptyFiltered.title": {
    en: "No wallets match these filters",
    "pt-BR": "Nenhuma carteira corresponde a estes filtros",
  },
  "wallet.emptyFiltered.description": {
    en: "Try a different type or currency, or clear a filter.",
    "pt-BR": "Tente outro tipo ou moeda, ou limpe um filtro.",
  },
  "wallet.empty.title": { en: "No wallets yet", "pt-BR": "Nenhuma carteira ainda" },
  "wallet.empty.description": {
    en: "Create your first wallet to start tracking your finances.",
    "pt-BR": "Crie sua primeira carteira para começar a acompanhar suas finanças.",
  },

  "wallet.column.openingBalance": {
    en: "Opening Balance",
    "pt-BR": "Saldo inicial",
  },
  "wallet.column.balance": { en: "Balance", "pt-BR": "Saldo" },
  "wallet.projected": {
    en: "{amount} projected",
    "pt-BR": "{amount} projetado",
  },
  // A marker, not a figure: `apps/native`'s row states only that something is still
  // to settle, because the projected amount beside the balance was wider than the
  // wallet's own name. The figure itself is in the detail sheet.
  "wallet.pending": { en: "Pending rows", "pt-BR": "Lançamentos pendentes" },
  "wallet.column.openingBalanceValue": {
    en: "Opened at {amount}",
    "pt-BR": "Aberta com {amount}",
  },
  "wallet.detail.title": { en: "Wallet", "pt-BR": "Carteira" },
  "wallet.detail.open": {
    en: "Open “{name}”",
    "pt-BR": "Abrir “{name}”",
  },

  "wallet.filter.allTypes": { en: "All types", "pt-BR": "Todos os tipos" },
  "wallet.filter.allCurrencies": {
    en: "All currencies",
    "pt-BR": "Todas as moedas",
  },

  "wallet.create.trigger": { en: "Create Wallet", "pt-BR": "Criar carteira" },
  "wallet.create.title": { en: "Create Wallet", "pt-BR": "Criar carteira" },
  "wallet.create.description": {
    en: "Create a new wallet to start tracking your finances.",
    "pt-BR": "Crie uma nova carteira para começar a acompanhar suas finanças.",
  },
  "wallet.create.submit": { en: "Create wallet", "pt-BR": "Criar carteira" },

  "wallet.edit.title": { en: "Edit Wallet", "pt-BR": "Editar carteira" },
  "wallet.edit.description": {
    en: "Update the details for “{name}”.",
    "pt-BR": "Atualize os dados de “{name}”.",
  },

  "wallet.archive.title": {
    en: "Archive “{name}”?",
    "pt-BR": "Arquivar “{name}”?",
  },
  "wallet.archive.description": {
    en: "This wallet (opening balance {balance}) will be hidden from your list. Its transaction history is kept, and you can restore it later.",
    "pt-BR":
      "Esta carteira (saldo inicial {balance}) será ocultada da sua lista. O histórico de transações é mantido, e você pode restaurá-la depois.",
  },
  "wallet.archive.submit": { en: "Archive wallet", "pt-BR": "Arquivar carteira" },
  "wallet.archive.submitting": { en: "Archiving…", "pt-BR": "Arquivando…" },

  "wallet.toast.created": {
    en: "Wallet created successfully",
    "pt-BR": "Carteira criada com sucesso",
  },
  "wallet.toast.updated": {
    en: "Wallet updated successfully",
    "pt-BR": "Carteira atualizada com sucesso",
  },
  "wallet.toast.archived": {
    en: "Wallet archived",
    "pt-BR": "Carteira arquivada",
  },
  "wallet.toast.restored": {
    en: "Wallet restored",
    "pt-BR": "Carteira restaurada",
  },
  "wallet.toast.deleted": {
    en: "Wallet deleted successfully",
    "pt-BR": "Carteira excluída com sucesso",
  },
} as const satisfies MessageTable;
