import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

/** Every non-archived card, unpaginated — for select inputs. */
export function useCreditCardOptionsQuery() {
  return useQuery(trpc.creditCard.options.queryOptions());
}
