"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Clock, Play, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { Task } from "@/types/project";
import { cn } from "@/lib/utils";

interface TaskSheetHeaderProps {
  task: Task;
  isTimerRunning: boolean;
  isTogglingTimer: boolean;
  isCompleting: boolean;
  onToggleTimer: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

export function TaskSheetHeader({
  task,
  isTimerRunning,
  isTogglingTimer,
  isCompleting,
  onToggleTimer,
  onComplete,
  onDelete,
}: TaskSheetHeaderProps) {
  return (
    <div className="flex items-center justify-between px-8 py-4 border-b/50">
      <div className="flex items-center gap-4">
        <Badge
          variant="outline"
          className="font-mono text-[10px] py-0 h-5 px-1.5 opacity-60"
        >
          {task.task_number}
        </Badge>
        <div className="h-4 w-[1px] bg-border/50" />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2 text-xs gap-2 font-medium transition-all text-muted-foreground hover:text-foreground",
              isTimerRunning &&
                "text-destructive bg-destructive/10 hover:bg-destructive/20"
            )}
            onClick={onToggleTimer}
            disabled={isTogglingTimer}
          >
            {isTogglingTimer ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isTimerRunning ? (
              <Clock className="h-3.5 w-3.5 animate-pulse" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {isTimerRunning ? "Stop Timer" : "Track Time"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs gap-2 text-muted-foreground hover:text-foreground"
          onClick={onComplete}
          disabled={isCompleting || task.status === "done"}
        >
          <CheckCircle2
            className={cn(
              "h-4 w-4",
              task.status === "done" && "text-green-500"
            )}
          />
          {task.status === "done" ? "Done" : "Mark Done"}
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{task.title}&quot;. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
