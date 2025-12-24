"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoles } from "@/lib/hooks/use-roles";
import { usePermissionsByModule } from "@/lib/hooks/use-permissions";
import { useUser, useUpdateUser } from "@/lib/hooks/use-users";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
  const { data: permissionsByModule, isLoading: permissionsLoading } =
    usePermissionsByModule();
  const updateUserMutation = useUpdateUser();

  const [isSaving, setIsSaving] = useState(false);

  // Extract user's current role names
  const userRoleNames = useMemo(() => {
    return user?.roles?.map((role) => role.name) || [];
  }, [user]);

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Initialize selected roles when user data loads
  useMemo(() => {
    if (userRoleNames.length > 0) {
      setSelectedRoles(userRoleNames);
    }
  }, [userRoleNames]);

  // Get all available roles
  const availableRoles = rolesData?.data || [];

  // Get module names from permissions (grouped by module)
  const availableModules = useMemo(() => {
    if (!permissionsByModule) return [];
    return Object.keys(permissionsByModule).map((moduleName) => ({
      id: moduleName,
      label:
        moduleName.charAt(0).toUpperCase() +
        moduleName.slice(1).replace(/_/g, " "),
    }));
  }, [permissionsByModule]);

  // Calculate which modules are allowed based on user's roles
  const allowedModules = useMemo(() => {
    if (!user?.roles) return [];

    const modules = new Set<string>();
    user.roles.forEach((role) => {
      role.permissions?.forEach((permission) => {
        // Extract module from permission name (e.g., "view_users" -> "users")
        const parts = permission.name.split("_");
        if (parts.length > 1) {
          modules.add(parts.slice(1).join("_"));
        }
      });
    });

    return Array.from(modules);
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

  const handleSaveRoles = async () => {
    setIsSaving(true);
    try {
      await updateUserMutation.mutateAsync({
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
    } finally {
      setIsSaving(false);
    }
  };

  // Check if roles have changed
  const hasChanges = useMemo(() => {
    const currentSorted = [...userRoleNames].sort();
    const selectedSorted = [...selectedRoles].sort();
    return JSON.stringify(currentSorted) !== JSON.stringify(selectedSorted);
  }, [userRoleNames, selectedRoles]);

  // Loading state
  if (userLoading || rolesLoading || permissionsLoading) {
    return (
      <div className="space-y-6 px-4 pb-4">
        <Card className="shadow-none">
          <CardContent className="px-4 pb-4">
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="h-px w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (rolesError) {
    return (
      <Card className="shadow-none">
        <CardContent className="px-4 pb-4">
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
    <div className="space-y-6 px-4 pb-4">
      {/* Roles Section */}
      <Card className="shadow-none">
        <CardContent className="px-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Roles</h3>
              <Badge variant="secondary">
                {selectedRoles.length} of {availableRoles.length} selected
              </Badge>
            </div>

            <Separator />

            {/* Select/Unselect All Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllRoles}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnselectAllRoles}
              >
                Unselect All
              </Button>
            </div>

            {/* Roles Grid - 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableRoles.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoles.includes(role.name)}
                    onCheckedChange={() => handleRoleToggle(role.name)}
                  />
                  <Label
                    htmlFor={`role-${role.id}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {role.name}
                  </Label>
                  {role.permissions_count !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      {role.permissions_count}
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {availableRoles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No roles available
              </div>
            )}

            {/* Save Button */}
            {hasChanges && (
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveRoles}
                  disabled={isSaving || updateUserMutation.isPending}
                >
                  {isSaving || updateUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Roles"
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Allow Modules Section - Display Only (derived from roles) */}
      <Card className="shadow-none">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Allowed Modules</h3>
              <Badge variant="secondary">
                {allowedModules.length} modules via roles
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              These modules are available based on the permissions granted by
              the assigned roles.
            </p>

            <Separator />

            {/* Modules Grid - 4 columns (Read-only display) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableModules.map((module) => {
                const isAllowed = allowedModules.includes(module.id);
                return (
                  <div
                    key={module.id}
                    className={`flex items-center space-x-2 p-2 rounded ${
                      isAllowed ? "bg-primary/5" : "opacity-50"
                    }`}
                  >
                    <Checkbox
                      id={`module-${module.id}`}
                      checked={isAllowed}
                      disabled
                    />
                    <Label
                      htmlFor={`module-${module.id}`}
                      className="text-sm font-normal flex-1"
                    >
                      {module.label}
                    </Label>
                  </div>
                );
              })}
            </div>

            {availableModules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No modules available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permissions Details */}
      {user?.roles && user.roles.length > 0 && (
        <Card className="shadow-none">
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Permissions Details</h3>

              {user.roles.map((role) => (
                <div key={role.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge>{role.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      ({role.permissions?.length || 0} permissions)
                    </span>
                  </div>

                  {role.permissions && role.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1 pl-4">
                      {role.permissions.map((permission) => (
                        <Badge
                          key={permission.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {permission.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
