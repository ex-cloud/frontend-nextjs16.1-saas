"use client";

import React, { useMemo } from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Building2 } from "lucide-react";
import { useDepartments } from "@/hooks/use-departments";
import { Department, DepartmentFilters } from "@/types/hrm";
import { usePermissions } from "@/hooks/use-permissions";
import { HRM_PERMISSIONS } from "@/lib/permissions/hrm";
import { TableSkeleton } from "@/components/ui/skeleton-loaders";
import { ErrorState, EmptyState } from "@/components/error-boundary";
import { useDataTable } from "@/lib/hooks/use-data-table";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { createDepartmentColumns } from "./department-columns";

interface DepartmentTableProps {
  onView?: (dept: Department) => void;
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
  onRestore?: (dept: Department) => void;
  onCreate: () => void;
}

export function DepartmentTable({
  onView,
  onEdit,
  onDelete,
  onRestore,
  onCreate,
}: DepartmentTableProps) {
  const {
    filters,
    searchValue,
    setSearchValue,
    sorting,
    handleSortingChange,
    handlePageChange,
  } = useDataTable<DepartmentFilters>({
    initialFilters: {
      page: 1,
      per_page: 10,
      sort_by: "name",
      sort_order: "asc",
    },
  });

  const { data, isLoading, isError, error, refetch } = useDepartments(filters);
  const { hasPermission } = usePermissions();

  const columns = useMemo(
    () =>
      createDepartmentColumns({
        onView,
        onEdit,
        onDelete,
        onRestore,
        hasPermission,
        permissions: {
          update: HRM_PERMISSIONS.DEPARTMENTS_UPDATE,
          delete: HRM_PERMISSIONS.DEPARTMENTS_DELETE,
          restore: HRM_PERMISSIONS.DEPARTMENTS_RESTORE,
        },
      }),
    [onView, onEdit, onDelete, onRestore, hasPermission]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: handleSortingChange,
    state: {
      sorting,
    },
    manualPagination: true,
  });

  if (isLoading) return <TableSkeleton />;
  if (isError)
    return <ErrorState error={error as Error} onRetry={() => refetch()} />;

  const departments = data?.data || [];
  const isInitialEmpty = departments.length === 0 && !filters.search;

  if (isInitialEmpty) {
    return (
      <EmptyState
        title="No departments yet"
        description="Get started by creating your first department"
        icon={<Building2 className="h-12 w-12" />}
        action={{ label: "Create Department", onClick: onCreate }}
      />
    );
  }

  return (
    <DataTableShell
      table={table}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder="Search departments..."
      pagination={
        data
          ? {
              from: data.from ?? undefined,
              to: data.to ?? undefined,
              total: data.total,
              currentPage: filters.page || 1,
              lastPage: data.last_page || 1,
              resourceName: "departments",
            }
          : undefined
      }
      onPageChange={handlePageChange}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Department
          </Button>
        </>
      }
    />
  );
}
