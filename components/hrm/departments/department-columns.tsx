"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Department } from "@/types/hrm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
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

interface DepartmentColumnsProps {
  onView?: (dept: Department) => void;
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
  onRestore?: (dept: Department) => void;
  hasPermission: (permission: string) => boolean;
  permissions: {
    update: string;
    delete: string;
    restore: string;
  };
}

export const createDepartmentColumns = ({
  onView,
  onEdit,
  onDelete,
  onRestore,
  hasPermission,
  permissions,
}: DepartmentColumnsProps): ColumnDef<Department>[] => [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.original.code}</div>
    ),
  },
  {
    accessorKey: "name",
    header: "Department Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
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
    accessorKey: "parent",
    header: "Parent Department",
    cell: ({ row }) => {
      const parent = row.original.parent;
      return parent ? (
        <div className="text-sm">{parent.name}</div>
      ) : (
        <div className="text-sm text-muted-foreground">-</div>
      );
    },
  },
  {
    accessorKey: "positions_count",
    header: "Positions",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.positions_count || 0}</Badge>
    ),
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
      const dept = row.original;
      const isDeleted = !!dept.deleted_at;

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
                  <DropdownMenuItem onClick={() => onView(dept)}>
                    <Building2 className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {hasPermission(permissions.update) && (
                  <DropdownMenuItem onClick={() => onEdit(dept)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {hasPermission(permissions.delete) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(dept)}
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
                  <DropdownMenuItem onClick={() => onRestore(dept)}>
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
