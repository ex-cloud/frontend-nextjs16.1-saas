/**
 * Team React Query Hooks
 * 
 * Custom hooks for team and team member data fetching and mutations
 * Uses React Query for caching, refetching, and optimistic updates
 * 
 * @see panel-admin/lib/api/teams.ts
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { teamApi } from '@/lib/api/teams';
import type {
  Team,
  TeamInput,
  TeamFilters,
  TeamMember,
  TeamMemberInput,
  PaginatedResponse,
} from '@/types/hrm';
import { toast } from 'sonner';

// ============================================================================
// Query Keys
// ============================================================================

export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  list: (filters?: TeamFilters) => [...teamKeys.lists(), filters] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: number) => [...teamKeys.details(), id] as const,
  byDepartment: (departmentId: number) => [...teamKeys.all, 'by-department', departmentId] as const,
  byType: (type: string) => [...teamKeys.all, 'by-type', type] as const,
  members: (teamId: number) => [...teamKeys.detail(teamId), 'members'] as const,
};

// ============================================================================
// Query Hooks - Teams
// ============================================================================

/**
 * Fetch paginated list of teams
 */
export function useTeams(
  filters?: TeamFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<Team>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: teamKeys.list(filters),
    queryFn: () => teamApi.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Fetch single team by ID
 */
export function useTeam(
  id: number,
  options?: Omit<UseQueryOptions<Team>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => teamApi.get(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
    ...options,
  });
}

/**
 * Fetch teams by department
 */
export function useTeamsByDepartment(
  departmentId: number,
  page = 1,
  perPage = 15,
  options?: Omit<UseQueryOptions<PaginatedResponse<Team>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...teamKeys.byDepartment(departmentId), page, perPage],
    queryFn: () => teamApi.getByDepartment(departmentId, page, perPage),
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Fetch teams by type
 */
export function useTeamsByType(
  type: string,
  page = 1,
  perPage = 15,
  options?: Omit<UseQueryOptions<PaginatedResponse<Team>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...teamKeys.byType(type), page, perPage],
    queryFn: () => teamApi.getByType(type, page, perPage),
    enabled: !!type,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// ============================================================================
// Query Hooks - Team Members
// ============================================================================

/**
 * Fetch team members
 */
export function useTeamMembers(
  teamId: number,
  activeOnly = true,
  page = 1,
  perPage = 15,
  options?: Omit<UseQueryOptions<PaginatedResponse<TeamMember>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...teamKeys.members(teamId), activeOnly, page, perPage],
    queryFn: () => teamApi.getMembers(teamId, activeOnly, page, perPage),
    enabled: !!teamId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
}

// ============================================================================
// Mutation Hooks - Teams
// ============================================================================

/**
 * Create new team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TeamInput) => teamApi.create(data),
    onSuccess: (newTeam) => {
      // Invalidate team lists
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      
      // Invalidate department teams if department is set
      if (newTeam.department_id) {
        queryClient.invalidateQueries({ 
          queryKey: teamKeys.byDepartment(newTeam.department_id) 
        });
      }
      
      // Invalidate team type lists
      queryClient.invalidateQueries({ 
        queryKey: teamKeys.byType(newTeam.team_type) 
      });

      toast.success('Team created successfully', {
        description: `${newTeam.name} has been created.`,
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
            "Failed to perform action"
          : error instanceof Error
            ? error.message
            : "Failed to perform action";
      toast.error("Error", { description: message });
    },
  });
}

/**
 * Update existing team
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TeamInput> }) =>
      teamApi.update(id, data),
    onSuccess: (updatedTeam, variables) => {
      // Update cached data
      queryClient.setQueryData(
        teamKeys.detail(variables.id),
        updatedTeam
      );

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      
      // Invalidate department teams
      if (updatedTeam.department_id) {
        queryClient.invalidateQueries({ 
          queryKey: teamKeys.byDepartment(updatedTeam.department_id) 
        });
      }
      
      // Invalidate team type lists
      queryClient.invalidateQueries({ 
        queryKey: teamKeys.byType(updatedTeam.team_type) 
      });

      toast.success('Team updated successfully', {
        description: `${updatedTeam.name} has been updated.`,
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
            "Failed to update team"
          : error instanceof Error
            ? error.message
            : "Failed to update team";
      toast.error("Error", { description: message });
    },
  });
}

/**
 * Delete team (soft delete)
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => teamApi.delete(id),
    onSuccess: (_, teamId) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });

      toast.success('Team deleted successfully', {
        description: 'The team has been moved to trash.',
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
            "Failed to delete team"
          : error instanceof Error
            ? error.message
            : "Failed to delete team";
      toast.error("Error", { description: message });
    },
  });
}

/**
 * Restore soft deleted team
 */
