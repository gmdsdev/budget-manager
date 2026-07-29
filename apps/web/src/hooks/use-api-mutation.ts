import { queryClient } from "@/utils/trpc";
import {
  MutationOptions,
  QueryFilters,
  useMutation,
} from "@tanstack/react-query";
import { toast } from "sonner";

type ApiMutationProps<TData, TVariables> = MutationOptions<
  TData,
  unknown,
  TVariables
> & {
  successMessage?: string;
  errorMessage?: string;
  invalidateQueries?: QueryFilters;
};

export function useApiMutation<TData, TVariables>({
  successMessage,
  errorMessage,
  invalidateQueries,
  ...options
}: ApiMutationProps<TData, TVariables>) {
  return useMutation({
    ...options,
    onSuccess: (data, variables, context, meta) => {
      if (successMessage) {
        toast.success(successMessage);
      }

      if (invalidateQueries) {
        queryClient.invalidateQueries(invalidateQueries);
      }

      options.onSuccess?.(data, variables, context, meta);
    },
    onError: (error, variables, context, meta) => {
      if (errorMessage) {
        toast.error(errorMessage);
      }

      options.onError?.(error, variables, context, meta);
    },
  });
}
