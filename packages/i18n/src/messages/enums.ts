import type { MessageTable } from "./table";

/**
 * The display name of every domain enum. These used to be `XLabelMap` constants
 * in `@budget-manager/schemas`; the enums stayed there (they mirror pg enums
 * and both sides of the wire read them) and only the words moved here, so a
 * label can be translated without the value it names changing.
 *
 * `.inline` variants exist for the handful of sentences that embed a domain
 * word mid-clause. English gets away with lowercasing the label; Portuguese
 * does not, because the noun there is not the same word as the label.
 */
export const enums = {
  "enum.walletType.checking": { en: "Checking", "pt-BR": "Conta corrente" },
  "enum.walletType.savings": { en: "Savings", "pt-BR": "Poupança" },
  "enum.walletType.investments": { en: "Investments", "pt-BR": "Investimentos" },
  "enum.walletType.cash": { en: "Cash", "pt-BR": "Dinheiro" },

  "enum.currency.BRL": {
    en: "BRL - Brazilian Real",
    "pt-BR": "BRL - Real brasileiro",
  },
  "enum.currency.USD": {
    en: "USD - United States Dollar",
    "pt-BR": "USD - Dólar americano",
  },
  "enum.currency.EUR": { en: "EUR - Euro", "pt-BR": "EUR - Euro" },
  "enum.currency.GBP": {
    en: "GBP - British Pound",
    "pt-BR": "GBP - Libra esterlina",
  },
  "enum.currency.JPY": {
    en: "JPY - Japanese Yen",
    "pt-BR": "JPY - Iene japonês",
  },
  "enum.currency.KRW": {
    en: "KRW - South Korean Won",
    "pt-BR": "KRW - Won sul-coreano",
  },
  "enum.currency.CNY": {
    en: "CNY - Chinese Yuan",
    "pt-BR": "CNY - Yuan chinês",
  },

  "enum.categoryType.income": { en: "Income", "pt-BR": "Receita" },
  "enum.categoryType.expense": { en: "Expense", "pt-BR": "Despesa" },
  "enum.categoryType.income.inline": { en: "income", "pt-BR": "receita" },
  "enum.categoryType.expense.inline": { en: "expense", "pt-BR": "despesa" },

  "enum.categoryColor.blue": { en: "Blue", "pt-BR": "Azul" },
  "enum.categoryColor.cyan": { en: "Cyan", "pt-BR": "Ciano" },
  "enum.categoryColor.teal": { en: "Teal", "pt-BR": "Verde-azulado" },
  "enum.categoryColor.green": { en: "Green", "pt-BR": "Verde" },
  "enum.categoryColor.lime": { en: "Lime", "pt-BR": "Lima" },
  "enum.categoryColor.yellow": { en: "Yellow", "pt-BR": "Amarelo" },
  "enum.categoryColor.orange": { en: "Orange", "pt-BR": "Laranja" },
  "enum.categoryColor.red": { en: "Red", "pt-BR": "Vermelho" },
  "enum.categoryColor.pink": { en: "Pink", "pt-BR": "Rosa" },
  "enum.categoryColor.purple": { en: "Purple", "pt-BR": "Roxo" },
  "enum.categoryColor.violet": { en: "Violet", "pt-BR": "Violeta" },
  "enum.categoryColor.slate": { en: "Slate", "pt-BR": "Ardósia" },

  "enum.transactionKind.income": { en: "Income", "pt-BR": "Receita" },
  "enum.transactionKind.expense": { en: "Expense", "pt-BR": "Despesa" },
  "enum.transactionKind.transfer_in": {
    en: "Transfer in",
    "pt-BR": "Transferência recebida",
  },
  "enum.transactionKind.transfer_out": {
    en: "Transfer out",
    "pt-BR": "Transferência enviada",
  },
  "enum.transactionKind.credit_card_purchase": {
    en: "Card purchase",
    "pt-BR": "Compra no cartão",
  },
  "enum.transactionKind.credit_card_payment": {
    en: "Card payment",
    "pt-BR": "Pagamento de cartão",
  },
  "enum.transactionKind.income.inline": { en: "income", "pt-BR": "receita" },
  "enum.transactionKind.expense.inline": { en: "expense", "pt-BR": "despesa" },
  "enum.transactionKind.credit_card_purchase.inline": {
    en: "card purchase",
    "pt-BR": "compra no cartão",
  },

  "enum.transactionStatus.waiting_payment": {
    en: "Waiting payment",
    "pt-BR": "Aguardando pagamento",
  },
  "enum.transactionStatus.paid": { en: "Paid", "pt-BR": "Pago" },
  "enum.transactionStatus.cancelled": { en: "Cancelled", "pt-BR": "Cancelado" },

  "enum.transactionRepeats.one_off": { en: "One-off", "pt-BR": "Avulsa" },
  "enum.transactionRepeats.recurring": {
    en: "Recurring",
    "pt-BR": "Recorrente",
  },

  "enum.recurrenceType.fixed": {
    en: "Fixed installments",
    "pt-BR": "Parcelamento fixo",
  },
  "enum.recurrenceType.weekly": { en: "Weekly", "pt-BR": "Semanal" },
  "enum.recurrenceType.monthly": { en: "Monthly", "pt-BR": "Mensal" },
  "enum.recurrenceType.yearly": { en: "Yearly", "pt-BR": "Anual" },

  "enum.locale.en": { en: "English", "pt-BR": "English" },
  "enum.locale.pt-BR": {
    en: "Português (Brasil)",
    "pt-BR": "Português (Brasil)",
  },
} as const satisfies MessageTable;
