import type { MessageTable } from "./table";

export const dates = {
  "dateRange.thisMonth": { en: "This month", "pt-BR": "Este mês" },
  "dateRange.lastMonth": { en: "Last month", "pt-BR": "Mês passado" },
  "dateRange.last3Months": {
    en: "Last 3 months",
    "pt-BR": "Últimos 3 meses",
  },
  "dateRange.thisYear": { en: "This year", "pt-BR": "Este ano" },
  "dateRange.next12Months": {
    en: "Next 12 months",
    "pt-BR": "Próximos 12 meses",
  },
} as const satisfies MessageTable;
