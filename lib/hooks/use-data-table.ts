import { useState, useEffect } from "react";
import { SortingState, OnChangeFn } from "@tanstack/react-table";

export interface BaseFilters {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

interface UseDataTableOptions<TFilters extends BaseFilters> {
  initialFilters: TFilters;
  onFilterChange?: (filters: TFilters) => void;
  debounceMs?: number;
}

/**
 * A reusable hook to manage DataTable state.
 * Centralizes filtering, sorting, and pagination logic.
 */
export function useDataTable<TFilters extends BaseFilters>({
  initialFilters,
  debounceMs = 600,
}: UseDataTableOptions<TFilters>) {
  const [filters, setFilters] = useState<TFilters>(initialFilters);
  const [searchValue, setSearchValue] = useState(initialFilters.search || "");
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: initialFilters.sort_by || "id",
      desc: initialFilters.sort_order === "desc",
    },
  ]);

  // Handle sorting change from TanStack Table
  // This avoids the "Cascading Renders" effect warning
  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const nextSorting =
      typeof updater === "function" ? updater(sorting) : updater;
    setSorting(nextSorting);

    if (nextSorting.length > 0) {
      setFilters((prev) => ({
        ...prev,
        sort_by: nextSorting[0].id,
        sort_order: nextSorting[0].desc ? "desc" : "asc",
        page: 1, // Reset to first page on sort change
      }));
    }
  };

  // Debounced search logic remains an effect as it depends on user typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        const val = searchValue || undefined;
        if (prev.search === val) return prev;

        return {
          ...prev,
          search: val,
          page: 1,
        };
      });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, debounceMs]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePerPageChange = (per_page: number) => {
    setFilters((prev) => ({ ...prev, per_page, page: 1 }));
  };

  const updateFilter = (
    key: keyof TFilters,
    value: TFilters[keyof TFilters] | "all"
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      page: 1,
    }));
  };

  const clearFilters = (defaults: Partial<TFilters>) => {
    setSearchValue("");
    setFilters({
      ...initialFilters,
      ...defaults,
      page: 1,
    });
  };

  return {
    filters,
    setFilters,
    searchValue,
    setSearchValue,
    sorting,
    handleSortingChange, // Use this for onSortingChange
    handlePageChange,
    handlePerPageChange,
    updateFilter,
    clearFilters,
  };
}
