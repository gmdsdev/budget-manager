import type { MessageTable } from "./table";

export const recurring = {
  "recurring.field.kind": { en: "Kind", "pt-BR": "Tipo" },
  "recurring.field.repeats": { en: "Repeats", "pt-BR": "Repetição" },
  "recurring.field.every": { en: "Every", "pt-BR": "A cada" },
  "recurring.field.installments": { en: "Installments", "pt-BR": "Parcelas" },
  "recurring.field.startsOn": { en: "Starts on", "pt-BR": "Começa em" },
  "recurring.field.amountHint": {
    en: "Charged on every occurrence in the series.",
    "pt-BR": "Cobrado em cada ocorrência da série.",
  },
  "recurring.field.fixedHint": {
    en: "A set number of monthly installments.",
    "pt-BR": "Um número fixo de parcelas mensais.",
  },
  "recurring.field.openEndedHint": {
    en: "Repeats for the next {years} years; a year is materialized at a time.",
    "pt-BR":
      "Repete pelos próximos {years} anos; um ano é gerado por vez.",
  },
  "recurring.field.intervalHint": {
    en: "{unit} between occurrences.",
    "pt-BR": "{unit} entre as ocorrências.",
  },
  "recurring.unit.weeks": { en: "weeks", "pt-BR": "semanas" },
  "recurring.unit.months": { en: "months", "pt-BR": "meses" },
  "recurring.unit.years": { en: "years", "pt-BR": "anos" },

  "recurring.selectACard": { en: "Select a card", "pt-BR": "Escolha um cartão" },
  "recurring.selectAWallet": {
    en: "Select a wallet",
    "pt-BR": "Escolha uma carteira",
  },

  "recurring.edit.title": { en: "Edit Series", "pt-BR": "Editar série" },
  "recurring.edit.description": {
    en: "Scheduled transactions ahead of today are re-created. Anything already settled or in the past is left alone.",
    "pt-BR":
      "As transações agendadas a partir de hoje são recriadas. O que já foi pago ou está no passado não é alterado.",
  },
  "recurring.edit.action": { en: "Edit series", "pt-BR": "Editar série" },

  "recurring.delete.title": {
    en: "Delete “{name}”?",
    "pt-BR": "Excluir “{name}”?",
  },
  "recurring.delete.description": {
    en: "Scheduled transactions still ahead of today are removed. Anything already settled or in the past stays in your history.",
    "pt-BR":
      "As transações agendadas a partir de hoje são removidas. O que já foi pago ou está no passado permanece no histórico.",
  },
  "recurring.delete.submit": { en: "Delete series", "pt-BR": "Excluir série" },

  "recurring.toast.created": {
    en: "Recurring series created",
    "pt-BR": "Série recorrente criada",
  },
  "recurring.toast.updated": {
    en: "Recurring series updated",
    "pt-BR": "Série recorrente atualizada",
  },
  "recurring.toast.deleted": {
    en: "Recurring series deleted",
    "pt-BR": "Série recorrente excluída",
  },
} as const satisfies MessageTable;