export function useRestoreTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => teamApi.restore(id),
    onSuccess: (restoredTeam) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });

      toast.success('Team restored successfully', {
        description: `${restoredTeam.name} has been restored.`,
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
            "Failed to restore team"
          : error instanceof Error
            ? error.message
            : "Failed to restore team";
      toast.error("Error", { description: message });
    },
  });
}

// ============================================================================
// Mutation Hooks - Team Members
// ============================================================================

/**
 * Add member to team
 */
export function useAddTeamMember(teamId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TeamMemberInput) => teamApi.addMember(teamId, data),
    onSuccess: () => {
      // Invalidate team members list
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId) });
      
      // Invalidate team detail (to update member count)
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });

      toast.success('Member added successfully', {
        description: 'The user has been added to the team.',
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
            "Failed to add team member"
          : error instanceof Error
            ? error.message
            : "Failed to add team member";
      toast.error("Error", { description: message });
    },
  });
}

/**
 * Update team member role
 */
export function useUpdateTeamMember(teamId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleInTeam }: { userId: number; roleInTeam: string }) =>
      teamApi.updateMember(teamId, userId, roleInTeam),
    onSuccess: () => {
      // Invalidate team members list
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId) });

      toast.success('Member role updated successfully');
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
            "Failed to update team member"
          : error instanceof Error
            ? error.message
            : "Failed to update team member";
      toast.error("Error", { description: message });
    },
  });
}

/**
 * Remove member from team
 */
export function useRemoveTeamMember(teamId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => teamApi.removeMember(teamId, userId),
    onSuccess: () => {
      // Invalidate team members list
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId) });
      
      // Invalidate team detail (to update member count)
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });

      toast.success('Member removed successfully', {
        description: 'The user has been removed from the team.',
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
            "Failed to remove team member"
          : error instanceof Error
            ? error.message
            : "Failed to remove team member";
      toast.error("Error", { description: message });
    },
  });
}

// ============================================================================
// Optimistic Update Helpers
// ============================================================================

/**
 * Update team with optimistic update
 */
export function useOptimisticUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TeamInput> }) =>
      teamApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: teamKeys.detail(id) });

      // Snapshot previous value
      const previousTeam = queryClient.getQueryData<Team>(
        teamKeys.detail(id)
      );

      // Optimistically update
      if (previousTeam) {
        queryClient.setQueryData<Team>(teamKeys.detail(id), {
          ...previousTeam,
          ...data,
        });
      }

      return { previousTeam };
    },
    onError: (error: unknown, variables, context) => {
      // Rollback on error
      if (context?.previousTeam) {
        queryClient.setQueryData(
          teamKeys.detail(variables.id),
          context.previousTeam
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
            "Failed to update team"
          : error instanceof Error
            ? error.message
            : "Failed to update team";
      toast.error("Error", { description: message });
    },
    onSuccess: (updatedTeam) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      
      if (updatedTeam.department_id) {
        queryClient.invalidateQueries({ 
          queryKey: teamKeys.byDepartment(updatedTeam.department_id) 
        });
      }

      toast.success('Team updated successfully');
    },
  });
}
