/**
 * Department API Service
 * 
 * Handles all department-related API calls
 * Synced with: DepartmentController.php
 * 
 * @see lara12-rest-api/app/Http/Controllers/Api/V1/Department/DepartmentController.php
 */

import apiClient from './client';
import type {
  Department,
  DepartmentInput,
  DepartmentFilters,
  DepartmentTreeNode,
  User,
  Position,
  Team,
  PaginatedResponse,
  SingleResponse,
  SuccessResponse,
} from '@/types/hrm';

const BASE_PATH = '/hrm/departments';

/**
 * Department API endpoints
 */
export const departmentApi = {
  /**
   * Get paginated list of departments
   * GET /api/v1/departments
   */
  list: async (filters?: DepartmentFilters) => {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('filter[search]', filters.search);
    }
    if (filters?.is_active !== undefined) {
      params.append('filter[is_active]', filters.is_active ? '1' : '0');
    }
    if (filters?.has_manager !== undefined) {
      params.append('filter[has_manager]', filters.has_manager ? '1' : '0');
    }
    if (filters?.parent_id) {
      params.append('filter[parent_id]', filters.parent_id.toString());
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.per_page) {
      params.append('per_page', filters.per_page.toString());
    }
    if (filters?.sort_by) {
      const order = filters.sort_order || 'asc';
      params.append('sort', `${order === 'desc' ? '-' : ''}${filters.sort_by}`);
    }
    
    // Include relationships
    params.append('include', 'manager,parent');
    
    const response = await apiClient.get<PaginatedResponse<Department>>(
      `${BASE_PATH}?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get single department by ID
   * GET /api/v1/departments/{id}
   */
  get: async (id: number) => {
    const response = await apiClient.get<SingleResponse<Department>>(
      `${BASE_PATH}/${id}?include=manager,parent`
    );
    return response.data.data;
  },

  /**
   * Create new department
   * POST /api/v1/departments
   */
  create: async (data: DepartmentInput) => {
    const response = await apiClient.post<SingleResponse<Department>>(
      BASE_PATH,
      data
    );
    return response.data.data;
  },

  /**
   * Update existing department
   * PUT /api/v1/departments/{id}
   */
  update: async (id: number, data: Partial<DepartmentInput>) => {
    const response = await apiClient.put<SingleResponse<Department>>(
      `${BASE_PATH}/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Soft delete department
   * DELETE /api/v1/departments/{id}
   */
  delete: async (id: number) => {
    const response = await apiClient.delete<SuccessResponse>(
      `${BASE_PATH}/${id}`
    );
    return response.data;
  },

  /**
   * Restore soft deleted department
   * POST /api/v1/departments/{id}/restore
   */
  restore: async (id: number) => {
    const response = await apiClient.post<SingleResponse<Department>>(
      `${BASE_PATH}/${id}/restore`
    );
    return response.data.data;
  },

  /**
   * Get department hierarchy tree
   * GET /api/v1/departments/tree
   */
  getTree: async () => {
    const response = await apiClient.get<SingleResponse<DepartmentTreeNode[]>>(
      `${BASE_PATH}/tree`
    );
    return response.data.data;
  },

  /**
   * Get users in a department
   * GET /api/v1/departments/{id}/users
   */
  getUsers: async (id: number, page = 1, perPage = 15) => {
    const response = await apiClient.get<PaginatedResponse<User>>(
      `${BASE_PATH}/${id}/users?page=${page}&per_page=${perPage}`
    );
    return response.data;
  },

  /**
   * Get teams in a department
   * GET /api/v1/departments/{id}/teams
   */
  getTeams: async (id: number, page = 1, perPage = 15) => {
    const response = await apiClient.get<PaginatedResponse<Team>>(
      `${BASE_PATH}/${id}/teams?page=${page}&per_page=${perPage}`
    );
    return response.data;
  },

  /**
   * Get positions in a department
   * GET /api/v1/departments/{id}/positions
   */
  getPositions: async (id: number, page = 1, perPage = 15) => {
    const response = await apiClient.get<PaginatedResponse<Position>>(
      `${BASE_PATH}/${id}/positions?page=${page}&per_page=${perPage}`
    );
    return response.data;
  },
};

/**
 * Export default for convenient import
 */
export default departmentApi;
