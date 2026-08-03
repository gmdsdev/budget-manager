import type { MessageTable } from "./table";

export const transaction = {
  "transaction.title": { en: "Transactions", "pt-BR": "Transações" },
  "transaction.caption": {
    en: "Your transactions",
    "pt-BR": "Suas transações",
  },
  "transaction.loading": {
    en: "Loading transactions",
    "pt-BR": "Carregando transações",
  },
  "transaction.loadFailed": {
    en: "Couldn't load your transactions",
    "pt-BR": "Não foi possível carregar suas transações",
  },
  "transaction.emptyFiltered.title": {
    en: "No transactions match these filters",
    "pt-BR": "Nenhuma transação corresponde a estes filtros",
  },
  "transaction.emptyFiltered.description": {
    en: "Try widening the date range or clearing a filter.",
    "pt-BR": "Tente ampliar o período ou limpar um filtro.",
  },
  "transaction.empty.title": {
    en: "No transactions yet",
    "pt-BR": "Nenhuma transação ainda",
  },
  "transaction.empty.description": {
    en: "Record your first income or expense to start tracking.",
    "pt-BR": "Registre sua primeira receita ou despesa para começar.",
  },

  "transaction.column.repeats": { en: "Repeats", "pt-BR": "Repetição" },
  "transaction.repeats.fixed": {
    en: "{count}× monthly",
    "pt-BR": "{count}× mensal",
  },
  "transaction.repeats.withInterval": {
    en: "{type} ×{interval}",
    "pt-BR": "{type} ×{interval}",
  },

  "transaction.filter.allKinds": { en: "All kinds", "pt-BR": "Todos os tipos" },
  "transaction.filter.allRows": {
    en: "All rows",
    "pt-BR": "Todas as linhas",
  },
  "transaction.filter.allStatuses": {
    en: "All statuses",
    "pt-BR": "Todas as situações",
  },
  "transaction.filter.allAccounts": {
    en: "All accounts",
    "pt-BR": "Todas as contas",
  },
  "transaction.filter.allCategories": {
    en: "All categories",
    "pt-BR": "Todas as categorias",
  },
  "transaction.filter.dateRange": { en: "Date range", "pt-BR": "Período" },
  "transaction.filter.kind": { en: "Kind", "pt-BR": "Tipo" },

  "transaction.field.selectAWallet": {
    en: "Select a wallet",
    "pt-BR": "Escolha uma carteira",
  },
  "transaction.field.selectACard": {
    en: "Select a card",
    "pt-BR": "Escolha um cartão",
  },
  "transaction.field.fromWallet": {
    en: "From wallet",
    "pt-BR": "Da carteira",
  },
  "transaction.field.toWallet": { en: "To wallet", "pt-BR": "Para a carteira" },
  "transaction.field.statement": { en: "Statement", "pt-BR": "Fatura" },
  "transaction.field.notAllocated": {
    en: "Not allocated",
    "pt-BR": "Não alocado",
  },
  "transaction.field.payFromWallet": {
    en: "Pay from wallet",
    "pt-BR": "Pagar da carteira",
  },
  "transaction.field.transferCurrencyHint": {
    en: "Both wallets must use the same currency.",
    "pt-BR": "As duas carteiras devem usar a mesma moeda.",
  },
  "transaction.field.cardPurchaseAmountHint": {
    en: "Adds to what the card owes. No wallet moves until you pay the bill.",
    "pt-BR":
      "Soma ao que o cartão deve. Nenhuma carteira se move até você pagar a fatura.",
  },
  "transaction.field.statementHint": {
    en: "Allocate this payment to an unpaid statement, or leave it against the card as a whole.",
    "pt-BR":
      "Aloque este pagamento a uma fatura em aberto, ou deixe-o no cartão como um todo.",
  },
  "transaction.field.cardPaymentAmountHint": {
    en: "Leaves the wallet and reduces what the card owes.",
    "pt-BR": "Sai da carteira e reduz o que o cartão deve.",
  },
  "transaction.field.enableRecurrence": {
    en: "Enable recurrence",
    "pt-BR": "Ativar recorrência",
  },
  "transaction.field.recurrenceType": {
    en: "Recurrence type",
    "pt-BR": "Tipo de recorrência",
  },
  "transaction.field.recurrenceHint": {
    en: "Repeats for the next {years} years; a year is scheduled at a time.",
    "pt-BR": "Repete pelos próximos {years} anos; um ano é agendado por vez.",
  },

  "transaction.create.trigger": {
    en: "Create Transaction",
    "pt-BR": "Criar transação",
  },
  "transaction.create.title": {
    en: "Create Transaction",
    "pt-BR": "Criar transação",
  },
  "transaction.create.submit": {
    en: "Create transaction",
    "pt-BR": "Criar transação",
  },
  "transaction.create.submitSeries": {
    en: "Create series",
    "pt-BR": "Criar série",
  },
  "transaction.create.description": {
    en: "Record an income or expense against one of your wallets.",
    "pt-BR": "Registre uma receita ou despesa em uma das suas carteiras.",
  },
  "transaction.edit.title": {
    en: "Edit Transaction",
    "pt-BR": "Editar transação",
  },
  "transaction.edit.description": {
    en: "Update the details for “{name}”.",
    "pt-BR": "Atualize os dados de “{name}”.",
  },

  "transfer.create.trigger": { en: "Transfer", "pt-BR": "Transferência" },
  "transfer.create.title": {
    en: "New Transfer",
    "pt-BR": "Nova transferência",
  },
  "transfer.create.submit": {
    en: "Create transfer",
    "pt-BR": "Criar transferência",
  },
  "transfer.create.description": {
    en: "Move money between two of your wallets.",
    "pt-BR": "Mova dinheiro entre duas das suas carteiras.",
  },
  "transfer.edit.title": {
    en: "Edit Transfer",
    "pt-BR": "Editar transferência",
  },
  "transfer.edit.description": {
    en: "Both legs of “{name}” are updated together.",
    "pt-BR": "As duas pernas de “{name}” são atualizadas juntas.",
  },
  "transfer.loading": {
    en: "Loading transfer",
    "pt-BR": "Carregando transferência",
  },

  "cardPurchase.create.trigger": {
    en: "Card purchase",
    "pt-BR": "Compra no cartão",
  },
  "cardPurchase.create.title": {
    en: "Card Purchase",
    "pt-BR": "Compra no cartão",
  },
  "cardPurchase.create.submit": {
    en: "Record purchase",
    "pt-BR": "Registrar compra",
  },
  "cardPurchase.create.submitting": {
    en: "Recording…",
    "pt-BR": "Registrando…",
  },
  "cardPurchase.create.description": {
    en: "Something bought on a card. It adds to the card's balance, not a wallet's.",
    "pt-BR":
      "Algo comprado no cartão. Soma ao saldo do cartão, não ao de uma carteira.",
  },
  "cardPurchase.edit.title": {
    en: "Edit Card Purchase",
    "pt-BR": "Editar compra no cartão",
  },
  "cardPurchase.edit.description": {
    en: "Update the details for “{name}”.",
    "pt-BR": "Atualize os dados de “{name}”.",
  },

  "cardPayment.create.trigger": { en: "Pay card", "pt-BR": "Pagar cartão" },
  "cardPayment.create.title": { en: "Pay Card", "pt-BR": "Pagar cartão" },
  "cardPayment.create.submit": {
    en: "Record payment",
    "pt-BR": "Registrar pagamento",
  },
  "cardPayment.create.submitting": {
    en: "Recording…",
    "pt-BR": "Registrando…",
  },
  "cardPayment.create.description": {
    en: "Money leaving a wallet to pay down a card.",
    "pt-BR": "Dinheiro saindo de uma carteira para abater um cartão.",
  },
  "cardPayment.edit.title": {
    en: "Edit Card Payment",
    "pt-BR": "Editar pagamento de cartão",
  },
  "cardPayment.edit.description": {
    en: "Update the details for “{name}”.",
    "pt-BR": "Atualize os dados de “{name}”.",
  },

  "transaction.create.moreTypes": {
    en: "More transaction types",
    "pt-BR": "Mais tipos de transação",
  },

  "transaction.detail.title": {
    en: "Transaction",
    "pt-BR": "Transação",
  },
  "transaction.detail.open": {
    en: "Open “{name}”",
    "pt-BR": "Abrir “{name}”",
  },
  "transaction.detail.series": {
    en: "Series",
    "pt-BR": "Série",
  },
  "transaction.detail.installments": {
    en: "{count}× instalments",
    "pt-BR": "{count}× parcelas",
  },

  "transaction.action.markAsPaid": {
    en: "Mark as paid",
    "pt-BR": "Marcar como pago",
  },
  "transaction.action.edit": { en: "Edit", "pt-BR": "Editar" },
  "transaction.action.editTransfer": {
    en: "Edit transfer",
    "pt-BR": "Editar transferência",
  },
  "transaction.action.editPurchase": {
    en: "Edit purchase",
    "pt-BR": "Editar compra",
  },
  "transaction.action.editPayment": {
    en: "Edit payment",
    "pt-BR": "Editar pagamento",
  },
  "transaction.action.pauseSeries": {
    en: "Pause series",
    "pt-BR": "Pausar série",
  },
  "transaction.action.resumeSeries": {
    en: "Resume series",
    "pt-BR": "Retomar série",
  },
  "transaction.action.delete": { en: "Delete", "pt-BR": "Excluir" },
  "transaction.action.deleteTransfer": {
    en: "Delete transfer",
    "pt-BR": "Excluir transferência",
  },
  "transaction.seriesPaused": {
    en: "Series paused — upcoming transactions removed",
    "pt-BR": "Série pausada — transações futuras removidas",
  },
  "transaction.seriesResumed": {
    en: "Series resumed — upcoming transactions scheduled",
    "pt-BR": "Série retomada — transações futuras agendadas",
  },

  "transaction.delete.title": {
    en: "Delete “{name}”?",
    "pt-BR": "Excluir “{name}”?",
  },
  "transaction.delete.description": {
    en: "This {amount} transaction from {date} will be permanently removed. This cannot be undone.",
    "pt-BR":
      "Esta transação de {amount} de {date} será removida permanentemente. Isso não pode ser desfeito.",
  },
  "transaction.delete.descriptionTransfer": {
    en: "This {amount} transfer from {date} will be permanently removed, including both of its legs. This cannot be undone.",
    "pt-BR":
      "Esta transferência de {amount} de {date} será removida permanentemente, incluindo as duas pernas. Isso não pode ser desfeito.",
  },
  "transaction.delete.submit": {
    en: "Delete transaction",
    "pt-BR": "Excluir transação",
  },
  "transaction.delete.submitTransfer": {
    en: "Delete transfer",
    "pt-BR": "Excluir transferência",
  },

  "transaction.summary.heading": { en: "Totals", "pt-BR": "Totais" },
  "transaction.summary.caption": {
    en: "Effective and projected figures per currency",
    "pt-BR": "Valores efetivos e projetados por moeda",
  },
  "transaction.summary.figure": { en: "Figure", "pt-BR": "Valor" },
  "transaction.summary.effective": { en: "Effective", "pt-BR": "Efetivo" },
  "transaction.summary.projected": { en: "Projected", "pt-BR": "Projetado" },
  "transaction.summary.inWallets": {
    en: "In wallets",
    "pt-BR": "Nas carteiras",
  },
  "transaction.summary.income": { en: "Income", "pt-BR": "Receitas" },
  "transaction.summary.expenses": { en: "Expenses", "pt-BR": "Despesas" },
  "transaction.summary.net": { en: "Net", "pt-BR": "Saldo" },
  "transaction.summary.note": {
    en: "Effective counts settled rows only; projected adds what is still waiting for payment. Balances cover every wallet up to {date}; income, expenses and net follow the filters above and leave out transfers and card payments, which move money without changing what you earned or spent.",
    "pt-BR":
      "O efetivo conta apenas os lançamentos liquidados; o projetado soma o que ainda aguarda pagamento. Os saldos cobrem todas as carteiras até {date}; receitas, despesas e saldo seguem os filtros acima e deixam de fora transferências e pagamentos de cartão, que movem dinheiro sem alterar o que você ganhou ou gastou.",
  },

  "transaction.toast.created": {
    en: "Transaction created successfully",
    "pt-BR": "Transação criada com sucesso",
  },
  "transaction.toast.updated": {
    en: "Transaction updated successfully",
    "pt-BR": "Transação atualizada com sucesso",
  },
  "transaction.toast.deleted": {
    en: "Transaction deleted successfully",
    "pt-BR": "Transação excluída com sucesso",
  },
  "transaction.toast.markedPaid": {
    en: "Transaction marked as paid",
    "pt-BR": "Transação marcada como paga",
  },
  "transfer.toast.created": {
    en: "Transfer created successfully",
    "pt-BR": "Transferência criada com sucesso",
  },
  "transfer.toast.updated": {
    en: "Transfer updated successfully",
    "pt-BR": "Transferência atualizada com sucesso",
  },
  "transfer.toast.deleted": {
    en: "Transfer deleted successfully",
    "pt-BR": "Transferência excluída com sucesso",
  },
  "cardPurchase.toast.created": {
    en: "Card purchase recorded",
    "pt-BR": "Compra no cartão registrada",
  },
  "cardPurchase.toast.updated": {
    en: "Card purchase updated",
    "pt-BR": "Compra no cartão atualizada",
  },
  "cardPayment.toast.created": {
    en: "Card payment recorded",
    "pt-BR": "Pagamento de cartão registrado",
  },
  "cardPayment.toast.updated": {
    en: "Card payment updated",
    "pt-BR": "Pagamento de cartão atualizado",
  },
} as const satisfies MessageTable;
