"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Clock,
  Calendar as CalendarIcon,
  Paperclip,
  Link as LinkIcon,
  Mail,
  Phone,
  CheckSquare,
  X,
  ListFilter,
  Tags,
  Calculator,
  File as FileIcon,
  Star,
  Activity,
  Plus as PlusIcon,
  History,
  Loader2,
} from "lucide-react";
import { format, isValid } from "date-fns";
import {
  Task,
  ProjectMember,
  CustomFieldDefinition,
  CustomFieldOptions,
  CustomFieldFile,
  CustomFieldType,
} from "@/types/project";
import { cn } from "@/lib/utils";
import { AdvancedDatePicker } from "../../dynamic/AdvancedDatePicker";
import { evaluateFormula } from "@/lib/utils/formula-evaluator";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";

interface TaskSheetPropertiesProps {
  task: Task;
  projectMembers: ProjectMember[];
  customFieldDefinitions?: CustomFieldDefinition[];
  onUpdate: (field: keyof Task, value: unknown) => void;
  onUpdateCustomField: (fieldId: string | number, value: unknown) => void;
  onFileUpload: (defId: string | number, file: File) => void;
  onRemoveFile: (defId: string | number, index: number) => void;
  onAddProperty?: (type: CustomFieldType) => void;
  isLoading?: boolean;
}

