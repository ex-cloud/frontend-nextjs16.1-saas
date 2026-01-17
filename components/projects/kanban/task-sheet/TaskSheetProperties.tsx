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
  Image as ImageIcon,
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
} from "@/types/project";
import { cn } from "@/lib/utils";
import { AdvancedDatePicker } from "../../dynamic/AdvancedDatePicker";
import { evaluateFormula } from "@/lib/utils/formula-evaluator";
import { Input } from "@/components/ui/input";

interface TaskSheetPropertiesProps {
  task: Task;
  projectMembers: ProjectMember[];
  customFieldDefinitions?: CustomFieldDefinition[];
  onUpdate: (field: keyof Task, value: unknown) => void;
  onUpdateCustomField: (fieldId: string | number, value: unknown) => void;
  onFileUpload: (defId: string | number, file: File) => void;
  onRemoveFile: (defId: string | number, index: number) => void;
  isLoading?: boolean;
}

export function TaskSheetProperties({
  task,
  projectMembers,
  customFieldDefinitions,
  onUpdate,
  onUpdateCustomField,
  onFileUpload,
  onRemoveFile,
  isLoading,
}: TaskSheetPropertiesProps) {
  return (
    <div className="space-y-1.5 -ml-1">
      {/* Assignee Property */}
      <div className="grid grid-cols-[140px_1fr] items-center group/prop min-h-[32px] hover:bg-muted/10 rounded px-1 transition-colors">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Avatar className="h-4 w-4 grayscale opacity-70">
            <AvatarFallback className="text-[8px]">A</AvatarFallback>
          </Avatar>
          <span>Assignee</span>
        </div>
        <div className="flex items-center">
          <Select
            value={String(task.assignee_id || "unassigned")}
            onValueChange={(val) =>
              onUpdate("assignee_id", val === "unassigned" ? null : val)
            }
          >
            <SelectTrigger className="h-7 border-none bg-transparent hover:bg-muted/10 transition-colors p-1 w-auto min-w-[100px] shadow-none focus:ring-0">
              <div className="flex items-center gap-2">
                {task.assignee ? (
                  <>
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={`https://avatar.vercel.sh/${task.assignee.id}.png`}
                      />
                      <AvatarFallback>{task.assignee.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{task.assignee.name}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground/50 italic">
                    Unassigned
                  </span>
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {projectMembers.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.user?.name || "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <SelectContent>
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
                      hasTime ? "MMMM d, yyyy HH:mm" : "MMMM d, yyyy"
                    );
                  })()
                ) : (
                  <span className="text-muted-foreground/40 italic">Empty</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
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
        let value = task.custom_values?.[String(def.id)];
        if (def.type === "formula") {
          const formula = (def.options as CustomFieldOptions)?.formula || "";
          value = evaluateFormula(formula, task);
        }

        const options = (def.options as CustomFieldOptions)?.options || [];

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
                          const d = new Date(String(value));
                          if (!isValid(d)) return <span>Invalid Date</span>;
                          const hasTime =
                            String(value).includes(" ") ||
                            String(value).includes("T");
                          return format(
                            d,
                            hasTime ? "MMMM d, yyyy HH:mm" : "MMMM d, yyyy"
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground/40 italic">
                          Empty
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <AdvancedDatePicker
                      selected={value as string}
                      onSelect={(date) => onUpdateCustomField(def.id, date)}
                    />
                  </PopoverContent>
                </Popover>
              ) : def.type === "select" ? (
                <Select
                  value={String(value || "")}
                  onValueChange={(val) => onUpdateCustomField(def.id, val)}
                >
                  <SelectTrigger className="h-7 border-none bg-transparent hover:bg-muted/10 transition-colors p-1 w-auto min-w-[100px] shadow-none focus:ring-0">
                    <SelectValue placeholder="Empty" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt) => (
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
                      className="h-7 px-1 text-sm font-normal gap-1 hover:bg-muted/10"
                    >
                      {Array.isArray(value) && value.length > 0 ? (
                        value.map((v, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="px-1 py-0 h-5 text-[10px]"
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
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-2">
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
                              onUpdateCustomField(def.id, next);
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
              ) : def.type === "checkbox" ? (
                <div className="px-1">
                  <Checkbox
                    checked={value === true || value === "true" || value === 1}
                    onCheckedChange={(checked) =>
                      onUpdateCustomField(def.id, !!checked)
                    }
                  />
                </div>
              ) : def.type === "files" ? (
                <div className="flex flex-col gap-1 w-full p-1">
                  <div className="flex flex-wrap gap-1.5">
                    {((value as CustomFieldFile[]) || []).map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md border text-[10px] group/file relative"
                      >
                        {/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.url) ? (
                          <ImageIcon className="h-3 w-3 text-blue-500" />
                        ) : (
                          <FileIcon className="h-3 w-3 text-slate-500" />
                        )}
                        <span className="truncate max-w-[100px]">
                          {file.name}
                        </span>
                        <button
                          onClick={() => onRemoveFile(def.id, i)}
                          className="opacity-0 group-hover/file:opacity-100 hover:text-destructive transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[10px] gap-1 border border-dashed"
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
                      onClick={() => onUpdateCustomField(def.id, s)}
                      className="group/star"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4 transition-all",
                          s <= Number(value || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30 hover:text-yellow-400/50"
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
                      onUpdateCustomField(def.id, Number(e.target.value))
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
                <div className="flex items-center gap-2 w-full px-1">
                  {def.type === "url" && (
                    <LinkIcon className="h-3 w-3 text-muted-foreground" />
                  )}
                  {def.type === "email" && (
                    <Mail className="h-3 w-3 text-muted-foreground" />
                  )}
                  {def.type === "phone" && (
                    <Phone className="h-3 w-3 text-muted-foreground" />
                  )}
                  <Input
                    value={String(value ?? "")}
                    onChange={() => {}} // Controlled via onBlur
                    onBlur={(e) => onUpdateCustomField(def.id, e.target.value)}
                    className="h-7 border-none bg-transparent hover:bg-muted/10 focus-visible:ring-0 p-0 transition-colors text-sm shadow-none"
                    placeholder="Empty"
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Add a property Button */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 h-8 px-2 text-muted-foreground hover:text-foreground text-sm gap-2"
      >
        <PlusIcon className="h-4 w-4" />
        Add a property
      </Button>
    </div>
  );
}
