import { getSession } from 'next-auth/react';

/**
 * Get the current access token from NextAuth session
 * This should be used in client components
 */
export async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const session = await getSession();
  return session?.user?.accessToken || null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}
