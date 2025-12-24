/**
 * Position React Query Hooks
 * 
 * Custom hooks for position data fetching and mutations
 * Uses React Query for caching, refetching, and optimistic updates
 * 
 * @see panel-admin/lib/api/positions.ts
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { positionApi } from '@/lib/api/positions';
import type {
  Position,
  PositionInput,
  PositionFilters,
  User,
  PaginatedResponse,
} from '@/types/hrm';
import { toast } from 'sonner';

// ============================================================================
// Query Keys
// ============================================================================

export const positionKeys = {
  all: ['positions'] as const,
  lists: () => [...positionKeys.all, 'list'] as const,
  list: (filters?: PositionFilters) => [...positionKeys.lists(), filters] as const,
  details: () => [...positionKeys.all, 'detail'] as const,
  detail: (id: number) => [...positionKeys.details(), id] as const,
  byDepartment: (departmentId: number) => [...positionKeys.all, 'by-department', departmentId] as const,
  users: (id: number) => [...positionKeys.detail(id), 'users'] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch paginated list of positions
 */
export function usePositions(
  filters?: PositionFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<Position>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: positionKeys.list(filters),
    queryFn: () => positionApi.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Fetch single position by ID
 */
export function usePosition(
  id: number,
  options?: Omit<UseQueryOptions<Position>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: positionKeys.detail(id),
    queryFn: () => positionApi.get(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
    ...options,
  });
}

/**
 * Fetch positions by department
 */
export function usePositionsByDepartment(
  departmentId: number,
  page = 1,
  perPage = 15,
  options?: Omit<UseQueryOptions<PaginatedResponse<Position>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...positionKeys.byDepartment(departmentId), page, perPage],
    queryFn: () => positionApi.getByDepartment(departmentId, page, perPage),
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Fetch users with a specific position
 */
export function usePositionUsers(
  positionId: number,
  page = 1,
  perPage = 15,
  options?: Omit<UseQueryOptions<PaginatedResponse<User>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...positionKeys.users(positionId), page, perPage],
    queryFn: () => positionApi.getUsers(positionId, page, perPage),
    enabled: !!positionId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create new position
 */
export function useCreatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PositionInput) => positionApi.create(data),
    onSuccess: (newPosition) => {
      // Invalidate position lists
      queryClient.invalidateQueries({ queryKey: positionKeys.lists() });
      
      // Invalidate department positions if department is set
      if (newPosition.department_id) {
        queryClient.invalidateQueries({ 
          queryKey: positionKeys.byDepartment(newPosition.department_id) 
        });
      }

      toast.success('Position created successfully', {
        description: `${newPosition.name} has been created.`,
      });
    },
    onError: (error: unknown) => {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object"
          ? (error.response.data as { message?: string }).message ||
            "Failed to create position"
          : error instanceof Error
            ? error.message
            : "Failed to create position";
      toast.error("Error", { description: message });
    },
  });
}

/**
 * Update existing position
 */
export function useUpdatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PositionInput> }) =>
      positionApi.update(id, data),
    onSuccess: (updatedPosition, variables) => {
      // Update cached data
      queryClient.setQueryData(
        positionKeys.detail(variables.id),
        updatedPosition
      );

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: positionKeys.lists() });
      
      // Invalidate department positions
      if (updatedPosition.department_id) {
        queryClient.invalidateQueries({ 
          queryKey: positionKeys.byDepartment(updatedPosition.department_id) 
        });
      }

      toast.success('Position updated successfully', {
        description: `${updatedPosition.name} has been updated.`,
      });
    },
    onError: (error: unknown) => {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object"
          ? (error.response.data as { message?: string }).message ||
            "Failed to update position"
          : error instanceof Error
            ? error.message
            : "Failed to update position";
      toast.error("Error", { description: message });
    },
  });
}

/**
 * Delete position (soft delete)
 */
export function useDeletePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => positionApi.delete(id),
    onSuccess: (_, positionId) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: positionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: positionKeys.detail(positionId) });

      toast.success('Position deleted successfully', {
        description: 'The position has been moved to trash.',
      });
    },
    onError: (error: unknown) => {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object"
          ? (error.response.data as { message?: string }).message ||
            "Failed to delete position"
          : error instanceof Error
            ? error.message
            : "Failed to delete position";
      toast.error("Error", { description: message });
    },
  });
}

/**
 * Restore soft deleted position
 */
export function useRestorePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => positionApi.restore(id),
    onSuccess: (restoredPosition) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: positionKeys.lists() });

      toast.success('Position restored successfully', {
        description: `${restoredPosition.name} has been restored.`,
      });
    },
    onError: (error: unknown) => {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object"
          ? (error.response.data as { message?: string }).message ||
            "Failed to restore position"
          : error instanceof Error
            ? error.message
            : "Failed to restore position";
      toast.error("Error", { description: message });
    },
  });
}

// ============================================================================
// Optimistic Update Helpers
// ============================================================================

/**
 * Update position with optimistic update
 */
export function useOptimisticUpdatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PositionInput> }) =>
      positionApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: positionKeys.detail(id) });

      // Snapshot previous value
      const previousPosition = queryClient.getQueryData<Position>(
        positionKeys.detail(id)
      );

      // Optimistically update
      if (previousPosition) {
        queryClient.setQueryData<Position>(positionKeys.detail(id), {
          ...previousPosition,
          ...data,
        } as Position);
      }

      return { previousPosition };
    },
    onError: (error: unknown, variables, context) => {
      // Rollback on error
      if (context?.previousPosition) {
        queryClient.setQueryData(
          positionKeys.detail(variables.id),
          context.previousPosition
        );
      }

      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object"
          ? (error.response.data as { message?: string }).message ||
            "Failed to update position"
          : error instanceof Error
            ? error.message
            : "Failed to update position";
      toast.error("Error", { description: message });
    },
    onSuccess: (updatedPosition) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: positionKeys.lists() });
      
      if (updatedPosition.department_id) {
        queryClient.invalidateQueries({ 
          queryKey: positionKeys.byDepartment(updatedPosition.department_id) 
        });
      }

      toast.success('Position updated successfully');
    },
  });
}
