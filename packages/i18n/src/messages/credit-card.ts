import type { MessageTable } from "./table";

export const creditCard = {
  "creditCard.title": { en: "Credit Cards", "pt-BR": "Cartões de crédito" },
  "creditCard.caption": {
    en: "Your credit cards",
    "pt-BR": "Seus cartões de crédito",
  },
  "creditCard.loading": {
    en: "Loading cards",
    "pt-BR": "Carregando cartões",
  },
  "creditCard.loadFailed": {
    en: "Couldn't load your cards",
    "pt-BR": "Não foi possível carregar seus cartões",
  },
  "creditCard.emptyFiltered.title": {
    en: "No cards match these filters",
    "pt-BR": "Nenhum cartão corresponde a estes filtros",
  },
  "creditCard.emptyFiltered.description": {
    en: "Try a different currency or billing wallet, or clear a filter.",
    "pt-BR":
      "Tente outra moeda ou carteira de pagamento, ou limpe um filtro.",
  },
  "creditCard.empty.title": {
    en: "No cards yet",
    "pt-BR": "Nenhum cartão ainda",
  },
  "creditCard.empty.description": {
    en: "Add a card to track its limit and what you owe on it.",
    "pt-BR": "Adicione um cartão para acompanhar o limite e o que você deve.",
  },

  "creditCard.column.cycle": { en: "Cycle", "pt-BR": "Ciclo" },
  "creditCard.column.cycleValue": {
    en: "Closes {closeDay} · Due {dueDay}",
    "pt-BR": "Fecha {closeDay} · Vence {dueDay}",
  },
  "creditCard.column.billingWallet": {
    en: "Billing wallet",
    "pt-BR": "Carteira de pagamento",
  },
  "creditCard.column.limit": { en: "Limit", "pt-BR": "Limite" },
  "creditCard.column.outstanding": {
    en: "Outstanding",
    "pt-BR": "Em aberto",
  },
  "creditCard.column.available": { en: "Available", "pt-BR": "Disponível" },
  "creditCard.projected": {
    en: "{amount} projected",
    "pt-BR": "{amount} projetado",
  },
  "creditCard.column.limitValue": {
    en: "{amount} limit",
    "pt-BR": "limite de {amount}",
  },
  "creditCard.column.availableValue": {
    en: "{amount} available",
    "pt-BR": "{amount} disponível",
  },
  "creditCard.detail.title": {
    en: "Credit card",
    "pt-BR": "Cartão de crédito",
  },
  "creditCard.detail.open": {
    en: "Open “{name}”",
    "pt-BR": "Abrir “{name}”",
  },

  "creditCard.field.closingDay": { en: "Closing day", "pt-BR": "Dia de fechamento" },
  "creditCard.field.closingDayHint": {
    en: "Day of the month the statement closes (1–28).",
    "pt-BR": "Dia do mês em que a fatura fecha (1–28).",
  },
  "creditCard.field.dueDay": { en: "Due day", "pt-BR": "Dia de vencimento" },
  "creditCard.field.dueDayHint": {
    en: "Day of the month the bill is due (1–28).",
    "pt-BR": "Dia do mês em que a fatura vence (1–28).",
  },
  "creditCard.field.billingWalletHint": {
    en: "Suggested when you record a payment. Must match the card currency.",
    "pt-BR":
      "Sugerida ao registrar um pagamento. Deve usar a mesma moeda do cartão.",
  },
  "creditCard.field.noBillingWallet": { en: "None", "pt-BR": "Nenhuma" },

  "creditCard.filter.allCurrencies": {
    en: "All currencies",
    "pt-BR": "Todas as moedas",
  },
  "creditCard.filter.allWallets": {
    en: "All wallets",
    "pt-BR": "Todas as carteiras",
  },
  "creditCard.filter.noBillingWallet": {
    en: "No billing wallet",
    "pt-BR": "Sem carteira de pagamento",
  },

  "creditCard.create.trigger": { en: "Create Card", "pt-BR": "Criar cartão" },
  "creditCard.create.title": {
    en: "Create Credit Card",
    "pt-BR": "Criar cartão de crédito",
  },
  "creditCard.create.description": {
    en: "Track a card's limit and what you currently owe on it.",
    "pt-BR": "Acompanhe o limite do cartão e o que você deve nele.",
  },
  "creditCard.create.submit": { en: "Create card", "pt-BR": "Criar cartão" },

  "creditCard.edit.title": {
    en: "Edit Credit Card",
    "pt-BR": "Editar cartão de crédito",
  },
  "creditCard.edit.description": {
    en: "Update the details for “{name}”.",
    "pt-BR": "Atualize os dados de “{name}”.",
  },

  "creditCard.archive.title": {
    en: "Archive “{name}”?",
    "pt-BR": "Arquivar “{name}”?",
  },
  "creditCard.archive.stillOwes": {
    en: "This card still owes {amount}. ",
    "pt-BR": "Este cartão ainda deve {amount}. ",
  },
  "creditCard.archive.description": {
    en: "It will be hidden from your lists and can no longer be picked for new purchases. Its history is kept, and you can restore it later.",
    "pt-BR":
      "Ele será ocultado das suas listas e não poderá mais ser escolhido para novas compras. O histórico é mantido, e você pode restaurá-lo depois.",
  },
  "creditCard.archive.submit": {
    en: "Archive card",
    "pt-BR": "Arquivar cartão",
  },
  "creditCard.archive.submitting": { en: "Archiving…", "pt-BR": "Arquivando…" },

  "creditCard.bills.trigger": { en: "Statements", "pt-BR": "Faturas" },
  "creditCard.bills.title": {
    en: "Statements — {name}",
    "pt-BR": "Faturas — {name}",
  },
  "creditCard.bills.description": {
    en: "Closes on day {closeDay}, due on day {dueDay}. A statement opens the first time you buy something in its cycle.",
    "pt-BR":
      "Fecha no dia {closeDay}, vence no dia {dueDay}. Uma fatura abre na primeira compra do ciclo.",
  },
  "creditCard.bills.loading": {
    en: "Loading statements",
    "pt-BR": "Carregando faturas",
  },
  "creditCard.bills.empty": {
    en: "No statements yet. Record a card purchase and the statement for its cycle appears here.",
    "pt-BR":
      "Nenhuma fatura ainda. Registre uma compra no cartão e a fatura do ciclo aparece aqui.",
  },
  "creditCard.bills.listLabel": { en: "Statements", "pt-BR": "Faturas" },
  "creditCard.bills.period": { en: "Period", "pt-BR": "Período" },
  "creditCard.bills.due": { en: "Due", "pt-BR": "Vencimento" },
  "creditCard.bills.statement": { en: "Statement", "pt-BR": "Fatura" },
  "creditCard.bills.paid": { en: "Paid", "pt-BR": "Pago" },
  "creditCard.bills.remaining": { en: "Remaining", "pt-BR": "Restante" },
  "creditCard.bills.status.open": { en: "Open", "pt-BR": "Aberta" },
  "creditCard.bills.status.awaiting_payment": {
    en: "Awaiting payment",
    "pt-BR": "Aguardando pagamento",
  },
  "creditCard.bills.status.paid": { en: "Paid", "pt-BR": "Paga" },

  "creditCard.toast.created": {
    en: "Card created successfully",
    "pt-BR": "Cartão criado com sucesso",
  },
  "creditCard.toast.updated": {
    en: "Card updated successfully",
    "pt-BR": "Cartão atualizado com sucesso",
  },
  "creditCard.toast.archived": {
    en: "Card archived",
    "pt-BR": "Cartão arquivado",
  },
  "creditCard.toast.restored": {
    en: "Card restored",
    "pt-BR": "Cartão restaurado",
  },
  "creditCard.toast.deleted": {
    en: "Card deleted successfully",
    "pt-BR": "Cartão excluído com sucesso",
  },
} as const satisfies MessageTable;
