"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles = [],
  requireAuth = true,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Jika require auth dan tidak ada session, redirect ke login
    if (requireAuth && status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Jika ada allowedRoles, cek apakah user punya role yang diizinkan
    if (allowedRoles.length > 0 && session?.user?.roles) {
      const userRoles = session.user.roles;
      const hasAllowedRole = allowedRoles.some((role) =>
        userRoles.includes(role)
      );

      if (!hasAllowedRole) {
        // Redirect ke dashboard jika tidak punya akses
        router.push("/dashboard");
        return;
      }
    }
  }, [session, status, requireAuth, allowedRoles, router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Jika tidak authenticated dan require auth
  if (requireAuth && !session) {
    return null;
  }

  // Jika ada allowedRoles dan user tidak punya role yang sesuai
  if (allowedRoles.length > 0 && session?.user?.roles) {
    const userRoles = session.user.roles;
    const hasAllowedRole = allowedRoles.some((role) =>
      userRoles.includes(role)
    );

    if (!hasAllowedRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You don&apos;t have permission to access this page
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
