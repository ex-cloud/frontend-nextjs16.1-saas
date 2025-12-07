import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UseApiOptions<TData, TVariables> {
  queryKey?: unknown[];
  queryFn?: () => Promise<TData>;
  mutationFn?: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

/**
 * Generic hook for API queries
 */
export function useApiQuery<TData>(options: UseApiOptions<TData, never>) {
  return useQuery({
    queryKey: options.queryKey ?? [],
    queryFn: options.queryFn!,
    enabled: options.enabled,
  });
}

/**
 * Generic hook for API mutations
 */
export function useApiMutation<TData, TVariables = void>(
  options: UseApiOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: options.mutationFn!,
    onSuccess: (data) => {
      options.onSuccess?.(data);
      // Invalidate related queries
      if (options.queryKey) {
        queryClient.invalidateQueries({ queryKey: options.queryKey });
      }
    },
    onError: options.onError,
  });
}
