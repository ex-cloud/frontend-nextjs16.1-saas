"use client";

import * as React from "react";
import { Task, CustomFieldDefinition } from "@/types/project";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DynamicBoardViewProps {
  tasks: Task[];
  customFields: CustomFieldDefinition[];
  groupFieldId?: string | number;
  onTaskClick?: (task: Task) => void;
  className?: string;
}

interface Column {
  id: string | number;
  title: string;
  tasks: Task[];
}

export function DynamicBoardView({
  tasks,
  customFields,
  groupFieldId,
  onTaskClick,
  className,
}: DynamicBoardViewProps) {
  const groupField = React.useMemo(() => {
    if (!groupFieldId) return null;
    return customFields.find(
      (f: CustomFieldDefinition) =>
        f.id === groupFieldId || `custom_${f.id}` === groupFieldId
    );
  }, [customFields, groupFieldId]);

  const columns = React.useMemo<Column[]>(() => {
    if (!groupField || !Array.isArray(groupField.options)) {
      // Default to grouping by status
      const statuses = [
        "planning",
        "active",
        "on_hold",
        "completed",
        "archived",
      ];
      return statuses.map((s) => ({
        id: s,
        title: s.replace("_", " "),
        tasks: tasks.filter((t: Task) => t.status === s),
      }));
    }

    const options = (groupField.options as unknown[]) || [];
    return options.map((opt) => {
      const isObj = typeof opt === "object" && opt !== null;
      const value = isObj ? (opt as { value: string | number }).value : opt;
      const label = isObj ? (opt as { label: string }).label : String(opt);

      return {
        id: String(value),
        title: String(label),
        tasks: tasks.filter((t: Task) => {
          const val = t.custom_values?.[String(groupField.id)];
          return String(val) === String(value);
        }),
      };
    });
  }, [tasks, groupField]);

  return (
    <div
      className={cn(
        "flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-muted-foreground/20",
        className
      )}
    >
      {columns.map((column: Column) => (
        <div key={column.id} className="flex flex-col w-[300px] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm capitalize">
                {column.title}
              </h3>
              <Badge
                variant="secondary"
                className="px-1.5 py-0 h-5 min-w-[20px] justify-center text-[10px]"
              >
                {column.tasks.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-3 p-1 rounded-lg bg-muted/30 min-h-[200px]">
            {column.tasks.map((task: Task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                className="group p-4 rounded-xl bg-card border shadow-sm hover:ring-1 hover:ring-primary/20 hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono opacity-60"
                  >
                    {task.task_number}
                  </Badge>
                  <div className="flex -space-x-2">
                    {task.assignee && (
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={task.assignee.avatar_url || ""} />
                        <AvatarFallback className="text-[10px]">
                          {task.assignee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-medium leading-tight mb-3 group-hover:text-primary transition-colors">
                  {task.title}
                </h4>

                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] capitalize",
                      task.priority === "high" || task.priority === "urgent"
                        ? "bg-red-500/10 text-red-600 border-red-200"
                        : ""
                    )}
                  >
                    {task.priority}
                  </Badge>
                  {task.due_date && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-9 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs">Add Task</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
