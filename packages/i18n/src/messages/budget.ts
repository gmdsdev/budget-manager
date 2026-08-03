import type { MessageTable } from "./table";

export const budget = {
  "budget.title": { en: "Budgets", "pt-BR": "Orçamentos" },
  "budget.caption": {
    en: "Your recurring limits",
    "pt-BR": "Seus limites recorrentes",
  },
  "budget.loading": { en: "Loading budgets", "pt-BR": "Carregando orçamentos" },
  "budget.loadFailed": {
    en: "Couldn't load your budgets",
    "pt-BR": "Não foi possível carregar seus orçamentos",
  },
  "budget.empty.title": { en: "No budgets yet", "pt-BR": "Nenhum orçamento ainda" },
  "budget.empty.description": {
    en: "Set a monthly limit on a category and every month after it follows the same limit until you change it.",
    "pt-BR":
      "Defina um limite mensal para uma categoria e todos os meses seguintes seguem o mesmo limite até você mudá-lo.",
  },
  "budget.emptyFiltered.title": {
    en: "No budgets match these filters",
    "pt-BR": "Nenhum orçamento corresponde a estes filtros",
  },
  "budget.emptyFiltered.description": {
    en: "Try a different category or currency, or clear the filters.",
    "pt-BR": "Tente outra categoria ou moeda, ou limpe os filtros.",
  },

  "budget.month.title": { en: "This month", "pt-BR": "Este mês" },
  "budget.month.description": {
    en: "What each category may spend in {month}, and what it has spent so far.",
    "pt-BR":
      "Quanto cada categoria pode gastar em {month}, e quanto já gastou.",
  },
  "budget.month.empty": {
    en: "No limits set for this month.",
    "pt-BR": "Nenhum limite definido para este mês.",
  },
  "budget.month.note": {
    en: "Spending counts scheduled rows as well as settled ones, so a bill you have not paid yet already uses up its budget.",
    "pt-BR":
      "Os gastos incluem lançamentos agendados além dos pagos, então uma conta ainda não paga já consome seu orçamento.",
  },
  "budget.month.previous": { en: "Previous", "pt-BR": "Anterior" },
  "budget.month.next": { en: "Next", "pt-BR": "Próximo" },

  "budget.meter.remaining": {
    en: "{amount} left",
    "pt-BR": "Restam {amount}",
  },
  "budget.meter.over": {
    en: "{amount} over",
    "pt-BR": "{amount} acima",
  },
  "budget.meter.spentOfLimit": {
    en: "{spent} of {limit}",
    "pt-BR": "{spent} de {limit}",
  },
  "budget.meter.settled": {
    en: "{amount} of it already paid",
    "pt-BR": "{amount} disso já pago",
  },
  "budget.meter.overridden": {
    en: "Set for this month only",
    "pt-BR": "Definido só para este mês",
  },

  "budget.totals.budgeted": { en: "Budgeted", "pt-BR": "Orçado" },
  "budget.totals.spent": { en: "Spent", "pt-BR": "Gasto" },
  "budget.totals.left": { en: "Left to spend", "pt-BR": "Disponível" },
  "budget.totals.exceeded": {
    en: "{count} over budget",
    "pt-BR": "{count} acima do orçamento",
  },
  "budget.totals.oneExceeded": {
    en: "1 over budget",
    "pt-BR": "1 acima do orçamento",
  },
  "budget.totals.allWithin": {
    en: "All within budget",
    "pt-BR": "Tudo dentro do orçamento",
  },

  "budget.column.limit": { en: "Limit", "pt-BR": "Limite" },
  "budget.column.repeats": { en: "Repeats", "pt-BR": "Repetição" },
  "budget.column.startsOn": { en: "Starts on", "pt-BR": "Começa em" },
  "budget.column.months": { en: "Months", "pt-BR": "Meses" },
  "budget.column.spent": { en: "Spent", "pt-BR": "Gasto" },
  "budget.column.remaining": { en: "Remaining", "pt-BR": "Restante" },
  "budget.column.month": { en: "Month", "pt-BR": "Mês" },

  "budget.detail.title": { en: "Budget", "pt-BR": "Orçamento" },
  "budget.detail.open": {
    en: "Open “{name}”",
    "pt-BR": "Abrir “{name}”",
  },

  "budget.repeats.everyMonth": { en: "Every month", "pt-BR": "Todo mês" },
  "budget.repeats.everyMonths": {
    en: "Every {count} months",
    "pt-BR": "A cada {count} meses",
  },
  "budget.repeats.everyYear": { en: "Every year", "pt-BR": "Todo ano" },
  "budget.repeats.everyYears": {
    en: "Every {count} years",
    "pt-BR": "A cada {count} anos",
  },
  "budget.repeats.fixed": {
    en: "{count}× monthly",
    "pt-BR": "{count}× mensal",
  },
  "budget.repeats.paused": { en: "Paused", "pt-BR": "Pausado" },
  "budget.repeats.active": { en: "Active", "pt-BR": "Ativo" },

  "budget.field.category": { en: "Category", "pt-BR": "Categoria" },
  "budget.field.categoryHint": {
    en: "Only expense categories can carry a limit.",
    "pt-BR": "Somente categorias de despesa podem ter um limite.",
  },
  "budget.field.limit": { en: "Monthly limit", "pt-BR": "Limite mensal" },
  "budget.field.limitHint": {
    en: "Applies to every month in the series until you change one.",
    "pt-BR": "Vale para todos os meses da série até você mudar algum.",
  },
  "budget.field.startsOn": { en: "Starts in", "pt-BR": "Começa em" },
  "budget.field.startsOnHint": {
    en: "Earlier months keep whatever they already had.",
    "pt-BR": "Os meses anteriores mantêm o que já tinham.",
  },
  "budget.field.repeats": { en: "Repeats", "pt-BR": "Repetição" },
  "budget.field.every": { en: "Every", "pt-BR": "A cada" },
  "budget.field.periods": { en: "Number of months", "pt-BR": "Quantidade de meses" },
  "budget.field.openEndedHint": {
    en: "Runs for the next {years} years; a year of months is materialized at a time.",
    "pt-BR":
      "Vale pelos próximos {years} anos; um ano de meses é gerado por vez.",
  },
  "budget.field.fixedHint": {
    en: "A set number of monthly periods.",
    "pt-BR": "Um número fixo de períodos mensais.",
  },
  "budget.field.intervalHint": {
    en: "{unit} between periods.",
    "pt-BR": "{unit} entre os períodos.",
  },
  "budget.selectACategory": {
    en: "Select a category",
    "pt-BR": "Escolha uma categoria",
  },

  "budget.filter.allCategories": {
    en: "All categories",
    "pt-BR": "Todas as categorias",
  },
  "budget.filter.allCurrencies": {
    en: "All currencies",
    "pt-BR": "Todas as moedas",
  },
  "budget.filter.allStates": { en: "All states", "pt-BR": "Todos os estados" },

  "budget.create.trigger": { en: "Create Budget", "pt-BR": "Criar orçamento" },
  "budget.create.title": { en: "Create Budget", "pt-BR": "Criar orçamento" },
  "budget.create.description": {
    en: "Set a limit for a category. Every month from the starting month on follows it, and you can change any single month later.",
    "pt-BR":
      "Defina um limite para uma categoria. Todos os meses a partir do mês inicial seguem esse limite, e você pode alterar qualquer mês depois.",
  },
  "budget.create.submit": { en: "Create budget", "pt-BR": "Criar orçamento" },

  "budget.edit.title": { en: "Edit Budget", "pt-BR": "Editar orçamento" },
  "budget.edit.description": {
    en: "The month in progress and every month after it take the new limit. Months already past, and any month you set by hand, stay as they are.",
    "pt-BR":
      "O mês em curso e todos os seguintes passam a usar o novo limite. Os meses já encerrados, e qualquer mês definido manualmente, permanecem como estão.",
  },
  "budget.edit.action": { en: "Edit budget", "pt-BR": "Editar orçamento" },

  "budget.pause.action": { en: "Pause budget", "pt-BR": "Pausar orçamento" },
  "budget.resume.action": { en: "Resume budget", "pt-BR": "Retomar orçamento" },

  "budget.delete.title": {
    en: "Delete the budget for “{name}”?",
    "pt-BR": "Excluir o orçamento de “{name}”?",
  },
  "budget.delete.description": {
    en: "Months that have not started yet are removed. Months already past, and any month you set by hand, stay in your history.",
    "pt-BR":
      "Os meses que ainda não começaram são removidos. Os meses já encerrados, e qualquer mês definido manualmente, permanecem no histórico.",
  },
  "budget.delete.submit": { en: "Delete budget", "pt-BR": "Excluir orçamento" },

  "budget.periods.action": { en: "View months", "pt-BR": "Ver meses" },
  "budget.periods.title": {
    en: "Months for “{name}”",
    "pt-BR": "Meses de “{name}”",
  },
  "budget.periods.description": {
    en: "Every month this budget covers. Change one and it stops following the series until you reset it.",
    "pt-BR":
      "Todos os meses cobertos por este orçamento. Ao alterar um, ele deixa de seguir a série até você restaurá-lo.",
  },
  "budget.periods.loading": {
    en: "Loading months",
    "pt-BR": "Carregando meses",
  },
  "budget.periods.empty": {
    en: "No months materialized yet.",
    "pt-BR": "Nenhum mês gerado ainda.",
  },
  "budget.periods.caption": {
    en: "Limit and spending per month",
    "pt-BR": "Limite e gastos por mês",
  },
  "budget.periods.custom": { en: "Custom", "pt-BR": "Personalizado" },
  "budget.periods.inherited": { en: "From series", "pt-BR": "Da série" },

  "budget.period.edit.title": {
    en: "Limit for {month}",
    "pt-BR": "Limite de {month}",
  },
  "budget.period.edit.description": {
    en: "Changing one month only affects that month. The rest of the series keeps its own limit.",
    "pt-BR":
      "Alterar um mês afeta somente esse mês. O restante da série mantém seu limite.",
  },
  "budget.period.edit.action": { en: "Edit this month", "pt-BR": "Editar este mês" },
  "budget.period.editFor": {
    en: "Edit {name} in {month}",
    "pt-BR": "Editar {name} em {month}",
  },
  "budget.period.resetFor": {
    en: "Reset {name} in {month} to the series limit",
    "pt-BR": "Redefinir {name} em {month} para o limite da série",
  },
  "budget.period.reset.action": {
    en: "Follow the series again",
    "pt-BR": "Voltar a seguir a série",
  },

  "budget.toast.created": { en: "Budget created", "pt-BR": "Orçamento criado" },
  "budget.toast.updated": {
    en: "Budget updated",
    "pt-BR": "Orçamento atualizado",
  },
  "budget.toast.deleted": {
    en: "Budget deleted",
    "pt-BR": "Orçamento excluído",
  },
  "budget.toast.periodUpdated": {
    en: "Month limit updated",
    "pt-BR": "Limite do mês atualizado",
  },
  "budget.toast.periodReset": {
    en: "Month follows the series again",
    "pt-BR": "O mês voltou a seguir a série",
  },
} as const satisfies MessageTable;
