"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoles } from "@/lib/hooks/use-roles";
import { useUser, useUpdateUser } from "@/lib/hooks/use-users";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AssignedRolesCard } from "./roles/assigned-roles-card";
import { EffectivePermissionsCard } from "./roles/effective-permissions-card";
import { useUserPage } from "@/components/users/user-page-context";

interface RolesPermissionsTabProps {
  userId: string;
}

export function RolesPermissionsTab({ userId }: RolesPermissionsTabProps) {
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useUser(userId);
  const {
    data: rolesData,
    isLoading: rolesLoading,
    error: rolesError,
  } = useRoles();
  const { mutateAsync: updateRoles } = useUpdateUser();

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Extract user's current role names
  const userRoleNames = useMemo(() => {
    return user?.roles?.map((role) => role.name) || [];
  }, [user]);

  // Initialize selected roles when user data loads
  const isInitialized = useRef(false);

  useLayoutEffect(() => {
    if (userRoleNames.length > 0 && !isInitialized.current) {
      // eslint-disable-next-line
      setSelectedRoles(userRoleNames);
      isInitialized.current = true;
    } else if (user && !isInitialized.current && userRoleNames.length === 0) {
      // User loaded but has no roles, just mark initialized
      isInitialized.current = true;
    }
  }, [userRoleNames, user]);

  // Get all available roles
  const availableRoles = rolesData?.data || [];

  // Get current user roles with permissions for effective permissions display
  const currentUserRoles = useMemo(() => {
    return user?.roles || [];
  }, [user?.roles]);

  const handleRoleToggle = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((name) => name !== roleName)
        : [...prev, roleName]
    );
  };

  const handleSelectAllRoles = () => {
    setSelectedRoles(availableRoles.map((role) => role.name));
  };

  const handleUnselectAllRoles = () => {
    setSelectedRoles([]);
  };

  const handleSaveRoles = useCallback(async () => {
    try {
      await updateRoles({
        id: userId,
        data: {
          roles: selectedRoles,
        },
      });

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });

      toast.success("Roles updated successfully");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update roles";
      toast.error(message);
    }
  }, [selectedRoles, updateRoles, userId, queryClient]);

  // Check if roles have changed
  const hasChanges = useMemo(() => {
    const currentSorted = [...userRoleNames].sort();
    const selectedSorted = [...selectedRoles].sort();
    return JSON.stringify(currentSorted) !== JSON.stringify(selectedSorted);
  }, [userRoleNames, selectedRoles]);

  const { setIsDirty, registerSaveHandler } = useUserPage();

  // Sync isDirty
  useEffect(() => {
    setIsDirty(hasChanges);
  }, [hasChanges, setIsDirty]);

  // Register save handler
  useEffect(() => {
    registerSaveHandler(handleSaveRoles);
  }, [registerSaveHandler, handleSaveRoles]);

  // Loading state
  if (userLoading || rolesLoading) {
    return (
      <div className="space-y-6 px-4 pb-4">
        <Card className="shadow-none rounded-md">
          <CardContent className="p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full max-w-sm" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-28" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none rounded-md">
          <CardContent className="p-6">
            <Skeleton className="h-8 w-56 mb-4" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (rolesError) {
    return (
      <Card className="shadow-none mx-4 rounded-md">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Failed to load roles</p>
                <p className="text-sm text-muted-foreground">
                  {rolesError instanceof Error
                    ? rolesError.message
                    : "Unable to connect to server. Please check if the backend server is running."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["roles"] });
                window.location.reload();
              }}
            >
              <Loader2 className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Assigned Roles Card */}
      <AssignedRolesCard
        availableRoles={availableRoles}
        selectedRoles={selectedRoles}
        onRoleToggle={handleRoleToggle}
        onSelectAll={handleSelectAllRoles}
        onUnselectAll={handleUnselectAllRoles}
      />

      {/* Effective Permissions Card */}
      <EffectivePermissionsCard userRoles={currentUserRoles} />
    </div>
  );
}
