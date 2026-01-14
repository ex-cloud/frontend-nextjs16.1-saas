"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useUserActivities } from "@/lib/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ActivityLog } from "@/types/user";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LazyCalendar } from "@/lib/lazy-components";
import {
  ArrowLeft,
  Download,
  FileText,
  Search,
  RefreshCw,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { formatDateValue } from "@/lib/utils/format-date";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditRow {
  id: string | number;
  timestamp: Date;
  user: { name: string; avatar?: string };
  action: "CREATE" | "UPDATE" | "DELETE";
  field: string;
  oldValue: string;
  newValue: string;
}

export default function AuditLogPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const { data: user, isLoading: isUserLoading } = useUser(userId);

  // Pagination state - client-side pagination on FLATTENED rows
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Fetch ALL activities at once (we'll paginate client-side after flattening)
  const {
    data: activities,
    isLoading: isActivitiesLoading,
    isFetching,
    refetch,
  } = useUserActivities(userId, 1, 1000); // Fetch up to 1000 records

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Flatten Logic
  const flattenActivities = (logs: ActivityLog[] = []): AuditRow[] => {
    const rows: AuditRow[] = [];
    logs.forEach((log) => {
      const date = new Date(log.created_at);
      const actor = log.causer
        ? { name: log.causer.name, avatar: log.causer.avatar_url }
        : { name: "System" };

      let action: "CREATE" | "UPDATE" | "DELETE" = "UPDATE";
      if (log.description.toLowerCase().includes("created")) action = "CREATE";
      if (log.description.toLowerCase().includes("deleted")) action = "DELETE";

      const properties = log.properties || {};
      const oldValues = (properties.old as Record<string, unknown>) || {};
      const newValues =
        (properties.attributes as Record<string, unknown>) || {};

      const changedKeys = Object.keys(newValues).filter(
        (k) => k !== "updated_at"
      );

      if (changedKeys.length === 0) {
        rows.push({
          id: log.id,
          timestamp: date,
          user: actor,
          action,
          field: log.description,
          oldValue: "-",
          newValue: "-",
        });
      } else {
        changedKeys.forEach((key) => {
          rows.push({
            id: `${log.id}-${key}`,
            timestamp: date,
            user: actor,
            action,
            field: key,
            oldValue: formatValue(oldValues[key]),
            newValue: formatValue(newValues[key]),
          });
        });
      }
    });
    return rows;
  };

  // Use centralized formatValue from format-date utility
  const formatValue = (val: unknown): string => {
    return formatDateValue(val);
  };

  // Export CSV function
  const handleExportCSV = () => {
    const headers = [
      "Timestamp",
      "User",
      "Action",
      "Field",
      "Old Value",
      "New Value",
    ];
    const csvData = filteredRows.map((row) => [
      format(row.timestamp, "yyyy-MM-dd HH:mm:ss"),
      row.user.name,
      row.action,
      row.field.replace(/_/g, " "),
      row.oldValue,
      row.newValue,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit_log_${
      user?.name?.replace(/\s+/g, "_") || "user"
    }_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Export PDF function (generates HTML table and prints)
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = filteredRows
      .map(
        (row) => `
        <tr>
          <td>${format(row.timestamp, "MMM d, yyyy, h:mm a")}</td>
          <td>${row.user.name}</td>
          <td><span class="badge ${row.action.toLowerCase()}">${
          row.action
        }</span></td>
          <td>${row.field.replace(/_/g, " ")}</td>
          <td class="old-value">${row.oldValue}</td>
          <td class="new-value">${row.newValue}</td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Audit Log - ${user?.name || "User"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 24px; margin-bottom: 5px; }
            p { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
            .create { background: #dcfce7; color: #166534; }
            .update { background: #dbeafe; color: #1e40af; }
            .delete { background: #fee2e2; color: #991b1b; }
            .old-value { color: #dc2626; }
            .new-value { color: #16a34a; font-weight: 600; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Audit Log: ${user?.name || "User"}</h1>
          <p>Employee Record ID: ${
            user?.employee_number || "N/A"
          } | Generated: ${format(new Date(), "MMM d, yyyy, h:mm a")}</p>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Field</th>
                <th>Old Value</th>
                <th>New Value</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const allRows = flattenActivities(activities?.data || []);

  const filteredRows = allRows.filter((row) => {
    const matchesSearch = row.field
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || row.action === actionFilter;

    // Date range filtering
    let matchesDateRange = true;
    if (dateRange?.from) {
      matchesDateRange = row.timestamp >= dateRange.from;
    }
    if (dateRange?.to && matchesDateRange) {
      // Include the end date by setting to end of day
      const endOfDay = new Date(dateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      matchesDateRange = row.timestamp <= endOfDay;
    }

    return matchesSearch && matchesAction && matchesDateRange;
  });

  // Client-side pagination on flattened rows
  const totalFilteredRows = filteredRows.length;
  const totalPages = Math.ceil(totalFilteredRows / perPage) || 1;
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleClearFilters = () => {
    setSearchTerm("");
    setActionFilter("all");
    setDateRange(undefined);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || actionFilter !== "all" || dateRange;

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Audit Log: {isUserLoading ? "Loading..." : user?.name}
              </h1>
              <p className="text-muted-foreground">
                Employee Record ID: {user?.employee_number || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportPDF}
            >
              <FileText className="h-4 w-4" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="border-gray-400 shadow-none rounded-md">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Toolbar - matches user-table.tsx pattern */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Filter by field name..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-37.5">
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="CREATE">Create</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="DELETE">Delete</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Date Range Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-range"
                        variant="outline"
                        className={cn(
                          "w-[260px] justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "MMM d, yyyy")} -{" "}
                              {format(dateRange.to, "MMM d, yyyy")}
                            </>
                          ) : (
                            format(dateRange.from, "MMM d, yyyy")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <LazyCalendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>

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

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    title="Refresh data"
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", isFetching && "animate-spin")}
                    />
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead className="w-[180px]">User</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead className="text-red-500">Old Value</TableHead>
                      <TableHead className="text-green-500">
                        New Value
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isActivitiesLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          {Array.from({ length: 6 }).map((_, cellIndex) => (
                            <TableCell key={cellIndex}>
                              <Skeleton className="h-6 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : paginatedRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No audit logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="text-muted-foreground font-mono text-xs">
                            {format(row.timestamp, "MMM d, yyyy, h:mm a")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                {row.user.name.charAt(0)}
                              </div>
                              <span className="font-medium text-sm">
                                {row.user.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "uppercase text-[10px] font-bold tracking-wider",
                                row.action === "CREATE" &&
                                  "bg-green-50 text-green-700 border-green-200",
                                row.action === "UPDATE" &&
                                  "bg-blue-50 text-blue-700 border-blue-200",
                                row.action === "DELETE" &&
                                  "bg-red-50 text-red-700 border-red-200"
                              )}
                            >
                              {row.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {row.field.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-red-600 break-all">
                            {row.oldValue}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-green-600 font-semibold break-all">
                            {row.newValue}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Footer - client-side pagination on flattened rows */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    {totalFilteredRows > 0
                      ? `${startIndex + 1} to ${Math.min(
                          endIndex,
                          totalFilteredRows
                        )} of ${totalFilteredRows} entries`
                      : "0 entries"}
                    {hasActiveFilters &&
                      ` (filtered from ${allRows.length} total)`}
                  </p>
                  <Select
                    value={String(perPage)}
                    onValueChange={(value) => {
                      setPerPage(Number(value));
                      setCurrentPage(1); // Reset to first page when changing per page
                    }}
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
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
