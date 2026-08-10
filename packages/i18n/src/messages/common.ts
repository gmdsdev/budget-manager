import type { MessageTable } from "./table";

export const common = {
  "common.cancel": { en: "Cancel", "pt-BR": "Cancelar" },
  "common.save": { en: "Save", "pt-BR": "Salvar" },
  "common.saveChanges": { en: "Save changes", "pt-BR": "Salvar alterações" },
  "common.saving": { en: "Saving…", "pt-BR": "Salvando…" },
  "common.creating": { en: "Creating…", "pt-BR": "Criando…" },
  "common.edit": { en: "Edit", "pt-BR": "Editar" },
  "common.delete": { en: "Delete", "pt-BR": "Excluir" },
  "common.deleting": { en: "Deleting…", "pt-BR": "Excluindo…" },
  "common.archive": { en: "Archive", "pt-BR": "Arquivar" },
  "common.retry": { en: "Retry", "pt-BR": "Tentar novamente" },
  "common.retrying": { en: "Retrying…", "pt-BR": "Tentando novamente…" },
  "common.tryAgain": { en: "Try again", "pt-BR": "Tentar novamente" },
  "common.actions": { en: "Actions", "pt-BR": "Ações" },
  "common.actionsFor": {
    en: "Actions for {name}",
    "pt-BR": "Ações de {name}",
  },
  "common.name": { en: "Name", "pt-BR": "Nome" },
  "common.type": { en: "Type", "pt-BR": "Tipo" },
  "common.currency": { en: "Currency", "pt-BR": "Moeda" },
  "common.amount": { en: "Amount", "pt-BR": "Valor" },
  "common.date": { en: "Date", "pt-BR": "Data" },
  "common.status": { en: "Status", "pt-BR": "Situação" },
  "common.notes": { en: "Notes", "pt-BR": "Observações" },
  "common.notesOptional": {
    en: "Notes (optional)",
    "pt-BR": "Observações (opcional)",
  },
  "common.category": { en: "Category", "pt-BR": "Categoria" },
  "common.wallet": { en: "Wallet", "pt-BR": "Carteira" },
  "common.card": { en: "Card", "pt-BR": "Cartão" },
  "common.account": { en: "Account", "pt-BR": "Conta" },
  "common.description": { en: "Description", "pt-BR": "Descrição" },
  "common.none": { en: "—", "pt-BR": "—" },
  "common.somethingWentWrong": {
    en: "Something went wrong",
    "pt-BR": "Algo deu errado",
  },
  "common.pleaseTryAgain": {
    en: "Please try again.",
    "pt-BR": "Tente novamente.",
  },
  "common.noResults": { en: "No results.", "pt-BR": "Nenhum resultado." },
  "common.clearFilters": { en: "Clear filters", "pt-BR": "Limpar filtros" },
  // `apps/native` collapses the transaction bar behind this: seven controls is five
  // rows on a phone, and the ledger they scope starts below them.
  "common.filters": { en: "Filters", "pt-BR": "Filtros" },
  "common.filtersApplied": {
    en: "Filters ({count})",
    "pt-BR": "Filtros ({count})",
  },
  "common.filterBy": {
    en: "Filter by {column}",
    "pt-BR": "Filtrar por {column}",
  },
  "common.openMenu": { en: "Open menu", "pt-BR": "Abrir menu" },
  "common.menu": { en: "Menu", "pt-BR": "Menu" },
  "common.theme": { en: "Theme", "pt-BR": "Tema" },
  "common.lightTheme": { en: "Light theme", "pt-BR": "Tema claro" },
  "common.darkTheme": { en: "Dark theme", "pt-BR": "Tema escuro" },
  "common.light": { en: "Light", "pt-BR": "Claro" },
  "common.dark": { en: "Dark", "pt-BR": "Escuro" },
  "common.scrollToEnd": { en: "Scroll to end", "pt-BR": "Ir para o fim" },
  "common.scrollToStart": {
    en: "Scroll to start",
    "pt-BR": "Ir para o início",
  },
  "common.pickADate": { en: "Pick a date", "pt-BR": "Escolha uma data" },
  "common.pickADateRange": {
    en: "Pick a date range",
    "pt-BR": "Escolha um período",
  },
  // Not `dateRange.*`: that namespace is exactly the set of preset labels, which
  // is what makes `DateRangePresetKey` derivable from the catalog.
  "common.previousPeriod": {
    en: "Previous period",
    "pt-BR": "Período anterior",
  },
  "common.nextPeriod": { en: "Next period", "pt-BR": "Próximo período" },
  "common.clear": { en: "Clear", "pt-BR": "Limpar" },
  "common.close": { en: "Close", "pt-BR": "Fechar" },
  "common.back": { en: "Back", "pt-BR": "Voltar" },
} as const satisfies MessageTable;
