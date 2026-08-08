import { useQuery } from "@tanstack/react-query";

import { api } from "../runtime";

export function useSubscriptionStatusQuery({
  enabled,
}: { enabled?: boolean } = {}) {
  const trpc = api();

  return useQuery({
    ...trpc.subscription.status.queryOptions(),
    staleTime: 0,
    enabled,
  });
}
