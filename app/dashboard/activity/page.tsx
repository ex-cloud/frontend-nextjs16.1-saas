"use client";

import React, { useState } from "react";
import { useActivities } from "@/lib/hooks/use-activities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Search,
  RefreshCw,
  Calendar as CalendarIcon,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { formatDateValue } from "@/lib/utils/format-date";

export default function ActivityPage() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const {
    data: activities,
    isLoading,
    refetch,
    isRefetching,
  } = useActivities({
    page: currentPage,
    per_page: perPage,
    search: searchTerm || undefined,
    event: eventFilter !== "all" ? eventFilter : undefined,
    date_from: dateRange?.from
      ? format(dateRange.from, "yyyy-MM-dd")
      : undefined,
    date_to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  });

  const paginationMeta = activities?.meta || {
    current_page: 1,
    last_page: 1,
    per_page: perPage,
    total: 0,
  };

  const hasActiveFilters = searchTerm || eventFilter !== "all" || dateRange;

  const handleClearFilters = () => {
    setSearchTerm("");
    setEventFilter("all");
    setDateRange(undefined);
    setCurrentPage(1);
  };

  // Export CSV function
  const handleExportCSV = () => {
    if (!activities?.data) return;

    const headers = ["Timestamp", "User", "Action", "Subject", "Description"];
    const csvData = activities.data.map((log) => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      log.causer?.name || "System",
      log.description,
      log.subject_type,
      JSON.stringify(log.properties),
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
    link.download = `activity_logs_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <ProtectedRoute allowedRoles={["Super Admin", "Admin"]}>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Activity Logs
              </h1>
              <p className="text-muted-foreground">
                View and monitor system activities
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="px-4 lg:px-6">
          <Card className="border-gray-400 shadow-none rounded-md">
            <CardContent className="p-0">
              <div className="space-y-4 p-4">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Filter by description..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={eventFilter}
                    onValueChange={(value) => {
                      setEventFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-37.5">
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="created">Created</SelectItem>
                      <SelectItem value="updated">Updated</SelectItem>
                      <SelectItem value="deleted">Deleted</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Date Range Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          "Pick a date range"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <LazyCalendar
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                          setDateRange(range);
                          setCurrentPage(1);
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>

                  {hasActiveFilters && (
                    <Button variant="ghost" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", isRefetching && "animate-spin")}
                    />
                  </Button>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[150px]">Timestamp</TableHead>
                        <TableHead className="w-[150px]">User</TableHead>
                        <TableHead className="w-[100px]">Action</TableHead>
                        <TableHead className="w-[150px]">Subject</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 5 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-4 w-full" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : !activities?.data?.length ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-24 text-center text-muted-foreground"
                          >
                            No activities found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        activities.data.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(
                                new Date(log.created_at),
                                "MMM d, yyyy, h:mm a"
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-sm">
                                {log.causer?.name || "System"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "uppercase text-[10px] font-bold tracking-wider",
                                  log.description
                                    .toLowerCase()
                                    .includes("created") &&
                                    "bg-green-50 text-green-700 border-green-200",
                                  log.description
                                    .toLowerCase()
                                    .includes("updated") &&
                                    "bg-blue-50 text-blue-700 border-blue-200",
                                  log.description
                                    .toLowerCase()
                                    .includes("deleted") &&
                                    "bg-red-50 text-red-700 border-red-200"
                                )}
                              >
                                {log.description}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {log.subject?.type ||
                                log.subject_type?.split("\\").pop() ||
                                "-"}
                            </TableCell>
                            <TableCell className="text-sm max-w-[300px] truncate">
                              {formatDateValue(log.properties?.attributes) ||
                                "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Showing{" "}
                      {activities?.data?.length
                        ? (currentPage - 1) * perPage + 1
                        : 0}{" "}
                      to {Math.min(currentPage * perPage, paginationMeta.total)}{" "}
                      of {paginationMeta.total} entries
                    </p>
                    <Select
                      value={String(perPage)}
                      onValueChange={(value) => {
                        setPerPage(Number(value));
                        setCurrentPage(1);
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
                    {Array.from(
                      { length: Math.min(5, paginationMeta.last_page) },
                      (_, i) => {
                        let pageNum: number;
                        if (paginationMeta.last_page <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (
                          currentPage >=
                          paginationMeta.last_page - 2
                        ) {
                          pageNum = paginationMeta.last_page - 4 + i;
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
                      }
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= paginationMeta.last_page}
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(paginationMeta.last_page, p + 1)
                        )
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
    </ProtectedRoute>
  );
}
