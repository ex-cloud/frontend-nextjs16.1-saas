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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Task,
  CustomFieldDefinition,
  CustomFieldOptions,
  ProjectMember,
  CustomFieldFile,
} from "@/types/project";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldRenderer } from "./FieldRenderer";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Search,
  Settings2,
  Plus,
  ListFilter,
  Calendar as CalendarIcon,
  Type,
  Hash,
  Tags,
  FileText,
  Calculator,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Eye,
  CheckSquare,
  Link as LinkIcon,
  Mail,
  Phone,
  Clock,
  History as HistoryIcon,
  Star,
  Activity,
  X,
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
import { AdvancedDatePicker } from "./AdvancedDatePicker";
import { toast } from "sonner";

interface DynamicTableViewProps {
  tasks: Task[];
  customFields: CustomFieldDefinition[];
  onTaskClick?: (task: Task) => void;
  onAddProperty?: (type: CustomFieldDefinition["type"]) => void;
  onUpdateCustomField?: (
    taskId: string | number,
    fieldId: string | number,
    value: unknown
  ) => void;
  onUpdateTask?: (
    taskId: string | number,
    field: keyof Task,
    value: unknown
  ) => void;
  onFileUpload?: (
    taskId: string | number,
    fieldId: string | number,
    file: File
  ) => Promise<void>;
  projectMembers?: ProjectMember[];
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
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "url", label: "URL", icon: LinkIcon },
  { type: "email", label: "Email", icon: Mail },
  { type: "phone", label: "Phone", icon: Phone },
  { type: "created_at", label: "Created time", icon: Clock },
  { type: "updated_at", label: "Last edited time", icon: HistoryIcon },
  { type: "rating", label: "Rating", icon: Star },
  { type: "progress", label: "Progress", icon: Activity },
];

