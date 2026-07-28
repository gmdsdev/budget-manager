import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export function useWalletsQuery() {
  return useQuery(trpc.wallet.getAll.queryOptions());
}
