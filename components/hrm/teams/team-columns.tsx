"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Team } from "@/types/hrm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Edit, Trash2, RotateCcw, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamColumnsProps {
  onView?: (team: Team) => void;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onRestore?: (team: Team) => void;
  onManageMembers?: (team: Team) => void;
  hasPermission: (permission: string) => boolean;
  permissions: {
    update: string;
    delete: string;
    restore: string;
  };
}

export const createTeamColumns = ({
  onView,
  onEdit,
  onDelete,
  onRestore,
  onManageMembers,
  hasPermission,
  permissions,
}: TeamColumnsProps): ColumnDef<Team>[] => [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.original.code}</div>
    ),
  },
  {
    accessorKey: "name",
    header: "Team Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {row.original.description}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => {
      const dept = row.original.department;
      return dept ? (
        <div className="text-sm">{dept.name}</div>
      ) : (
        <div className="text-sm text-muted-foreground">-</div>
      );
    },
  },
  {
    accessorKey: "team_type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.team_type;
      const colors: Record<string, string> = {
        project: "bg-blue-500/10 text-blue-500",
        department: "bg-green-500/10 text-green-500",
        cross_functional: "bg-purple-500/10 text-purple-500",
        temporary: "bg-orange-500/10 text-orange-500",
      };
      return (
        <Badge variant="outline" className={colors[type] || ""}>
          {type
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "members_count",
    header: "Members",
    cell: ({ row }) => (
      <Badge variant="secondary">
        <Users className="h-3 w-3 mr-1" />
        {row.original.members_count || 0}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const variants: Record<string, "default" | "secondary" | "outline"> = {
        active: "default",
        inactive: "secondary",
        archived: "outline",
      };
      return (
        <Badge variant={variants[status] || "outline"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const team = row.original;
      const isDeleted = !!team.deleted_at;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isDeleted ? (
              <>
                {onView && (
                  <DropdownMenuItem onClick={() => onView(team)}>
                    <Users className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onManageMembers && (
                  <DropdownMenuItem onClick={() => onManageMembers(team)}>
                    <Users className="h-4 w-4 mr-2" />
                    Manage Members
                  </DropdownMenuItem>
                )}
                {hasPermission(permissions.update) && (
                  <DropdownMenuItem onClick={() => onEdit(team)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {hasPermission(permissions.delete) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(team)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </>
            ) : (
              <>
                {onRestore && hasPermission(permissions.restore) && (
                  <DropdownMenuItem onClick={() => onRestore(team)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
