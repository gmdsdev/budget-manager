import { useQuery } from "@tanstack/react-query";

import { dashboardQueryInput } from "../dashboard";
import { api } from "../runtime";

export function useDashboardQuery(month?: string) {
  return useQuery(
    api().dashboard.getSummary.queryOptions(dashboardQueryInput(month)),
  );
}
