"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  Download,
  RefreshCw,
} from "lucide-react";
import { createUserColumns } from "./user-columns";
import {
  useUsers,
  useExportUsers,
  useBulkActivateUsers,
  useBulkDeactivateUsers,
} from "@/lib/hooks/use-users";
import { User, UserFilters } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";

interface UserTableProps {
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onActivate: (user: User) => void;
  onDeactivate: (user: User) => void;
  onVerifyEmail: (user: User) => void;
  onResetPassword: (user: User) => void;
  onBulkDelete: (ids: string[]) => void;
  onCreateNew: () => void;
  initialRoles?: { id: string; name: string }[];
}

export function UserTable({
  onView,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onVerifyEmail,
  onResetPassword,
  onBulkDelete,
  onCreateNew,
  initialRoles,
}: UserTableProps) {
  const { data: session, status } = useSession();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    per_page: 10,
    sort_by: "created_at",
    sort_order: "desc",
  });

  // Debounce search with 600ms delay for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue) {
        setFilters((prev) => {
          return { ...prev, search: searchValue, page: 1 };
        });
      } else {
        // Clear search filter when input is empty
        setFilters((prev) => {
          if (!prev.search) return prev;
          const newState = { ...prev };
          delete newState.search;
          return { ...newState, page: 1 };
        });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Fetch users dengan React Query - hanya jika authenticated
  const { data, isLoading, error, refetch } = useUsers(filters, {
    enabled: status === "authenticated" && !!session?.user?.accessToken,
  });
  const exportMutation = useExportUsers();
  const bulkActivateMutation = useBulkActivateUsers();
  const bulkDeactivateMutation = useBulkDeactivateUsers();

  // Create columns
  const columns = React.useMemo(() => {
    return createUserColumns(
      onView,
      onEdit,
      onDelete,
      onActivate,
      onDeactivate,
      onVerifyEmail,
      onResetPassword
    );
  }, [
    onView,
    onEdit,
    onDelete,
    onActivate,
    onDeactivate,
    onVerifyEmail,
    onResetPassword,
  ]);

  // Setup table
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
    manualPagination: true,
    pageCount: data?.meta.last_page || 1,
  });

  // Handle refetch
  const handleRefetch = () => {
    refetch();
  };

  const handleRoleFilter = (value: string) => {
    if (value === "all") {
      setFilters((prev) => {
        const newState = { ...prev };
        delete newState.role;
        return { ...newState, page: 1 };
      });
    } else {
      setFilters((prev) => ({ ...prev, role: value, page: 1 }));
    }
  };

  const handleStatusFilter = (value: string) => {
    if (value === "all") {
      setFilters((prev) => {
        const newState = { ...prev };
        delete newState.is_active;
        return { ...newState, page: 1 };
      });
    } else {
      setFilters((prev) => ({
        ...prev,
        is_active: value === "active",
        page: 1,
      }));
    }
  };

  const handleClearFilters = () => {
    setSearchValue("");
    setFilters({
      page: 1,
      per_page: filters.per_page,
      sort_by: "created_at",
      sort_order: "desc",
    });
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchValue || filters.role || filters.is_active !== undefined;

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePerPageChange = (perPage: number) => {
    setFilters((prev) => ({ ...prev, per_page: perPage, page: 1 }));
  };

  // Handle bulk actions
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);

  const handleBulkAction = async (
    action: "delete" | "activate" | "deactivate"
  ) => {
    if (selectedIds.length === 0) return;

    switch (action) {
      case "delete":
        onBulkDelete(selectedIds);
        setRowSelection({});
        break;
      case "activate":
        await bulkActivateMutation.mutateAsync(selectedIds);
        setRowSelection({});
        break;
      case "deactivate":
        await bulkDeactivateMutation.mutateAsync(selectedIds);
        setRowSelection({});
        break;
    }
  };

  const handleExport = () => {
    exportMutation.mutate(filters);
  };

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 p-8 text-center">
        <p className="text-destructive">
          Failed to load users: {error.message}
        </p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>

          <Select
            onValueChange={handleRoleFilter}
            value={filters.role || "all"}
          >
            <SelectTrigger className="w-37.5">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {initialRoles && initialRoles.length > 0 ? (
                initialRoles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          <Select
            onValueChange={handleStatusFilter}
            value={
              filters.is_active === undefined
                ? "all"
                : filters.is_active
                ? "active"
                : "inactive"
            }
          >
            <SelectTrigger className="w-37.5">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-10 px-3"
            >
              Clear Filters
            </Button>
          )}

          <Button variant="outline" size="icon" onClick={handleRefetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={onCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
          <Badge variant="secondary">{selectedIds.length} selected</Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAction("activate")}
            disabled={bulkActivateMutation.isPending}
          >
            <UserCheck className="mr-2 h-4 w-4" />
            {bulkActivateMutation.isPending ? "Activating..." : "Activate"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAction("deactivate")}
            disabled={bulkDeactivateMutation.isPending}
          >
            <UserX className="mr-2 h-4 w-4" />
            {bulkDeactivateMutation.isPending
              ? "Deactivating..."
              : "Deactivate"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleBulkAction("delete")}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {status === "loading" || isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Failed to load users. Please try again.
                    </p>
                    <Button variant="outline" size="sm" onClick={handleRefetch}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.meta && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing {data.meta.from || 0} to {data.meta.to || 0} of{" "}
              {data.meta.total} users
            </p>
            <Select
              value={String(filters.per_page)}
              onValueChange={(value) => handlePerPageChange(Number(value))}
            >
              <SelectTrigger className="w-25">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(filters.page! - 1)}
              disabled={filters.page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: data.meta.last_page }, (_, i) => i + 1)
                .filter((page) => {
                  const current = filters.page || 1;
                  return (
                    page === 1 ||
                    page === data.meta.last_page ||
                    (page >= current - 1 && page <= current + 1)
                  );
                })
                .map((page, index, array) => {
                  if (index > 0 && page - array[index - 1] > 1) {
                    return (
                      <React.Fragment key={`page-group-${page}`}>
                        <span className="px-2">...</span>
                        <Button
                          variant={
                            filters.page === page ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    );
                  }
                  return (
                    <Button
                      key={page}
                      variant={filters.page === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(filters.page! + 1)}
              disabled={filters.page === data.meta.last_page}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
