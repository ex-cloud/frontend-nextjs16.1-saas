import apiClient from './client';

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Authentication API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
    return apiClient.post('/auth/login', credentials);
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<ApiResponse<LoginResponse>> => {
    return apiClient.post('/auth/register', data);
  },

  logout: async (): Promise<ApiResponse> => {
    return apiClient.post('/auth/logout');
  },

  me: async (): Promise<ApiResponse<User>> => {
    return apiClient.get('/auth/me');
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    return apiClient.put('/auth/profile', data);
  },
};

// Health Check API
export const healthApi = {
  check: async (): Promise<ApiResponse> => {
    return apiClient.get('/health');
  },
};

// Users API
export const usersApi = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    role?: string;
  }): Promise<PaginatedResponse<User>> => {
    return apiClient.get('/users', { params });
  },

  getById: async (id: number): Promise<ApiResponse<User>> => {
    return apiClient.get(`/users/${id}`);
  },

  create: async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role?: string;
  }): Promise<ApiResponse<User>> => {
    return apiClient.post('/users', data);
  },

  update: async (id: number, data: Partial<User>): Promise<ApiResponse<User>> => {
    return apiClient.put(`/users/${id}`, data);
  },

  delete: async (id: number): Promise<ApiResponse> => {
    return apiClient.delete(`/users/${id}`);
  },
};

// Export all
const api = {
  auth: authApi,
  health: healthApi,
  users: usersApi,
};

export default api;
