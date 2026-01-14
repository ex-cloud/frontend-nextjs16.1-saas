import { getSession } from "next-auth/react";

/**
 * Get the current access token from NextAuth session
 * This should be used in client components
 */
let sessionPromise: Promise<string | null> | null = null;

export async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  if (sessionPromise) return sessionPromise;

  sessionPromise = (async () => {
    try {
      const session = await getSession();
      return session?.user?.accessToken || null;
    } finally {
      // Clear promise after a short delay to allow fresh checks later
      // but deduplicate parallel bursts
      setTimeout(() => {
        sessionPromise = null;
      }, 500);
    }
  })();

  return sessionPromise;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}
