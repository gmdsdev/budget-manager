import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export function dashboardQueryInput(month?: string) {
  return month ? { month } : {};
}

export function useDashboardQuery(month?: string) {
  return useQuery(trpc.dashboard.getSummary.queryOptions(dashboardQueryInput(month)));
}
