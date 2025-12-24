"use client";

import React, { useMemo } from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTeams } from "@/hooks/use-teams";
import {
  Team,
  TeamFilters,
  TEAM_TYPE_OPTIONS,
  TEAM_STATUS_OPTIONS,
} from "@/types/hrm";
import { usePermissions } from "@/hooks/use-permissions";
import { HRM_PERMISSIONS } from "@/lib/permissions/hrm";
import { TableSkeleton } from "@/components/ui/skeleton-loaders";
import { ErrorState, EmptyState } from "@/components/error-boundary";
import { useDataTable } from "@/lib/hooks/use-data-table";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { createTeamColumns } from "./team-columns";

interface TeamTableProps {
  onView?: (team: Team) => void;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onRestore?: (team: Team) => void;
  onManageMembers?: (team: Team) => void;
  onCreate: () => void;
}

/**
 * Optimized TeamTable component.
 * Uses useDataTable hook for state and DataTableShell for UI.
 */
export function TeamTable({
  onView,
  onEdit,
  onDelete,
  onRestore,
  onManageMembers,
  onCreate,
}: TeamTableProps) {
  // 1. Use the generic data table hook
  const {
    filters,
    searchValue,
    setSearchValue,
    sorting,
    handleSortingChange,
    handlePageChange,
    updateFilter,
  } = useDataTable<TeamFilters>({
    initialFilters: {
      page: 1,
      per_page: 10,
      sort_by: "name",
      sort_order: "asc",
    },
  });

  // 2. Data fetching
  const { data, isLoading, isError, error, refetch } = useTeams(filters);
  const { hasPermission } = usePermissions();

  // 3. Define columns (memoized)
  const columns = useMemo(
    () =>
      createTeamColumns({
        onView,
        onEdit,
        onDelete,
        onRestore,
        onManageMembers,
        hasPermission,
        permissions: {
          update: HRM_PERMISSIONS.TEAMS_UPDATE,
          delete: HRM_PERMISSIONS.TEAMS_DELETE,
          restore: HRM_PERMISSIONS.TEAMS_RESTORE,
        },
      }),
    [onView, onEdit, onDelete, onRestore, onManageMembers, hasPermission]
  );

  // 4. Setup TanStack Table
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

  // 5. Conditional Rendering for Loading/Error/Empty States
  if (isLoading) return <TableSkeleton />;
  if (isError)
    return <ErrorState error={error as Error} onRetry={() => refetch()} />;

  const teams = data?.data || [];
  const isInitialEmpty =
    teams.length === 0 &&
    !filters.search &&
    !filters.team_type &&
    !filters.status;

  if (isInitialEmpty) {
    return (
      <EmptyState
        title="No teams yet"
        description="Get started by creating your first team"
        action={{ label: "Create Team", onClick: onCreate }}
      />
    );
  }

  // 6. Use the optimized shell
  return (
    <DataTableShell
      table={table}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder="Search teams..."
      pagination={
        data
          ? {
              from: data.from ?? undefined,
              to: data.to ?? undefined,
              total: data.total,
              currentPage: filters.page || 1,
              lastPage: data.last_page || 1,
              resourceName: "teams",
            }
          : undefined
      }
      onPageChange={handlePageChange}
      filters={
        <>
          <Select
            value={filters.team_type || "all"}
            onValueChange={(val) => updateFilter("team_type", val)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TEAM_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status || "all"}
            onValueChange={(val) => updateFilter("status", val)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {TEAM_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      }
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Team
          </Button>
        </>
      }
    />
  );
}
