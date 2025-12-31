"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { PermissionModuleItem } from "@/components/users/tabs/roles/permission-module-item";
import { useMemo } from "react";
import { Role } from "@/types/user";

interface EffectivePermissionsCardProps {
  userRoles: Role[];
}

// Permission action types for the matrix
type PermissionAction =
  | "read"
  | "write"
  | "create"
  | "delete"
  | "submit"
  | "report"
  | "export";

interface ModulePermissionData {
  moduleName: string;
  displayName: string;
  documents: {
    name: string;
    displayName: string;
    permissions: Record<PermissionAction, boolean>;
  }[];
}

export function EffectivePermissionsCard({
  userRoles,
}: EffectivePermissionsCardProps) {
  // Consolidate all permissions from all roles and group by module
  const modulePermissions = useMemo(() => {
    const allPermissions = new Set<string>();

    // Collect all unique permissions from all roles
    userRoles.forEach((role) => {
      role.permissions?.forEach((permission) => {
        allPermissions.add(permission.name);
      });
    });

    // Parse permissions and group by module
    // Permission format: action_module or action_module_submodule
    // Examples: view_users, create_departments, edit_positions, access_api
    const moduleMap = new Map<string, Map<string, Set<string>>>();

    allPermissions.forEach((permissionName) => {
      const parts = permissionName.split("_");
      if (parts.length < 2) return;

      const action = parts[0]; // view, create, edit, delete, access, etc.
      const moduleParts = parts.slice(1); // users, departments, etc.
      const moduleName = moduleParts.join("_");

      // Map common action names to our standard actions
      const normalizedAction = normalizeAction(action);
      if (!normalizedAction) return;

      if (!moduleMap.has(moduleName)) {
        moduleMap.set(moduleName, new Map());
      }

      const documentMap = moduleMap.get(moduleName)!;

      // For now, treat the module itself as the document
      // You can expand this logic if you have sub-documents
      if (!documentMap.has(moduleName)) {
        documentMap.set(moduleName, new Set());
      }
      documentMap.get(moduleName)!.add(normalizedAction);
    });

    // Convert to array format
    const result: ModulePermissionData[] = [];
    moduleMap.forEach((documents, moduleName) => {
      const moduleData: ModulePermissionData = {
        moduleName,
        displayName: formatDisplayName(moduleName),
        documents: [],
      };

      documents.forEach((actions, docName) => {
        const permissionRecord: Record<PermissionAction, boolean> = {
          read: false,
          write: false,
          create: false,
          delete: false,
          submit: false,
          report: false,
          export: false,
        };

        actions.forEach((action) => {
          if (action in permissionRecord) {
            permissionRecord[action as PermissionAction] = true;
          }
        });

        moduleData.documents.push({
          name: docName,
          displayName: formatDisplayName(docName),
          permissions: permissionRecord,
        });
      });

      result.push(moduleData);
    });

    // Sort modules alphabetically
    return result.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [userRoles]);

  const roleNames = userRoles.map((r) => r.name).join(", ");

  if (userRoles.length === 0) {
    return (
      <Card className="shadow-none border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg font-semibold">
              Effective Permissions
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No roles assigned. Assign roles to see effective permissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none border">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-lg font-semibold">
            Effective Permissions
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Consolidated access rights based on assigned roles ({roleNames}).
        </p>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="space-y-0 rounded-lg border overflow-hidden">
          {modulePermissions.map((module, index) => (
            <PermissionModuleItem
              key={module.moduleName}
              moduleName={module.displayName}
              documents={module.documents}
              documentCount={module.documents.length}
              isLast={index === modulePermissions.length - 1}
            />
          ))}
        </div>

        {modulePermissions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No permissions found for assigned roles.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to normalize action names
function normalizeAction(action: string): PermissionAction | null {
  const actionMap: Record<string, PermissionAction> = {
    view: "read",
    read: "read",
    access: "read",
    edit: "write",
    update: "write",
    write: "write",
    create: "create",
    add: "create",
    store: "create",
    delete: "delete",
    destroy: "delete",
    remove: "delete",
    submit: "submit",
    approve: "submit",
    report: "report",
    export: "export",
    download: "export",
  };
  return actionMap[action.toLowerCase()] || null;
}

// Helper function to format display names
function formatDisplayName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
