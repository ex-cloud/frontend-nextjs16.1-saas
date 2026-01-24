"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { PermissionGroupItem } from "@/components/users/tabs/roles/permission-group-item";
import { useMemo } from "react";
import { Role } from "@/types/user";
import { permissionService } from "@/lib/api/services/permission.service";
import { useQuery } from "@tanstack/react-query";

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

interface GroupedPermissionData {
  groupName: string;
  modules: ModulePermissionData[];
}

export function EffectivePermissionsCard({
  userRoles,
}: EffectivePermissionsCardProps) {
  // Fetch permission groups configuration from backend
  const { data: moduleGroups = {} } = useQuery({
    queryKey: ["permission-groups"],
    queryFn: () => permissionService.getPermissionGroups(),
    staleTime: Infinity, // Configuration rarely changes
  });

  // Consolidate all permissions from all roles and group by module
  const groupedPermissions = useMemo(() => {
    const allPermissions = new Set<string>();

    // Collect all unique permissions from all roles
    userRoles.forEach((role) => {
      role.permissions?.forEach((permission) => {
        allPermissions.add(permission.name);
      });
    });

    // Parse permissions and group by module
    // Permission format: action_module or action_module_submodule
    const moduleMap = new Map<string, Map<string, Set<string>>>();

    allPermissions.forEach((permissionName) => {
      const parts = permissionName.split("_");
      if (parts.length < 2) return;

      const action = parts[0];
      const moduleParts = parts.slice(1);
      const moduleName = moduleParts.join("_");

      const normalizedAction = normalizeAction(action);
      if (!normalizedAction) return;

      const normalizedModuleName = moduleName.replace(/s$/, "");

      if (!moduleMap.has(normalizedModuleName)) {
        moduleMap.set(normalizedModuleName, new Map());
      }

      const documentMap = moduleMap.get(normalizedModuleName)!;

      if (!documentMap.has(normalizedModuleName)) {
        documentMap.set(normalizedModuleName, new Set());
      }

      // If action is 'manage', it grants multiple permissions in the UI
      if (action.toLowerCase() === "manage") {
        documentMap.get(normalizedModuleName)!.add("read");
        documentMap.get(normalizedModuleName)!.add("write");
        documentMap.get(normalizedModuleName)!.add("create");
        documentMap.get(normalizedModuleName)!.add("delete");
      } else {
        documentMap.get(normalizedModuleName)!.add(normalizedAction);
      }
    });

    // Convert to array format
    const result: ModulePermissionData[] = [];
    moduleMap.forEach((documents, normalizedModuleName) => {
      const moduleData: ModulePermissionData = {
        moduleName: normalizedModuleName,
        displayName: formatDisplayName(normalizedModuleName),
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

    // Group modules into categories using dynamic groups
    const groups: GroupedPermissionData[] = [];
    const processedModules = new Set<string>();

    // Process defined groups
    Object.entries(moduleGroups).forEach(([groupName, moduleKeys]) => {
      const groupModules: ModulePermissionData[] = [];
      const keys = moduleKeys as string[];

      keys.forEach((key: string) => {
        const foundModule = result.find(
          (m) =>
            m.moduleName === key ||
            m.moduleName.replace(/s$/, "") === key.replace(/s$/, ""),
        );
        if (foundModule && !processedModules.has(foundModule.moduleName)) {
          groupModules.push(foundModule);
          processedModules.add(foundModule.moduleName);
        }
      });

      if (groupModules.length > 0) {
        groups.push({
          groupName,
          modules: groupModules.sort((a, b) =>
            a.displayName.localeCompare(b.displayName),
          ),
        });
      }
    });

    // Handle "Other" modules (not in any defined group)
    const otherModules = result.filter(
      (m) => !processedModules.has(m.moduleName),
    );
    if (otherModules.length > 0) {
      groups.push({
        groupName: "Others",
        modules: otherModules.sort((a, b) =>
          a.displayName.localeCompare(b.displayName),
        ),
      });
    }

    return groups;
  }, [userRoles, moduleGroups]);

  const roleNames = userRoles.map((r) => r.name).join(", ");

  if (userRoles.length === 0) {
    return (
      <Card
        className="shadow-none border rounded-md glass-card fade-in-up"
        style={{ animationDelay: "0.2s" }}
      >
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
    <Card
      className="shadow-none border rounded-md glass-card fade-in-up"
      style={{ animationDelay: "0.2s" }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg font-semibold">
              Effective Permissions
            </CardTitle>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Consolidated access rights based on assigned roles ({roleNames}).
        </p>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="space-y-0  overflow-hidden">
          {groupedPermissions.map((group) => {
            // Aggregate all documents from all modules in this group
            const aggregatedDocuments = group.modules.flatMap(
              (m) => m.documents,
            );

            return (
              <PermissionGroupItem
                key={group.groupName}
                groupName={group.groupName}
                documents={aggregatedDocuments}
                documentCount={aggregatedDocuments.length}
                defaultOpen={true}
              />
            );
          })}
        </div>

        {groupedPermissions.length === 0 && (
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
    manage: "write",
    assign: "submit",
    move: "write",
    restore: "write",
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
