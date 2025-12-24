/**
 * Department React Query Hooks
 * 
 * Custom hooks for department data fetching and mutations
 * Uses React Query for caching, refetching, and optimistic updates
 * 
 * @see panel-admin/lib/api/departments.ts
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { departmentApi } from '@/lib/api/departments';
import type {
  Department,
  DepartmentInput,
  DepartmentFilters,
  DepartmentTreeNode,
  PaginatedResponse,
  User,
  Team,
  Position,
} from '@/types/hrm';
import { toast } from 'sonner';

// ============================================================================
// Query Keys
// ============================================================================

export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: (filters?: DepartmentFilters) => [...departmentKeys.lists(), filters] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...departmentKeys.details(), id] as const,
  tree: () => [...departmentKeys.all, 'tree'] as const,
  users: (id: number) => [...departmentKeys.detail(id), 'users'] as const,
  teams: (id: number) => [...departmentKeys.detail(id), 'teams'] as const,
  positions: (id: number) => [...departmentKeys.detail(id), 'positions'] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch paginated list of departments
 */
export function useDepartments(
  filters?: DepartmentFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<Department>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: departmentKeys.list(filters),
    queryFn: () => departmentApi.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Fetch single department by ID
 */
export function useDepartment(
  id: number,
  options?: Omit<UseQueryOptions<Department>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => departmentApi.get(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
    ...options,
  });
}

/**
 * Fetch department hierarchy tree
 */
export function useDepartmentTree(
  options?: Omit<UseQueryOptions<DepartmentTreeNode[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: departmentKeys.tree(),
    queryFn: () => departmentApi.getTree(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Fetch users in a department
 */
export function useDepartmentUsers(
  departmentId: number,
  page = 1,
  perPage = 15,
  options?: Omit<UseQueryOptions<PaginatedResponse<User>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...departmentKeys.users(departmentId), page, perPage],
    queryFn: () => departmentApi.getUsers(departmentId, page, perPage),
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Fetch teams in a department
 */
export function useDepartmentTeams(
  departmentId: number,
  page = 1,
  perPage = 15,
  options?: Omit<UseQueryOptions<PaginatedResponse<Team>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...departmentKeys.teams(departmentId), page, perPage],
    queryFn: () => departmentApi.getTeams(departmentId, page, perPage),
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Fetch positions in a department
 */
export function useDepartmentPositions(
  departmentId: number,
  page = 1,
  perPage = 15,
  options?: Omit<UseQueryOptions<PaginatedResponse<Position>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...departmentKeys.positions(departmentId), page, perPage],
    queryFn: () => departmentApi.getPositions(departmentId, page, perPage),
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create new department
 */
export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DepartmentInput) => departmentApi.create(data),
    onSuccess: (newDepartment) => {
      // Invalidate and refetch department lists
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.tree() });

      toast.success('Department created successfully', {
        description: `${newDepartment.name} has been created.`,
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
            "Failed to create department"
          : error instanceof Error
            ? error.message
            : "Failed to create department";
      toast.error("Error", { description: message });
    },
  });
}

/**
 * Update existing department
 */
export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DepartmentInput> }) =>
      departmentApi.update(id, data),
    onSuccess: (updatedDepartment, variables) => {
      // Update cached data
      queryClient.setQueryData(
        departmentKeys.detail(variables.id),
        updatedDepartment
      );

      // Invalidate lists and tree
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.tree() });

      toast.success('Department updated successfully', {
        description: `${updatedDepartment.name} has been updated.`,
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
            "Failed to update department"
          : error instanceof Error
            ? error.message
            : "Failed to update department";
      toast.error("Error", { description: message });
    },
  });
}

/**
 * Delete department (soft delete)
 */
export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => departmentApi.delete(id),
    onSuccess: (_, departmentId) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.tree() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(departmentId) });

      toast.success('Department deleted successfully', {
        description: 'The department has been moved to trash.',
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
            "Failed to delete department"
          : error instanceof Error
            ? error.message
            : "Failed to delete department";
      toast.error("Error", { description: message });
    },
  });
}

/**
 * Restore soft deleted department
 */
export function useRestoreDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => departmentApi.restore(id),
    onSuccess: (restoredDepartment) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.tree() });

      toast.success('Department restored successfully', {
        description: `${restoredDepartment.name} has been restored.`,
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
            "Failed to restore department"
          : error instanceof Error
            ? error.message
            : "Failed to restore department";
      toast.error("Error", { description: message });
    },
  });
}

// ============================================================================
// Optimistic Update Helpers
// ============================================================================

/**
 * Update department with optimistic update
 */
export function useOptimisticUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DepartmentInput> }) =>
      departmentApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: departmentKeys.detail(id) });

      // Snapshot previous value
      const previousDepartment = queryClient.getQueryData<Department>(
        departmentKeys.detail(id)
      );

      // Optimistically update
      if (previousDepartment) {
        queryClient.setQueryData<Department>(departmentKeys.detail(id), {
          ...previousDepartment,
          ...data,
        } as Department);
      }

      return { previousDepartment };
    },
    onError: (error: unknown, variables, context) => {
      // Rollback on error
      if (context?.previousDepartment) {
        queryClient.setQueryData(
          departmentKeys.detail(variables.id),
          context.previousDepartment
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
            "Failed to update department"
          : error instanceof Error
            ? error.message
            : "Failed to update department";
      toast.error("Error", { description: message });
    },
    onSuccess: () => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.tree() });

      toast.success('Department updated successfully');
    },
  });
}
