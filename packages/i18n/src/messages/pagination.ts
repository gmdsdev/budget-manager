import type { MessageTable } from "./table";

/**
 * A key pair per resource rather than one message interpolating a noun.
 * "No {label}" needs an article in Portuguese, and the article follows the
 * noun's gender — "Nenhuma carteira" but "Nenhum cartão" — so a single
 * parameterised sentence cannot be written correctly for both.
 */
export const pagination = {
  "pagination.previous": { en: "Previous", "pt-BR": "Anterior" },
  "pagination.next": { en: "Next", "pt-BR": "Próxima" },
  "pagination.pageOf": {
    en: "Page {page} of {pages}",
    "pt-BR": "Página {page} de {pages}",
  },

  "pagination.wallets.empty": {
    en: "No wallets",
    "pt-BR": "Nenhuma carteira",
  },
  "pagination.wallets.summary": {
    en: "Showing {from}–{to} of {total} wallets",
    "pt-BR": "Exibindo {from}–{to} de {total} carteiras",
  },
  "pagination.categories.empty": {
    en: "No categories",
    "pt-BR": "Nenhuma categoria",
  },
  "pagination.categories.summary": {
    en: "Showing {from}–{to} of {total} categories",
    "pt-BR": "Exibindo {from}–{to} de {total} categorias",
  },
  "pagination.cards.empty": { en: "No cards", "pt-BR": "Nenhum cartão" },
  "pagination.cards.summary": {
    en: "Showing {from}–{to} of {total} cards",
    "pt-BR": "Exibindo {from}–{to} de {total} cartões",
  },
  "pagination.transactions.empty": {
    en: "No transactions",
    "pt-BR": "Nenhuma transação",
  },
  "pagination.transactions.summary": {
    en: "Showing {from}–{to} of {total} transactions",
    "pt-BR": "Exibindo {from}–{to} de {total} transações",
  },
  "pagination.budgets.empty": {
    en: "No budgets",
    "pt-BR": "Nenhum orçamento",
  },
  "pagination.budgets.summary": {
    en: "Showing {from}\u2013{to} of {total} budgets",
    "pt-BR": "Exibindo {from}\u2013{to} de {total} orçamentos",
  },
  "pagination.statements.empty": {
    en: "No statements",
    "pt-BR": "Nenhuma fatura",
  },
  "pagination.statements.summary": {
    en: "Showing {from}–{to} of {total} statements",
    "pt-BR": "Exibindo {from}–{to} de {total} faturas",
  },
} as const satisfies MessageTable;
