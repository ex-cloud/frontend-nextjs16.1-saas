import { useSession } from "next-auth/react";
import { useMemo } from "react";

/**
 * Hook to check user permissions
 *
 * @returns Object with permission checking methods
 */
export function usePermissions() {
  const { data: session } = useSession();

  const permissions = useMemo(() => {
    // Extract permissions from session
    // Assuming session.user has a permissions array
    return session?.user?.permissions || [];
  }, [session]);

  const roles = useMemo(() => {
    return session?.user?.roles || [];
  }, [session]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    // Super Admin has all permissions
    if (roles.includes("Super Admin")) return true;

    // Check if user has the specific permission
    return permissions.includes(permission);
  };

  /**
   * Check if user has any of the given permissions
   */
  const hasAnyPermission = (permissionList: string[]): boolean => {
    // Super Admin has all permissions
    if (roles.includes("Super Admin")) return true;

    // Check if user has at least one of the permissions
    return permissionList.some((permission) =>
      permissions.includes(permission)
    );
  };

  /**
   * Check if user has all of the given permissions
   */
  const hasAllPermissions = (permissionList: string[]): boolean => {
    // Super Admin has all permissions
    if (roles.includes("Super Admin")) return true;

    // Check if user has all permissions
    return permissionList.every((permission) =>
      permissions.includes(permission)
    );
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  /**
   * Check if user has any of the given roles
   */
  const hasAnyRole = (roleList: string[]): boolean => {
    return roleList.some((role) => roles.includes(role));
  };

  /**
   * Check if user is Super Admin
   */
  const isSuperAdmin = (): boolean => {
    return roles.includes("Super Admin");
  };

  return {
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
  };
}

/**
 * Higher-order component to conditionally render based on permissions
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: string | string[]
): React.FC<P> {
  const PermissionComponent = (props: P) => {
    const { hasPermission, hasAnyPermission } = usePermissions();

    const isAuthorized = Array.isArray(requiredPermission)
      ? hasAnyPermission(requiredPermission)
      : hasPermission(requiredPermission);

    if (!isAuthorized) {
      return null;
    }

    return <Component {...props} />;
  };

  const componentName = Component.displayName || Component.name || "Component";
  PermissionComponent.displayName = `withPermission(${componentName})`;

  return PermissionComponent;
}

/**
 * Component to conditionally render children based on permissions
 */
interface PermissionGateProps {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
  requireAll = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermissions();

  let isAuthorized = false;

  if (Array.isArray(permission)) {
    isAuthorized = requireAll
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission);
  } else {
    isAuthorized = hasPermission(permission);
  }

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
