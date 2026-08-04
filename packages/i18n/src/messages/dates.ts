import type { MessageTable } from "./table";

export const dates = {
  "dateRange.thisMonth": { en: "This month", "pt-BR": "Este mês" },
  "dateRange.lastMonth": { en: "Last month", "pt-BR": "Mês passado" },
  "dateRange.thisWeek": { en: "This week", "pt-BR": "Esta semana" },
  "dateRange.lastWeek": { en: "Last week", "pt-BR": "Semana passada" },
  "dateRange.today": { en: "Today", "pt-BR": "Hoje" },
  "dateRange.custom": { en: "Custom", "pt-BR": "Personalizado" },
} as const satisfies MessageTable;
