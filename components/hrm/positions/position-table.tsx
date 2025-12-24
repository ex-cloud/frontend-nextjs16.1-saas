"use client";

import React, { useMemo } from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Briefcase } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePositions } from "@/hooks/use-positions";
import { Position, PositionFilters, POSITION_LEVEL_OPTIONS } from "@/types/hrm";
import { usePermissions } from "@/hooks/use-permissions";
import { HRM_PERMISSIONS } from "@/lib/permissions/hrm";
import { TableSkeleton } from "@/components/ui/skeleton-loaders";
import { ErrorState, EmptyState } from "@/components/error-boundary";
import { useDataTable } from "@/lib/hooks/use-data-table";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { createPositionColumns } from "./position-columns";

interface PositionTableProps {
  onView?: (position: Position) => void;
  onEdit: (position: Position) => void;
  onDelete: (position: Position) => void;
  onRestore?: (position: Position) => void;
  onCreate: () => void;
}

export function PositionTable({
  onView,
  onEdit,
  onDelete,
  onRestore,
  onCreate,
}: PositionTableProps) {
  const {
    filters,
    searchValue,
    setSearchValue,
    sorting,
    handleSortingChange,
    handlePageChange,
    updateFilter,
  } = useDataTable<PositionFilters>({
    initialFilters: {
      page: 1,
      per_page: 10,
      sort_by: "name",
      sort_order: "asc",
    },
  });

  const { data, isLoading, isError, error, refetch } = usePositions(filters);
  const { hasPermission } = usePermissions();

  const columns = useMemo(
    () =>
      createPositionColumns({
        onView,
        onEdit,
        onDelete,
        onRestore,
        hasPermission,
        permissions: {
          update: HRM_PERMISSIONS.POSITIONS_UPDATE,
          delete: HRM_PERMISSIONS.POSITIONS_DELETE,
          restore: HRM_PERMISSIONS.POSITIONS_RESTORE,
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

  const positions = data?.data || [];
  const isInitialEmpty =
    positions.length === 0 && !filters.search && !filters.level;

  if (isInitialEmpty) {
    return (
      <EmptyState
        title="No positions yet"
        description="Get started by creating your first position"
        icon={<Briefcase className="h-12 w-12" />}
        action={{ label: "Create Position", onClick: onCreate }}
      />
    );
  }

  return (
    <DataTableShell
      table={table}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder="Search positions..."
      pagination={
        data
          ? {
              from: data.from ?? undefined,
              to: data.to ?? undefined,
              total: data.total,
              currentPage: filters.page || 1,
              lastPage: data.last_page || 1,
              resourceName: "positions",
            }
          : undefined
      }
      onPageChange={handlePageChange}
      filters={
        <Select
          value={filters.level || "all"}
          onValueChange={(val) => updateFilter("level", val)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {POSITION_LEVEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Position
          </Button>
        </>
      }
    />
  );
}
