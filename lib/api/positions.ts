/**
 * Position API Service
 * 
 * Handles all position-related API calls
 * Synced with: PositionController.php
 * 
 * @see lara12-rest-api/app/Http/Controllers/Api/V1/Position/PositionController.php
 */

import apiClient from './client';
import type {
  Position,
  PositionInput,
  PositionFilters,
  User,
  PaginatedResponse,
  SingleResponse,
  SuccessResponse,
} from '@/types/hrm';

const BASE_PATH = '/hrm/positions';

/**
 * Position API endpoints
 */
export const positionApi = {
  /**
   * Get paginated list of positions
   * GET /api/v1/positions
   */
  list: async (filters?: PositionFilters) => {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('filter[search]', filters.search);
    }
    if (filters?.is_active !== undefined) {
      params.append('filter[is_active]', filters.is_active ? '1' : '0');
    }
    if (filters?.department_id) {
      params.append('filter[department_id]', filters.department_id.toString());
    }
    if (filters?.level) {
      params.append('filter[level]', filters.level);
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
    params.append('include', 'department');
    
    const response = await apiClient.get<PaginatedResponse<Position>>(
      `${BASE_PATH}?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get single position by ID
   * GET /api/v1/positions/{id}
   */
  get: async (id: number) => {
    const response = await apiClient.get<SingleResponse<Position>>(
      `${BASE_PATH}/${id}?include=department`
    );
    return response.data.data;
  },

  /**
   * Create new position
   * POST /api/v1/positions
   */
  create: async (data: PositionInput) => {
    const response = await apiClient.post<SingleResponse<Position>>(
      BASE_PATH,
      data
    );
    return response.data.data;
  },

  /**
   * Update existing position
   * PUT /api/v1/positions/{id}
   */
  update: async (id: number, data: Partial<PositionInput>) => {
    const response = await apiClient.put<SingleResponse<Position>>(
      `${BASE_PATH}/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Soft delete position
   * DELETE /api/v1/positions/{id}
   */
  delete: async (id: number) => {
    const response = await apiClient.delete<SuccessResponse>(
      `${BASE_PATH}/${id}`
    );
    return response.data;
  },

  /**
   * Restore soft deleted position
   * POST /api/v1/positions/{id}/restore
   */
  restore: async (id: number) => {
    const response = await apiClient.post<SingleResponse<Position>>(
      `${BASE_PATH}/${id}/restore`
    );
    return response.data.data;
  },

  /**
   * Get positions by department
   * GET /api/v1/positions/by-department/{departmentId}
   */
  getByDepartment: async (departmentId: number, page = 1, perPage = 15) => {
    const response = await apiClient.get<PaginatedResponse<Position>>(
      `${BASE_PATH}/by-department/${departmentId}?page=${page}&per_page=${perPage}&include=department`
    );
    return response.data;
  },

  /**
   * Get users with this position
   * GET /api/v1/positions/{id}/users
   */
  getUsers: async (id: number, page = 1, perPage = 15) => {
    const response = await apiClient.get<PaginatedResponse<User>>(
      `${BASE_PATH}/${id}/users?page=${page}&per_page=${perPage}`
    );
    return response.data;
  },
};

/**
 * Export default for convenient import
 */
export default positionApi;
