import {
  type MutationOptions,
  type QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

type ApiMutationProps<TData, TVariables> = MutationOptions<
  TData,
  unknown,
  TVariables
> & {
  successMessage?: string;
  errorMessage?: string;
  suppressErrorToast?: boolean;
  invalidateQueries?: QueryFilters | QueryFilters[];
};

export function useApiMutation<TData, TVariables>({
  successMessage,
  errorMessage,
  suppressErrorToast,
  invalidateQueries,
  ...options
}: ApiMutationProps<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    meta: { errorMessage, suppressErrorToast },
    onSuccess: (data, variables, onMutateResult, context) => {
      if (successMessage) {
        toast.success(successMessage);
      }

      const filters = Array.isArray(invalidateQueries)
        ? invalidateQueries
        : invalidateQueries
          ? [invalidateQueries]
          : [];

      const invalidation = Promise.all(
        filters.map((filter) => queryClient.invalidateQueries(filter)),
      );

      options.onSuccess?.(data, variables, onMutateResult, context);

      return invalidation;
    },
  });
}
