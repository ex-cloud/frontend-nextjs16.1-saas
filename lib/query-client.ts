/**
 * React Query Configuration
 * 
 * Optimized settings for better performance and user experience
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { toast } from 'sonner'

export const queryConfig = {
  defaultOptions: {
    queries: {
      // Stale time: Data considered fresh for 30 seconds
      staleTime: 30 * 1000,
      
      // Cache time: Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      
      // Retry failed requests
      retry: 1,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for important data
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Network mode
      networkMode: 'online' as const,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      networkMode: 'online' as const,
    },
  },
}

export function createQueryClient() {
  return new QueryClient({
    ...queryConfig,
    queryCache: new QueryCache({
      onError: (error: unknown) => {
        // Global error handling
        let message = "Something went wrong";
        if (
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "data" in error.response &&
          error.response.data &&
          typeof error.response.data === "object"
        ) {
          const data = error.response.data as { message?: string };
          message = data.message || message;
        } else if (error instanceof Error) {
          message = error.message;
        }
        console.error("Query error:", message);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error: unknown) => {
        // Global mutation error handling
        let message = "Failed to perform action";
        if (
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "data" in error.response &&
          error.response.data &&
          typeof error.response.data === "object"
        ) {
          const data = error.response.data as { message?: string };
          message = data.message || message;
        } else if (error instanceof Error) {
          message = error.message;
        }
        toast.error(message);
      },
    }),
  })
}

// Singleton instance for app
let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return createQueryClient()
  } else {
    // Browser: reuse existing client
    if (!browserQueryClient) {
      browserQueryClient = createQueryClient()
    }
    return browserQueryClient
  }
}
