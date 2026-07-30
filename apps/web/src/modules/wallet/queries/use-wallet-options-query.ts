import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export type WalletOption = {
  id: string;
  name: string;
  currencyCode: string;
};

/**
 * Every non-archived wallet, unpaginated — for select inputs, which must never
 * hide an option behind a page boundary.
 */
export function useWalletOptionsQuery() {
  return useQuery(trpc.wallet.options.queryOptions());
}