function PropertyInput({
  value,
  onUpdate,
  placeholder,
  className,
  type = "text",
  icon,
}: {
  value: string;
  onUpdate: (val: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  icon?: React.ReactNode;
}) {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="flex items-center gap-2 w-full px-1">
      {icon}
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          if (localValue !== value) {
            onUpdate(localValue);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        className={cn(
          "h-7 border-none bg-transparent hover:bg-muted/10 focus-visible:ring-0 p-0 transition-colors text-sm shadow-none",
          className,
        )}
        placeholder={placeholder}
        type={type}
      />
    </div>
  );
}

export function TaskSheetProperties({
  task,
  projectMembers,
  customFieldDefinitions,
  onUpdate,
  onUpdateCustomField,
  onFileUpload,
  onRemoveFile,
  onAddProperty,
  isLoading,
}: TaskSheetPropertiesProps) {
  const [previewFile, setPreviewFile] = React.useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);

  // Responsive state for custom fields to avoid persistence lag
  const [localCustomValues, setLocalCustomValues] = React.useState(
    task.custom_values || {},
  );

  React.useEffect(() => {
    setLocalCustomValues(task.custom_values || {});
  }, [task.custom_values]);

  const handleCustomFieldUpdate = (
    fieldId: string | number,
    value: unknown,
  ) => {
    setLocalCustomValues((prev) => ({ ...prev, [String(fieldId)]: value }));
    onUpdateCustomField(fieldId, value);
  };

  const propertyTypes: {
    type: CustomFieldType;
    icon: React.ReactNode;
    label: string;
  }[] = [
    { type: "text", icon: <ListFilter className="h-4 w-4" />, label: "Text" },
    {
      type: "number",
      icon: <Calculator className="h-4 w-4" />,
      label: "Number",
    },
    { type: "date", icon: <CalendarIcon className="h-4 w-4" />, label: "Date" },
    {
      type: "checkbox",
      icon: <CheckSquare className="h-4 w-4" />,
      label: "Checkbox",
    },
    {
      type: "select",
      icon: <ListFilter className="h-4 w-4" />,
      label: "Select",
    },
    {
      type: "multi_select",
      icon: <Tags className="h-4 w-4" />,
      label: "Multi Select",
    },
    { type: "files", icon: <Paperclip className="h-4 w-4" />, label: "Files" },
    { type: "rating", icon: <Star className="h-4 w-4" />, label: "Rating" },
    {
      type: "progress",
      icon: <Activity className="h-4 w-4" />,
      label: "Progress",
    },
    { type: "url", icon: <LinkIcon className="h-4 w-4" />, label: "URL" },
    { type: "email", icon: <Mail className="h-4 w-4" />, label: "Email" },
    { type: "phone", icon: <Phone className="h-4 w-4" />, label: "Phone" },
    {
      type: "formula",
      icon: <Calculator className="h-4 w-4" />,
      label: "Formula",
    },
  ];

  return (
    <div className="space-y-1.5 -ml-1">
      {/* Assignees Property (Multi-User) */}
      <div className="grid grid-cols-[140px_1fr] items-center group/prop min-h-[32px] hover:bg-muted/10 rounded px-1 transition-colors">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Avatar className="h-4 w-4 grayscale opacity-70">
            <AvatarFallback className="text-[8px]">A</AvatarFallback>
          </Avatar>
          <span>Assignees</span>
        </div>
        <div className="flex items-center min-w-0">
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex flex-wrap gap-1 items-center py-1 cursor-pointer w-full min-h-[28px]">
                {task.assignees && task.assignees.length > 0 ? (
                  task.assignees.map((a) => (
                    <Badge
                      key={a.id}
                      variant="secondary"
                      className="gap-1 px-1.5 py-0 h-5 text-[10px] flex-shrink-0"
                    >
                      {a.name}
                      <X
                        className="h-3 w-3 hover:text-destructive transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextIds = task.assignees
                            ?.filter((u) => u.id !== a.id)
                            .map((u) => u.id);
                          onUpdate("assignee_ids", nextIds);
                        }}
                      />
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground/40 italic px-1">
                    Unassigned
                  </span>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 z-[100]" align="start">
              <div className="space-y-1 max-h-60 overflow-y-auto">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b mb-1">
                  Project Members
                </div>
                {projectMembers.map((m) => {
                  const uId = m.user?.id || m.id;
                  const isAssigned = task.assignees?.some((u) => u.id === uId);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer transition-colors"
                      onClick={() => {
                        const currentIds =
                          task.assignees?.map((u) => u.id) || [];
                        const nextIds = isAssigned
                          ? currentIds.filter((id) => id !== uId)
                          : [...currentIds, uId];
                        onUpdate("assignee_ids", nextIds);
                      }}
                    >
                      <Checkbox
                        checked={isAssigned}
                        className="pointer-events-none"
                      />
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <Avatar className="h-5 w-5 flex-shrink-0">
                          <AvatarImage src={m.user?.avatar_url} />
                          <AvatarFallback className="text-[10px]">
                            {m.user?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">
                          {m.user?.name || "Unknown"}
                        </span>
                        {m.is_team_assignment && (
                          <Badge
                            variant="outline"
                            className="text-[8px] px-1 py-0 h-3 bg-muted/30"
                          >
                            Team
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                {projectMembers.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No members added to this project.
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Status Property */}
      <div className="grid grid-cols-[140px_1fr] items-center group/prop min-h-[32px] hover:bg-muted/10 rounded px-1 transition-colors">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Clock className="h-4 w-4 opacity-70" />
          <span>Status</span>
        </div>
        <div className="flex items-center">
          <Select
            value={task.status || "todo"}
            onValueChange={(val) => onUpdate("status", val)}
          >
            <SelectTrigger className="h-7 border-none bg-transparent hover:bg-muted/10 transition-colors p-1 w-auto min-w-[100px] shadow-none focus:ring-0">
              <Badge
                variant="secondary"
                className="capitalize text-xs font-medium border-none bg-blue-100/50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
              >
                {(task.status || "To Do").replace("_", " ")}
              </Badge>
            </SelectTrigger>
            <SelectContent
              className="z-[100]"
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Due Date Property */}
      <div className="grid grid-cols-[140px_1fr] items-center group/prop min-h-[32px] hover:bg-muted/10 rounded px-1 transition-colors">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <CalendarIcon className="h-4 w-4 opacity-70" />
          <span>Due Date</span>
        </div>
        <div className="flex items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-1 text-sm font-normal hover:bg-muted/10 transition-colors"
              >
                {task.due_date ? (
                  (() => {
                    const d = new Date(task.due_date);
                    if (!isValid(d)) return <span>Invalid Date</span>;
                    const hasTime =
                      String(task.due_date).includes(" ") ||
                      String(task.due_date).includes("T");
                    return format(
                      d,
                      hasTime ? "MMMM d, yyyy HH:mm" : "MMMM d, yyyy",
                    );
                  })()
                ) : (
                  <span className="text-muted-foreground/40 italic">Empty</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 z-[100]"
              align="start"
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              <AdvancedDatePicker
                selected={task.due_date}
                onSelect={(date) => onUpdate("due_date", date)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Custom Fields Properties */}
      {customFieldDefinitions?.map((def) => {
        let value = localCustomValues[String(def.id)];
        if (def.type === "formula") {
          const formula = (def.options as CustomFieldOptions)?.formula || "";
          value = evaluateFormula(formula, task);
        }

        const optionsData = def.options as CustomFieldOptions;
        const options = Array.isArray(optionsData?.options)
          ? optionsData.options
          : typeof optionsData?.options === "string"
            ? JSON.parse(optionsData.options)
            : [];

        return (
          <div
            key={def.id}
            className="grid grid-cols-[140px_1fr] items-center group/prop min-h-[32px] hover:bg-muted/10 rounded px-1 transition-colors"
          >
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              {def.type === "date" ? (
                <CalendarIcon className="h-4 w-4 opacity-70" />
              ) : def.type === "select" ? (
                <ListFilter className="h-4 w-4 opacity-70" />
              ) : def.type === "multi_select" ? (
                <Tags className="h-4 w-4 opacity-70" />
              ) : def.type === "files" ? (
                <Paperclip className="h-4 w-4 opacity-70" />
              ) : def.type === "checkbox" ? (
                <CheckSquare className="h-4 w-4 opacity-70" />
              ) : def.type === "url" ? (
                <LinkIcon className="h-4 w-4 opacity-70" />
              ) : def.type === "email" ? (
                <Mail className="h-4 w-4 opacity-70" />
              ) : def.type === "phone" ? (
                <Phone className="h-4 w-4 opacity-70" />
              ) : def.type === "formula" ? (
                <Calculator className="h-4 w-4 opacity-70" />
              ) : def.type === "created_at" ? (
                <Clock className="h-4 w-4 opacity-70" />
              ) : def.type === "updated_at" ? (
                <History className="h-4 w-4 opacity-70" />
              ) : def.type === "rating" ? (
                <Star className="h-4 w-4 opacity-70" />
              ) : def.type === "progress" ? (
                <Activity className="h-4 w-4 opacity-70" />
              ) : (
                <History className="h-4 w-4 opacity-70" />
              )}
              <span>{def.name}</span>
            </div>
            <div className="flex items-center">
              {def.type === "date" ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-1 text-sm font-normal"
                    >
                      {value ? (
                        (() => {
                          const dateStr = String(value);
                          if (dateStr.includes(" -> ")) {
                            const [startSub, endSub] = dateStr.split(" -> ");
                            const startObj = new Date(startSub);
                            const endObj = new Date(endSub);
                            if (isValid(startObj) && isValid(endObj)) {
                              return (
                                <span>
                                  {format(startObj, "MMM d")} →{" "}
                                  {format(endObj, "MMM d")}
                                </span>
                              );
                            }
                          }
                          const d = new Date(dateStr);
                          if (!isValid(d)) return <span>Invalid Date</span>;
                          const hasTime =
                            dateStr.includes(" ") || dateStr.includes("T");
                          return format(
                            d,
                            hasTime ? "MMMM d, yyyy HH:mm" : "MMMM d, yyyy",
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground/40 italic">
                          Empty
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 z-[100]"
                    align="start"
                    onPointerDownOutside={(e) => e.preventDefault()}
                  >
                    <AdvancedDatePicker
                      selected={value as string}
                      onSelect={(date) => handleCustomFieldUpdate(def.id, date)}
                    />
                  </PopoverContent>
                </Popover>
              ) : def.type === "select" ? (
                <Select
                  value={String(value || "")}
                  onValueChange={(val) => handleCustomFieldUpdate(def.id, val)}
                >
                  <SelectTrigger className="h-7 border-none bg-transparent hover:bg-muted/10 transition-colors p-1 w-auto min-w-[100px] shadow-none focus:ring-0">
                    <SelectValue placeholder="Empty" />
                  </SelectTrigger>
                  <SelectContent
                    className="z-[100]"
                    onPointerDownOutside={(e) => e.preventDefault()}
                  >
                    {options.map((opt: string) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : def.type === "multi_select" ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-1 text-sm font-normal gap-1 hover:bg-muted/10 overflow-hidden max-w-full"
                    >
                      {Array.isArray(value) && value.length > 0 ? (
                        value.map((v, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="px-1 py-0 h-5 text-[10px] flex-shrink-0"
                          >
                            {String(v)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground/40 italic">
                          Empty
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-64 p-2 z-[100]"
                    align="start"
                    onPointerDownOutside={(e) => e.preventDefault()}
                  >
                    <div className="space-y-1">
                      {options.map((opt: string) => {
                        const current = Array.isArray(value) ? value : [];
                        const isChecked = current.includes(opt);
                        return (
                          <div
                            key={opt}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer"
                            onClick={() => {
                              const next = isChecked
                                ? current.filter((c) => c !== opt)
                                : [...current, opt];
                              handleCustomFieldUpdate(def.id, next);
                            }}
                          >
                            <Checkbox
                              checked={isChecked}
                              className="pointer-events-none"
                            />
                            <span className="text-sm">{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : def.type === "checkbox" ? (
                <div className="px-1">
                  <Checkbox
                    checked={value === true || value === "true" || value === 1}
                    onCheckedChange={(checked) =>
                      handleCustomFieldUpdate(def.id, !!checked)
                    }
                  />
                </div>
              ) : def.type === "files" ? (
                <div className="flex flex-col gap-1 w-full p-1">
                  <div className="flex flex-wrap gap-1.5">
                    {((value as (string | CustomFieldFile)[]) || []).map(
                      (file, i) => {
                        const fileUrl =
                          typeof file === "string" ? file : file?.url || "";
                        const fileName =
                          typeof file === "string"
                            ? file.split("/").pop()
                            : file?.name || "File";
                        const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(
                          fileUrl,
                        );
                        const isPdf = /\.pdf$/i.test(fileUrl);
                        const isWord = /\.(doc|docx)$/i.test(fileUrl);
                        const isExcel = /\.(xls|xlsx|csv)$/i.test(fileUrl);
                        const isPpt = /\.(ppt|pptx)$/i.test(fileUrl);
                        const isZip = /\.(zip|rar|7z)$/i.test(fileUrl);

                        return (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md border text-[10px] group/file relative cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isImage) {
                                setPreviewFile({
                                  url: fileUrl,
                                  name: fileName || "File",
                                  type: "image",
                                });
                              } else {
                                window.open(fileUrl, "_blank");
                              }
                            }}
                          >
                            {isImage ? (
                              <Image
                                src={fileUrl}
                                alt={fileName || "File"}
                                width={16}
                                height={16}
                                className="h-4 w-4 object-cover rounded-sm"
                                unoptimized
                              />
                            ) : isPdf ? (
                              <span className="text-[8px] font-bold text-red-500">
                                PDF
                              </span>
                            ) : isWord ? (
                              <span className="text-[8px] font-bold text-blue-500">
                                DOC
                              </span>
                            ) : isExcel ? (
                              <span className="text-[8px] font-bold text-green-500">
                                XLS
                              </span>
                            ) : isPpt ? (
                              <span className="text-[8px] font-bold text-orange-500">
                                PPT
                              </span>
                            ) : isZip ? (
                              <span className="text-[8px] font-bold text-yellow-500">
                                ZIP
                              </span>
                            ) : (
                              <FileIcon className="h-3 w-3 text-slate-500" />
                            )}
                            <span className="truncate max-w-[100px]">
                              {fileName}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveFile(def.id, i);
                              }}
                              className="opacity-0 group-hover/file:opacity-100 hover:text-destructive transition-opacity ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      },
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[10px] gap-1 border border-dashed hover:border-primary/50 hover:bg-primary/5"
                      onClick={() =>
                        document
                          .getElementById(`file-upload-${def.id}`)
                          ?.click()
                      }
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <PlusIcon className="h-3 w-3" />
                      )}
                      Add File
                    </Button>
                    <input
                      id={`file-upload-${def.id}`}
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        onFileUpload(def.id, e.target.files[0])
                      }
                    />
                  </div>
                </div>
              ) : def.type === "rating" ? (
                <div className="flex items-center gap-1 px-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleCustomFieldUpdate(def.id, s)}
                      className="group/star"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4 transition-all",
                          s <= Number(value || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30 hover:text-yellow-400/50",
                        )}
                      />
                    </button>
                  ))}
                </div>
              ) : def.type === "progress" ? (
                <div className="flex items-center gap-3 w-full px-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={Number(value || 0)}
                    onChange={(e) =>
                      handleCustomFieldUpdate(def.id, Number(e.target.value))
                    }
                    className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-xs text-muted-foreground w-8 font-mono">
                    {Number(value || 0)}%
                  </span>
                </div>
              ) : def.type === "formula" ||
                def.type === "created_at" ||
                def.type === "updated_at" ? (
                <span className="px-1 text-sm font-medium text-primary">
                  {def.type === "formula"
                    ? typeof value === "string" || typeof value === "number"
                      ? value
                      : "-"
                    : value && isValid(new Date(String(value)))
                      ? format(new Date(String(value)), "PPP HH:mm")
                      : "-"}
                </span>
              ) : (
                <PropertyInput
                  value={String(value ?? "")}
                  onUpdate={(val) => handleCustomFieldUpdate(def.id, val)}
                  placeholder="Empty"
                  icon={
                    def.type === "url" ? (
                      <LinkIcon className="h-3 w-3 text-muted-foreground" />
                    ) : def.type === "email" ? (
                      <Mail className="h-3 w-3 text-muted-foreground" />
                    ) : def.type === "phone" ? (
                      <Phone className="h-3 w-3 text-muted-foreground" />
                    ) : null
                  }
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Add a property Button */}
      {onAddProperty ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-8 px-2 text-muted-foreground hover:text-foreground text-sm gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add a property
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 bg-white dark:bg-zinc-950 border shadow-lg z-[9999]"
          >
            {propertyTypes.map((type) => (
              <DropdownMenuItem
                key={type.label}
                onClick={() => onAddProperty(type.type)}
                className="gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {type.icon}
                <span>{type.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {/* Preview Dialog */}
      <Dialog
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      >
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none text-white sm:max-w-screen-lg">
          <DialogTitle className="sr-only">
            Preview {previewFile?.name}
          </DialogTitle>
          <div className="relative flex flex-col items-center justify-center w-full h-full">
            {previewFile?.type === "image" && (
              <Image
                src={previewFile.url}
                alt={previewFile.name}
                width={1200}
                height={800}
                className="max-h-[85vh] w-auto object-contain rounded-md shadow-2xl"
                unoptimized
              />
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-white/90">
              {previewFile?.name}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