export function DynamicTableView({
  tasks,
  customFields,
  onTaskClick,
  onAddProperty,
  onUpdateCustomField,
  onUpdateTask,
  onFileUpload,
  projectMembers = [],
  className,
}: DynamicTableViewProps) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Optimistic updates state
  const [localTasks, setLocalTasks] = React.useState<Task[]>(tasks);

  // Keep local tasks in sync with prop updates
  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const updateLocalTaskField = React.useCallback(
    (taskId: string | number, fieldId: string | number, value: unknown) => {
      setLocalTasks((prev) =>
        prev.map((t) => {
          if (String(t.id) === String(taskId)) {
            return {
              ...t,
              custom_values: {
                ...(t.custom_values || {}),
                [String(fieldId)]: value,
              },
            };
          }
          return t;
        })
      );
    },
    []
  );

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
          <div
            className="flex items-center gap-2 group/title cursor-pointer py-1"
            onClick={() => onTaskClick?.(row.original)}
          >
            <span className="font-medium text-sm truncate group-hover/title:text-primary transition-colors">
              {row.getValue("title")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="capitalize text-[10px] whitespace-nowrap bg-muted/50 text-muted-foreground border-none"
          >
            {String(row.getValue("status")).replace("_", " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "assignee",
        header: "Assignee",
        cell: ({ row }) => {
          const assignee = row.original.assignee;
          return (
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1 transition-all group/assignee min-h-[28px]">
                  {assignee ? (
                    <>
                      <Avatar className="h-5 w-5 border border-background shadow-sm">
                        <AvatarImage src={assignee.avatar_url || ""} />
                        <AvatarFallback className="text-[8px] bg-muted/60">
                          {assignee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate max-w-[80px] text-foreground/80">
                        {assignee.name}
                      </span>
                      {onUpdateTask && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateTask(row.original.id, "assignee_id", null);
                          }}
                          className="opacity-0 group-hover/assignee:opacity-100 hover:text-destructive transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground/30 italic text-[11px] group-hover/assignee:text-muted-foreground transition-colors">
                      Unassigned
                    </span>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1" align="start">
                <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wider">
                  Select Assignee
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {projectMembers.map((m) => (
                    <Button
                      key={m.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-2 h-8 px-2 font-normal",
                        String(assignee?.id) === String(m.user?.id) &&
                          "bg-muted"
                      )}
                      onClick={() => {
                        if (onUpdateTask) {
                          onUpdateTask(
                            row.original.id,
                            "assignee_id",
                            m.user?.id
                          );
                        }
                      }}
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={m.user?.avatar_url || ""} />
                        <AvatarFallback className="text-[8px]">
                          {m.user?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{m.user?.name}</span>
                    </Button>
                  ))}
                  {projectMembers.length === 0 && (
                    <div className="px-2 py-4 text-center text-xs text-muted-foreground italic">
                      No members assigned to project
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
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
          return (
            <FieldRenderer
              type="number"
              value={value}
              definition={field}
              isCompact
            />
          );
        }

        if (field.type === "date") {
          return (
            <Popover>
              <PopoverTrigger asChild>
                <div className="cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors min-h-[24px] flex items-center">
                  <FieldRenderer
                    type="date"
                    value={value}
                    definition={field}
                    isCompact
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <AdvancedDatePicker
                  selected={value as string}
                  onSelect={(date: string | null) => {
                    updateLocalTaskField(row.original.id, field.id, date);
                    if (onUpdateCustomField) {
                      onUpdateCustomField(row.original.id, field.id, date);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          );
        }

        if (field.type === "checkbox") {
          return (
            <div className="flex items-center">
              <Checkbox
                checked={value === true || value === "true" || value === 1}
                onCheckedChange={(checked) => {
                  updateLocalTaskField(row.original.id, field.id, !!checked);
                  if (onUpdateCustomField) {
                    onUpdateCustomField(row.original.id, field.id, !!checked);
                  }
                }}
              />
            </div>
          );
        }

        if (field.type === "select") {
          const options = (field.options as CustomFieldOptions)?.options || [];
          return (
            <Select
              value={String(value || "")}
              onValueChange={(val) => {
                updateLocalTaskField(row.original.id, field.id, val);
                if (onUpdateCustomField) {
                  onUpdateCustomField(row.original.id, field.id, val);
                }
              }}
            >
              <SelectTrigger className="h-7 border-none bg-transparent hover:bg-muted/50 transition-colors p-1 w-auto min-w-[80px] shadow-none focus:ring-0">
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        if (field.type === "multi_select") {
          const options = (field.options as CustomFieldOptions)?.options || [];
          return (
            <Popover>
              <PopoverTrigger asChild>
                <div className="cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors min-h-[24px] flex items-center overflow-hidden">
                  <FieldRenderer
                    type="multi_select"
                    value={value}
                    definition={field}
                    isCompact
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="space-y-1">
                  {options.map((opt) => {
                    const current = Array.isArray(value) ? value : [];
                    const isChecked = current.includes(opt);
                    return (
                      <div
                        key={opt}
                        className="flex items-center gap-2 px-2 py-1 hover:bg-muted/50 rounded cursor-pointer"
                        onClick={() => {
                          const next = isChecked
                            ? current.filter((c) => c !== opt)
                            : [...current, opt];
                          updateLocalTaskField(row.original.id, field.id, next);
                          if (onUpdateCustomField) {
                            onUpdateCustomField(
                              row.original.id,
                              field.id,
                              next
                            );
                          }
                        }}
                      >
                        <Checkbox checked={isChecked} />
                        <span className="text-sm">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          );
        }

        if (field.type === "files") {
          return (
            <Popover>
              <PopoverTrigger asChild>
                <div className="cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors min-h-[24px] flex items-center overflow-hidden">
                  <FieldRenderer
                    type="files"
                    value={value}
                    definition={field}
                    isCompact
                  />
                  {!value ||
                  (Array.isArray(value) && value.length === 0) ||
                  (typeof value === "object" &&
                    Object.keys(value as object).length === 0) ? (
                    <span className="text-muted-foreground/30 italic text-[10px] ml-1">
                      Empty
                    </span>
                  ) : null}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">
                    Upload Files
                  </div>
                  <div className="grid gap-2">
                    {Array.isArray(value) &&
                      value.map((file: CustomFieldFile, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs p-1.5 bg-muted/40 rounded border border-border/50 group/file"
                        >
                          <div
                            className="flex items-center gap-2 truncate flex-1 cursor-pointer hover:underline"
                            onClick={() =>
                              window.open(
                                typeof file === "string" ? file : file.url,
                                "_blank"
                              )
                            }
                          >
                            <span className="truncate max-w-[150px] font-medium">
                              {file.name}
                            </span>
                          </div>
                          <div className="flex items-center opacity-0 group-hover/file:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  typeof file === "string" ? file : file.url,
                                  "_blank"
                                );
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = (
                                  value as CustomFieldFile[]
                                ).filter((_, idx) => idx !== i);
                                updateLocalTaskField(
                                  row.original.id,
                                  field.id,
                                  next
                                );
                                if (onUpdateCustomField) {
                                  onUpdateCustomField(
                                    row.original.id,
                                    field.id,
                                    next
                                  );
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-2 border-dashed h-9"
                    onClick={() =>
                      document
                        .getElementById(
                          `file-upload-${field.id}-${row.original.id}`
                        )
                        ?.click()
                    }
                  >
                    <Plus className="h-3.5 w-3.5" /> Choose a file
                  </Button>
                  <input
                    id={`file-upload-${field.id}-${row.original.id}`}
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && onFileUpload) {
                        // Optimistic update for files is tricky because we don't have the URL yet.
                        // We show a loading toast for now.
                        const tid = toast.loading("Uploading file...");
                        try {
                          await onFileUpload(row.original.id, field.id, file);
                          toast.success("File uploaded", { id: tid });
                        } catch (error) {
                          console.error("Upload failed", error);
                          toast.error("Upload failed", { id: tid });
                        }
                      }
                    }}
                  />
                  <div className="text-[10px] text-muted-foreground italic text-center">
                    Files larger than 5MB will be compressed
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          );
        }

        return (
          <div className="min-h-[24px] flex items-center transition-colors group/cell relative">
            <FieldRenderer
              type={field.type}
              value={value}
              definition={field}
              isCompact
            />
            {!["created_at", "updated_at"].includes(field.type) && (
              <Input
                key={String(value ?? "")}
                defaultValue={String(value ?? "")}
                onBlur={(e) => {
                  const newVal = e.target.value;
                  if (onUpdateCustomField && newVal !== String(value ?? "")) {
                    updateLocalTaskField(row.original.id, field.id, newVal);
                    onUpdateCustomField(row.original.id, field.id, newVal);
                  }
                }}
                className="absolute inset-0 opacity-0 focus:opacity-100 h-full border-none bg-background focus:ring-0 p-1 text-sm transition-opacity"
              />
            )}
          </div>
        );
      },
    }));

    return [...staticCols, ...dynamicCols];
  }, [
    customFields,
    onTaskClick,
    onUpdateCustomField,
    onUpdateTask,
    onFileUpload,
    projectMembers,
    updateLocalTaskField,
  ]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: localTasks,
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
                  className="hover:bg-muted/30 transition-colors border-b last:border-b-0 group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-1 px-4 border-r last:border-r-0 h-10"
                    >
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
