"use client";

import * as React from "react";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskList, Task } from "@/types/project";
import { KanbanTask } from "@/components/projects/kanban/KanbanTask";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  list: TaskList;
  onAddTask: (listId: string | number) => void;
  onTaskClick: (task: Task) => void;
}

export function KanbanColumn({
  list,
  onAddTask,
  onTaskClick,
}: KanbanColumnProps) {
  const tasks = list.tasks || [];

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `col-${list.id}`,
    data: {
      type: "Column",
      list,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col w-[320px] max-h-full bg-sidebar-accent/30 rounded-xl border border-sidebar-border/50 flex-shrink-0 group overflow-hidden transition-colors",
        isDragging &&
          "opacity-50 border-sidebar-primary/50 bg-sidebar-accent/50"
      )}
    >
      {/* Column Header */}
      <div
        {...attributes}
        {...listeners}
        className="p-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-sidebar-accent/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          {list.color && (
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: list.color }}
            />
          )}
          <h3 className="font-semibold text-sm tracking-tight text-foreground/90">
            {list.name}
          </h3>
          <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3 min-h-[100px]">
        <SortableContext
          items={tasks.map((t) => `task-${t.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanTask
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>
      </div>

      {/* Column Footer */}
      <div className="p-3 pt-0">
        <Button
          variant="secondary"
          className="w-full justify-start gap-2 h-9 bg-background/40 hover:bg-background/80 text-muted-foreground border-none shadow-none"
          onClick={() => onAddTask(list.id)}
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>
    </div>
  );
}
