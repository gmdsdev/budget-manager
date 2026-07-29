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
  invalidateQueries?: QueryFilters;
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

      const invalidation = invalidateQueries
        ? queryClient.invalidateQueries(invalidateQueries)
        : undefined;

      options.onSuccess?.(data, variables, onMutateResult, context);

      return invalidation;
    },
  });
}
