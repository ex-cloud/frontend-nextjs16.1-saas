"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  getSortedRowModel,
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
import {
  Search,
  Settings2,
  Plus,
  Maximize2,
  ListFilter,
  Calendar as CalendarIcon,
  Type,
  Hash,
  Tags,
  FileText,
  Calculator,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
  onAddProperty?: (type: CustomFieldDefinition["type"]) => void;
  className?: string;
}

const FIELD_TYPES: {
  type: CustomFieldDefinition["type"];
  label: string;
  icon: React.ElementType;
}[] = [
  { type: "text", label: "Text", icon: Type },
  { type: "number", label: "Number", icon: Hash },
  { type: "date", label: "Date", icon: CalendarIcon },
  { type: "select", label: "Select", icon: ListFilter },
  { type: "multi_select", label: "Multi-select", icon: Tags },
  { type: "files", label: "Files", icon: FileText },
  { type: "formula", label: "Formula", icon: Calculator },
];

export function DynamicTableView({
  tasks,
  customFields,
  onTaskClick,
  onAddProperty,
  className,
}: DynamicTableViewProps) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);

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
          <div className="flex items-center justify-between group/cell">
            <span className="font-medium text-sm truncate">
              {row.getValue("title")}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="h-6 px-1.5 opacity-0 group-hover/cell:opacity-100 transition-opacity gap-1 text-[10px]"
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick?.(row.original);
              }}
            >
              <Maximize2 className="h-3 w-3" />
              OPEN
            </Button>
          </div>
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
          return evaluateFormula(formula, row); // This might return number/string
        }
        return row.custom_values?.[String(field.id)]; // This returns string/number/null
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
  }, [customFields, onTaskClick]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: "includesString",
    state: {
      columnFilters,
      columnVisibility,
      globalFilter,
      sorting,
    },
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center flex-1 max-w-sm gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {/* Placeholder for Sort/Filter dropdown if needed */}
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 px-0">
            <ListFilter className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9 px-3">
                <Plus className="h-4 w-4" />
                Add Property
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {FIELD_TYPES.map((ft) => (
                <DropdownMenuItem
                  key={ft.type}
                  onClick={() => onAddProperty?.(ft.type)}
                  className="gap-2"
                >
                  <ft.icon className="h-4 w-4 text-muted-foreground" />
                  {ft.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9 px-3">
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
                    className="text-xs font-semibold py-3 h-auto whitespace-nowrap"
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2 select-none",
                        header.column.getCanSort() &&
                          "cursor-pointer hover:text-foreground/80"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {{
                        asc: <ArrowUp className="h-3 w-3" />,
                        desc: <ArrowDown className="h-3 w-3" />,
                      }[header.column.getIsSorted() as string] ??
                        (header.column.getCanSort() ? (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        ) : null)}
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
                  No tasks found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
