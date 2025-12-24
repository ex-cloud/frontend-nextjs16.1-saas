"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Position } from "@/types/hrm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Edit,
  Trash2,
  RotateCcw,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PositionColumnsProps {
  onView?: (position: Position) => void;
  onEdit: (position: Position) => void;
  onDelete: (position: Position) => void;
  onRestore?: (position: Position) => void;
  hasPermission: (permission: string) => boolean;
  permissions: {
    update: string;
    delete: string;
    restore: string;
  };
}

export const createPositionColumns = ({
  onView,
  onEdit,
  onDelete,
  onRestore,
  hasPermission,
  permissions,
}: PositionColumnsProps): ColumnDef<Position>[] => [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.original.code}</div>
    ),
  },
  {
    accessorKey: "name",
    header: "Position Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-muted-foreground" />
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
    accessorKey: "level",
    header: "Level",
    cell: ({ row }) => {
      const level = row.original.level;
      if (!level) return <div className="text-sm text-muted-foreground">-</div>;
      const colors: Record<string, string> = {
        junior: "bg-blue-500/10 text-blue-500",
        mid: "bg-green-500/10 text-green-500",
        senior: "bg-purple-500/10 text-purple-500",
        lead: "bg-orange-500/10 text-orange-500",
        manager: "bg-red-500/10 text-red-500",
      };
      return (
        <Badge variant="outline" className={colors[level] || ""}>
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "salary_range",
    header: "Salary Range",
    cell: ({ row }) => {
      const pos = row.original;
      if (pos.salary_min && pos.salary_max) {
        return (
          <div className="text-sm font-mono">
            ${parseFloat(pos.salary_min).toLocaleString()} - $
            {parseFloat(pos.salary_max).toLocaleString()}
          </div>
        );
      }
      return <div className="text-sm text-muted-foreground">-</div>;
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? "default" : "secondary"}>
        {row.original.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const position = row.original;
      const isDeleted = !!position.deleted_at;

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
                  <DropdownMenuItem onClick={() => onView(position)}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {hasPermission(permissions.update) && (
                  <DropdownMenuItem onClick={() => onEdit(position)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {hasPermission(permissions.delete) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(position)}
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
                  <DropdownMenuItem onClick={() => onRestore(position)}>
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
