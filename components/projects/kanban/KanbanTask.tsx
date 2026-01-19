"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/project";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanTaskProps {
  task: Task;
  isOverlay?: boolean;
  onClick?: () => void;
}

const priorityColors = {
  low: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  high: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  urgent: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

export function KanbanTask({ task, isOverlay, onClick }: KanbanTaskProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `task-${task.id}`,
    disabled: isOverlay,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const priorityLabel =
    task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (isDragging || isOverlay) return;
        onClick?.();
      }}
      className={cn(
        "cursor-grab active:cursor-grabbing border-sidebar-border/40 hover:border-sidebar-primary/40 hover:shadow-md transition-all group/task bg-card select-none",
        isDragging && "opacity-20",
        isOverlay && "shadow-xl border-sidebar-primary/50 rotate-3"
      )}
    >
      <CardContent className="p-3 space-y-3">
        {/* Task Header */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-1.5 py-0.5 rounded">
            {task.task_number}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-4.5 px-1.5 font-semibold",
              priorityColors[task.priority]
            )}
          >
            {priorityLabel}
          </Badge>
        </div>

        {/* Task Title */}
        <h4 className="text-sm font-medium leading-tight group-hover/task:text-sidebar-primary transition-colors line-clamp-2">
          {task.title}
        </h4>

        {/* Task Footer Info */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            {task.due_date && (
              <div className="flex items-center gap-1 text-[10px] font-medium">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(task.due_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            {/* Mock stats */}
            <div className="flex items-center gap-1 text-[10px]">
              <MessageSquare className="h-3 w-3" />
              <span>3</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {task.assignee ? (
              <Avatar className="h-5 w-5 border border-background">
                <AvatarImage
                  src={
                    task.assignee.avatar_url ||
                    `https://avatar.vercel.sh/${task.assignee_id}.png`
                  }
                />
                <AvatarFallback className="text-[8px]">
                  {task.assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-5 w-5 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground/40">
                <Clock className="h-2.5 w-2.5" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
