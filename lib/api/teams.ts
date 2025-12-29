/**
 * Team API Service
 *
 * Handles all team-related API calls
 * Synced with: TeamController.php & TeamMemberController.php
 *
 * @see lara12-rest-api/app/Http/Controllers/Api/V1/Team/TeamController.php
 * @see lara12-rest-api/app/Http/Controllers/Api/V1/Team/TeamMemberController.php
 */

import apiClient from "./client";
import type {
  Team,
  TeamInput,
  TeamFilters,
  TeamRole,
  TeamMember,
  TeamMemberInput,
  PaginatedResponse,
  SingleResponse,
  SuccessResponse,
} from "@/types/hrm";

const BASE_PATH = "/hrm/teams";

/**
 * Team API endpoints
 */
export const teamApi = {
  /**
   * Get paginated list of teams
   * GET /api/v1/teams
   */
  list: async (filters?: TeamFilters) => {
    const params = new URLSearchParams();

    if (filters?.search) {
      params.append("filter[search]", filters.search);
    }
    if (filters?.team_type) {
      params.append("filter[team_type]", filters.team_type);
    }
    if (filters?.status) {
      params.append("filter[status]", filters.status);
    }
    if (filters?.department_id) {
      params.append("filter[department_id]", filters.department_id.toString());
    }
    if (filters?.team_lead_id) {
      params.append("filter[team_lead_id]", filters.team_lead_id.toString());
    }
    if (filters?.page) {
      params.append("page", filters.page.toString());
    }
    if (filters?.per_page) {
      params.append("per_page", filters.per_page.toString());
    }
    if (filters?.sort_by) {
      const order = filters.sort_order || "asc";
      params.append("sort", `${order === "desc" ? "-" : ""}${filters.sort_by}`);
    }

    // Include relationships
    params.append("include", "teamLead,department");

    const response = await apiClient.get<PaginatedResponse<Team>>(
      `${BASE_PATH}?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get single team by ID
   * GET /api/v1/teams/{id}
   */
  get: async (id: number) => {
    const response = await apiClient.get<SingleResponse<Team>>(
      `${BASE_PATH}/${id}?include=teamLead,department`
    );
    return response.data.data;
  },

  /**
   * Create new team
   * POST /api/v1/teams
   */
  create: async (data: TeamInput) => {
    const response = await apiClient.post<SingleResponse<Team>>(
      BASE_PATH,
      data
    );
    return response.data.data;
  },

  /**
   * Update existing team
   * PUT /api/v1/teams/{id}
   */
  update: async (id: number, data: Partial<TeamInput>) => {
    const response = await apiClient.put<SingleResponse<Team>>(
      `${BASE_PATH}/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Soft delete team
   * DELETE /api/v1/teams/{id}
   */
  delete: async (id: number) => {
    const response = await apiClient.delete<SuccessResponse>(
      `${BASE_PATH}/${id}`
    );
    return response.data;
  },

  /**
   * Restore soft deleted team
   * POST /api/v1/teams/{id}/restore
   */
  restore: async (id: number) => {
    const response = await apiClient.post<SingleResponse<Team>>(
      `${BASE_PATH}/${id}/restore`
    );
    return response.data.data;
  },

  /**
   * Get teams by department
   * GET /api/v1/teams/by-department/{departmentId}
   */
  getByDepartment: async (departmentId: number, page = 1, perPage = 15) => {
    const response = await apiClient.get<PaginatedResponse<Team>>(
      `${BASE_PATH}/by-department/${departmentId}?page=${page}&per_page=${perPage}&include=teamLead,department`
    );
    return response.data;
  },

  /**
   * Get teams by type
   * GET /api/v1/teams/by-type/{type}
   */
  getByType: async (type: string, page = 1, perPage = 15) => {
    const response = await apiClient.get<PaginatedResponse<Team>>(
      `${BASE_PATH}/by-type/${type}?page=${page}&per_page=${perPage}&include=teamLead,department`
    );
    return response.data;
  },

  // ========================================================================
  // Team Members Endpoints
  // ========================================================================

  /**
   * Get team members
   * GET /api/v1/teams/{teamId}/members
   */
  getMembers: async (
    teamId: number,
    activeOnly = false,
    page = 1,
    perPage = 15
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (activeOnly) {
      params.append("active_only", "1");
    }

    const response = await apiClient.get<PaginatedResponse<TeamMember>>(
      `${BASE_PATH}/${teamId}/members?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Add member to team
   * POST /api/v1/teams/{teamId}/members
   */
  addMember: async (teamId: number, data: TeamMemberInput) => {
    const response = await apiClient.post<SingleResponse<TeamMember>>(
      `${BASE_PATH}/${teamId}/members`,
      data
    );
    return response.data.data;
  },

  /**
   * Update team member role
   * PUT /api/v1/teams/{teamId}/members/{userId}
   */
  updateMember: async (
    teamId: number,
    userId: number,
    data: { role_in_team?: string; team_role_id?: number }
  ) => {
    const response = await apiClient.put<SingleResponse<TeamMember>>(
      `${BASE_PATH}/${teamId}/members/${userId}`,
      data
    );
    return response.data.data;
  },

  /**
   * Remove member from team
   * DELETE /api/v1/teams/{teamId}/members/{userId}
   */
  removeMember: async (teamId: number, userId: number) => {
    const response = await apiClient.delete<SuccessResponse>(
      `${BASE_PATH}/${teamId}/members/${userId}`
    );
    return response.data;
  },

  /**
   * Get team roles
   * GET /api/v1/team-roles
   */
  getRoles: async (params?: { type?: string }) => {
    const response = await apiClient.get<{ data: TeamRole[] }>(
      "/hrm/team-roles",
      { params }
    );
    return response.data.data;
  },
};

/**
 * Export default for convenient import
 */
export default teamApi;
