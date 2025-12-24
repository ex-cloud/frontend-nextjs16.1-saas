import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken } from '@/lib/auth';

const API_VERSION = 'v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 seconds - reduced from 30s for better UX
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get token from NextAuth session
    const token = await getAccessToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

interface ApiErrorData {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return full response for access to headers, status, etc
    return response;
  },
  (error: AxiosError<ApiErrorData>) => {
    // Handle errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      
      if (error.response.status === 401) {
        // Unauthorized - NextAuth will handle redirect
        console.error('Unauthorized: Please log in again');
      }
      
      if (error.response.status === 403) {
        // Check if this is an inactive account error
        const errorData = error.response.data;
        
        if (errorData?.error === 'Account Inactive') {
          // Account has been deactivated - force logout
          console.error('Account Inactive:', errorData.message);
          
          // Clear local storage and cookies
          if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirect to login with error message
            const errorMessage = encodeURIComponent(errorData.message || 'Your account has been deactivated');
            window.location.href = `/login?error=${errorMessage}&reason=account_inactive`;
          }
          
          // Don't proceed with normal error handling
          return Promise.reject(new Error('Account Inactive'));
        }
        
        // Forbidden - user doesn't have permission (other 403 cases)
        console.error('Forbidden: You do not have permission to access this resource');
      }
      
      if (error.response.status === 422) {
        // Validation error
        console.error('Validation error:', error.response.data);
      }
      
      if (error.response.status === 429) {
        // Rate limiting
        console.error('Too many requests. Please try again later.');
      }
      
      if (error.response.status >= 500) {
        // Server error
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Generic API methods with type safety
export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(url, config),

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    apiClient.post<T>(url, data, config),

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    apiClient.put<T>(url, data, config),

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    apiClient.patch<T>(url, data, config),

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(url, config),
};

export default apiClient;
