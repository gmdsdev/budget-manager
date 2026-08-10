import type { MessageTable } from "./table";

export const dashboard = {
  "dashboard.title": { en: "Dashboard", "pt-BR": "Painel" },
  "dashboard.loading": {
    en: "Loading dashboard",
    "pt-BR": "Carregando painel",
  },
  "dashboard.loadFailed": {
    en: "Couldn't load your dashboard",
    "pt-BR": "Não foi possível carregar seu painel",
  },
  "dashboard.empty.title": {
    en: "Nothing to summarize yet",
    "pt-BR": "Nada para resumir ainda",
  },
  "dashboard.empty.description": {
    en: "Create a wallet and record a transaction, and your balances and spending will show up here.",
    "pt-BR":
      "Crie uma carteira e registre uma transação, e seus saldos e gastos aparecerão aqui.",
  },
  "dashboard.empty.action": { en: "Go to wallets", "pt-BR": "Ir para carteiras" },
  "dashboard.previousMonth": { en: "Previous", "pt-BR": "Anterior" },
  "dashboard.nextMonth": { en: "Next", "pt-BR": "Próximo" },

  "dashboard.section.label": {
    en: "{currency} summary",
    "pt-BR": "Resumo em {currency}",
  },
  "dashboard.accounts.oneWallet": { en: "1 wallet", "pt-BR": "1 carteira" },
  "dashboard.accounts.wallets": {
    en: "{count} wallets",
    "pt-BR": "{count} carteiras",
  },
  "dashboard.accounts.oneCard": { en: "1 card", "pt-BR": "1 cartão" },
  "dashboard.accounts.cards": {
    en: "{count} cards",
    "pt-BR": "{count} cartões",
  },

  "dashboard.stat.inWallets": { en: "In wallets", "pt-BR": "Nas carteiras" },
  "dashboard.stat.income": { en: "Income", "pt-BR": "Receitas" },
  "dashboard.stat.income.hint": {
    en: "Earned in {month}",
    "pt-BR": "Recebido em {month}",
  },
  "dashboard.stat.expenses": { en: "Expenses", "pt-BR": "Despesas" },
  "dashboard.stat.expenses.hint": {
    en: "Spent in {month}",
    "pt-BR": "Gasto em {month}",
  },
  "dashboard.stat.net": { en: "Net", "pt-BR": "Saldo" },
  "dashboard.stat.net.hint": {
    en: "Income minus spending, pending rows included",
    "pt-BR": "Receitas menos gastos, incluindo pendentes",
  },
  // `apps/native` reads its cash-flow figures out as one sentence per month rather
  // than drawing the web's table twin: four columns of money do not fit a phone, and
  // a screen reader wants the month named beside its figures either way.
  "dashboard.cashFlow.monthSummary": {
    en: "{month}: {income} in, {expenses} out, net {net}",
    "pt-BR": "{month}: {income} de entrada, {expenses} de saída, saldo {net}",
  },
  "dashboard.stat.onCards": { en: "On cards", "pt-BR": "Nos cartões" },
  "dashboard.stat.onCards.hint": {
    en: "Outstanding across your cards",
    "pt-BR": "Em aberto em todos os seus cartões",
  },
  "dashboard.stat.creditAvailable": {
    en: "Credit available",
    "pt-BR": "Crédito disponível",
  },
  "dashboard.stat.creditAvailable.hint": {
    en: "Limits minus what is owed",
    "pt-BR": "Limites menos o que é devido",
  },
  "dashboard.stat.netPosition": {
    en: "Net position",
    "pt-BR": "Posição líquida",
  },
  "dashboard.stat.netPosition.hint": {
    en: "Wallets minus what the cards owe",
    "pt-BR": "Carteiras menos o que os cartões devem",
  },

  "dashboard.cashFlow.title": { en: "Cash flow", "pt-BR": "Fluxo de caixa" },
  "dashboard.cashFlow.description": {
    en: "Income against spending, month by month. Transfers are left out — they move money without earning or spending it.",
    "pt-BR":
      "Receitas contra gastos, mês a mês. Transferências ficam de fora — elas movem dinheiro sem ganhar nem gastar.",
  },
  "dashboard.cashFlow.empty": {
    en: "Nothing recorded in these six months yet.",
    "pt-BR": "Nada registrado nestes seis meses ainda.",
  },
  "dashboard.cashFlow.net": { en: "Net {amount}", "pt-BR": "Saldo {amount}" },
  "dashboard.cashFlow.tableCaption": {
    en: "Income, spending and net per month, in {currency}",
    "pt-BR": "Receitas, gastos e saldo por mês, em {currency}",
  },
  "dashboard.cashFlow.month": { en: "Month", "pt-BR": "Mês" },

  "dashboard.spending.title": {
    en: "Top spending categories",
    "pt-BR": "Principais categorias de gasto",
  },
  "dashboard.spending.description": {
    en: "Where {month}'s money went, largest first.",
    "pt-BR": "Para onde foi o dinheiro de {month}, do maior para o menor.",
  },
  "dashboard.spending.empty": {
    en: "No spending recorded this month.",
    "pt-BR": "Nenhum gasto registrado neste mês.",
  },
  "dashboard.spending.rest": {
    en: "{amount} more across other categories.",
    "pt-BR": "Mais {amount} em outras categorias.",
  },

  "dashboard.wallets.title": { en: "Wallets", "pt-BR": "Carteiras" },
  "dashboard.wallets.description": {
    en: "Where this money sits.",
    "pt-BR": "Onde este dinheiro está.",
  },
  "dashboard.wallets.pending": {
    en: "{amount} once pending rows settle",
    "pt-BR": "{amount} quando os pendentes forem liquidados",
  },

  "dashboard.cards.title": { en: "Credit cards", "pt-BR": "Cartões de crédito" },
  "dashboard.cards.description": {
    en: "How much of each limit is in use.",
    "pt-BR": "Quanto de cada limite está em uso.",
  },
  "dashboard.cards.limitUsed": {
    en: "{name} limit used",
    "pt-BR": "Limite usado de {name}",
  },
  "dashboard.cards.percentOfLimit": {
    en: "{percent}% of the limit",
    "pt-BR": "{percent}% do limite",
  },
  "dashboard.cards.overLimit": {
    en: "Over limit by {amount}",
    "pt-BR": "Acima do limite em {amount}",
  },
  "dashboard.cards.used": {
    en: "{percent}% used · {amount} available",
    "pt-BR": "{percent}% usado · {amount} disponível",
  },

  "dashboard.budgets.title": { en: "Budgets", "pt-BR": "Orçamentos" },
  "dashboard.budgets.description": {
    en: "How much of each limit {month} has used.",
    "pt-BR": "Quanto de cada limite {month} já usou.",
  },
  "dashboard.budgets.empty": {
    en: "No limits set for this month.",
    "pt-BR": "Nenhum limite definido para este mês.",
  },
  "dashboard.budgets.action": { en: "Open budgets", "pt-BR": "Abrir orçamentos" },
  "dashboard.budgets.left": {
    en: "{amount} left to spend",
    "pt-BR": "{amount} disponível para gastar",
  },
  "dashboard.budgets.more": {
    en: "{count} more budgeted categories.",
    "pt-BR": "Mais {count} categorias com orçamento.",
  },

  "dashboard.statements.title": {
    en: "Card statements",
    "pt-BR": "Faturas de cartão",
  },
  "dashboard.statements.none": {
    en: "What your cards still owe, soonest due first.",
    "pt-BR": "O que seus cartões ainda devem, vencimento mais próximo primeiro.",
  },
  "dashboard.statements.oneOverdue": {
    en: "1 past its due date.",
    "pt-BR": "1 vencida.",
  },
  "dashboard.statements.overdue": {
    en: "{count} past their due date.",
    "pt-BR": "{count} vencidas.",
  },
  "dashboard.statements.empty": {
    en: "Nothing outstanding on your cards.",
    "pt-BR": "Nada em aberto nos seus cartões.",
  },
  "dashboard.statements.due": { en: "Due {date}", "pt-BR": "Vence em {date}" },
  "dashboard.statements.partiallyPaid": {
    en: "{paid} of {total} paid",
    "pt-BR": "{paid} de {total} pago",
  },
  "dashboard.statements.open": {
    en: "Find “{name}” in credit cards",
    "pt-BR": "Encontrar “{name}” nos cartões de crédito",
  },
  "dashboard.statements.action": {
    en: "Record a payment",
    "pt-BR": "Registrar um pagamento",
  },
  "dashboard.statements.status.open": {
    en: "Still open",
    "pt-BR": "Ainda aberta",
  },
  "dashboard.statements.status.awaiting_payment": {
    en: "Awaiting payment",
    "pt-BR": "Aguardando pagamento",
  },
  "dashboard.statements.status.paid": { en: "Paid", "pt-BR": "Paga" },

  "dashboard.pending.title": {
    en: "Awaiting payment",
    "pt-BR": "Aguardando pagamento",
  },
  "dashboard.pending.none": {
    en: "Nothing overdue — soonest first.",
    "pt-BR": "Nada vencido — mais próximo primeiro.",
  },
  "dashboard.pending.overdue": {
    en: "{count} overdue, oldest first.",
    "pt-BR": "{count} vencido(s), mais antigo primeiro.",
  },
  "dashboard.pending.empty": {
    en: "Nothing outstanding — you're all caught up.",
    "pt-BR": "Nada em aberto — você está em dia.",
  },
  "dashboard.pending.overdueFlag": { en: "Overdue", "pt-BR": "Vencido" },
  "dashboard.pending.action": {
    en: "Open transactions",
    "pt-BR": "Abrir transações",
  },
  "dashboard.pending.open": {
    en: "Find “{name}” in transactions",
    "pt-BR": "Encontrar “{name}” nas transações",
  },
} as const satisfies MessageTable;
