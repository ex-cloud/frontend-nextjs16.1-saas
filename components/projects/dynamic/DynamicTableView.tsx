"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Task, CustomFieldDefinition } from "@/types/project";
import { FieldRenderer } from "./FieldRenderer";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search, Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { evaluateFormula } from "@/lib/utils/formula-evaluator";

interface DynamicTableViewProps {
  tasks: Task[];
  customFields: CustomFieldDefinition[];
  onTaskClick?: (task: Task) => void;
  className?: string;
}

export function DynamicTableView({
  tasks,
  customFields,
  onTaskClick,
  className,
}: DynamicTableViewProps) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] = React.useState({});

  // Define columns
  const columns = React.useMemo<ColumnDef<Task>[]>(() => {
    // 1. Static Columns
    const staticCols: ColumnDef<Task>[] = [
      {
        accessorKey: "task_number",
        header: "Key",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] font-mono">
            {row.getValue("task_number")}
          </Badge>
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="font-medium text-sm">{row.getValue("title")}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="secondary" className="capitalize text-[10px]">
            {String(row.getValue("status")).replace("_", " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "assignee",
        header: "Assignee",
        cell: ({ row }) => {
          const assignee = row.original.assignee;
          if (!assignee)
            return <span className="text-muted-foreground/40">-</span>;
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={assignee.avatar_url || ""} />
                <AvatarFallback className="text-[8px]">
                  {assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs truncate max-w-[100px]">
                {assignee.name}
              </span>
            </div>
          );
        },
      },
    ];

    // 2. Dynamic Columns
    const dynamicCols: ColumnDef<Task>[] = customFields.map((field) => ({
      id: `custom_${field.id}`,
      header: field.name,
      accessorFn: (row) => {
        if (field.type === "formula") {
          const formula =
            (field.options as { formula?: string })?.formula || "";
          return evaluateFormula(formula, row);
        }
        return row.custom_values?.[String(field.id)];
      },
      cell: ({ row }) => {
        let value = row.original.custom_values?.[String(field.id)];

        if (field.type === "formula") {
          const formula =
            (field.options as { formula?: string })?.formula || "";
          value = evaluateFormula(formula, row.original);
        }

        return (
          <FieldRenderer
            type={field.type === "formula" ? "number" : field.type}
            value={value}
            definition={field}
            isCompact
          />
        );
      },
    }));

    return [...staticCols, ...dynamicCols];
  }, [customFields]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto gap-2">
              <Settings2 className="h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id.replace("custom_", "").replace("_", " ")}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-b"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold py-2 h-auto"
                  >
                    <div className="space-y-2 py-2">
                      <div className="flex items-center justify-between">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </div>
                      {header.column.getCanFilter() ? (
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground/50" />
                          <Input
                            placeholder={`Filter...`}
                            value={
                              (header.column.getFilterValue() as string) ?? ""
                            }
                            onChange={(event) =>
                              header.column.setFilterValue(event.target.value)
                            }
                            className="h-7 w-full pl-7 text-[10px] bg-background/50 border-muted-foreground/10 focus-visible:ring-1"
                          />
                        </div>
                      ) : null}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => onTaskClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
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
                  className="h-24 text-center text-muted-foreground"
                >
                  No tasks found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
