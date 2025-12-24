/**
 * HRM Assignment API Service
 * 
 * Handles user assignment to departments and positions
 * Synced with: UserAssignmentController.php
 * 
 * @see lara12-rest-api/app/Http/Controllers/Api/V1/HRM/UserAssignmentController.php
 */

import apiClient from './client';
import type { User, SuccessResponse } from '@/types/hrm';

const BASE_PATH = '/hrm/users';

export interface AssignUserInput {
  department_id: number;
  position_id?: number;
  employee_number?: string;
  effective_date?: string;
  reason?: string;
}

export interface BulkAssignInput {
  user_ids: number[];
  department_id: number;
  position_id?: number;
  effective_date?: string;
  reason?: string;
}

export interface TransferInput {
  new_department_id: number;
  new_position_id?: number;
  effective_date?: string;
  reason?: string;
}

export interface PromoteInput {
  new_position_id: number;
  effective_date?: string;
  reason?: string;
}

export interface UnassignInput {
  end_date?: string;
  reason?: string;
}

/**
 * HRM Assignment API endpoints
 */
export const hrmAssignmentApi = {
  /**
   * Assign user to department/position
   * POST /api/v1/hrm/users/{userId}/assign
   */
  assign: async (userId: number, data: AssignUserInput) => {
    const response = await apiClient.post<SuccessResponse>(
      `${BASE_PATH}/${userId}/assign`,
      data
    );
    return response.data;
  },

  /**
   * Bulk assign users to department
   * POST /api/v1/hrm/users/bulk-assign
   */
  bulkAssign: async (data: BulkAssignInput) => {
    const response = await apiClient.post<SuccessResponse>(
      `${BASE_PATH}/bulk-assign`,
      data
    );
    return response.data;
  },

  /**
   * Unassign user from department
   * POST /api/v1/hrm/users/{userId}/unassign
   */
  unassign: async (userId: number, data?: UnassignInput) => {
    const response = await apiClient.post<SuccessResponse>(
      `${BASE_PATH}/${userId}/unassign`,
      data || {}
    );
    return response.data;
  },

  /**
   * Transfer user to another department
   * POST /api/v1/hrm/users/{userId}/transfer
   */
  transfer: async (userId: number, data: TransferInput) => {
    const response = await apiClient.post<SuccessResponse>(
      `${BASE_PATH}/${userId}/transfer`,
      data
    );
    return response.data;
  },

  /**
   * Promote user to new position
   * POST /api/v1/hrm/users/{userId}/promote
   */
  promote: async (userId: number, data: PromoteInput) => {
    const response = await apiClient.post<SuccessResponse>(
      `${BASE_PATH}/${userId}/promote`,
      data
    );
    return response.data;
  },

  /**
   * Get user assignment history
   * GET /api/v1/hrm/users/{userId}/assignment-history
   */
  getHistory: async (userId: number) => {
    const response = await apiClient.get(`${BASE_PATH}/${userId}/assignment-history`);
    return response.data;
  },

  /**
   * Get user current assignment
   * GET /api/v1/hrm/users/{userId}/current-assignment
   */
  getCurrentAssignment: async (userId: number) => {
    const response = await apiClient.get(`${BASE_PATH}/${userId}/current-assignment`);
    return response.data;
  },
};

/**
 * Get available users (not assigned to any department or available for reassignment)
 * This uses the general users endpoint with filters
 */
export const getAvailableUsers = async (excludeDepartmentId?: number) => {
  const params = new URLSearchParams();
  if (excludeDepartmentId) {
    params.append('filter[exclude_department]', excludeDepartmentId.toString());
  }
  params.append('per_page', '100');
  
  const response = await apiClient.get<{ data: User[] }>(`/users?${params.toString()}`);
  return response.data.data;
};

/**
 * Get all users for assignment selection
 */
export const getAllUsersForAssignment = async () => {
  const params = new URLSearchParams();
  params.append('per_page', '100');
  
  const response = await apiClient.get<{ data: User[] }>(`/users?${params.toString()}`);
  return response.data.data;
};

export default hrmAssignmentApi;
