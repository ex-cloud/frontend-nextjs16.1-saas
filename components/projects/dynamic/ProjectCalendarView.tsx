"use client";

import * as React from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task, CustomFieldDefinition } from "@/types/project";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ProjectCalendarViewProps {
  tasks: Task[];
  customFields: CustomFieldDefinition[];
  onTaskClick?: (task: Task) => void;
  className?: string;
}

export function ProjectCalendarView({
  tasks,
  onTaskClick,
  className,
}: ProjectCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const tasksByDay = React.useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (task.due_date) {
        const date = format(parseISO(task.due_date), "yyyy-MM-dd");
        if (!map[date]) map[date] = [];
        map[date].push(task);
      }
    });
    return map;
  }, [tasks]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card rounded-md border shadow-sm",
        className
      )}
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold capitalize">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 border-b bg-muted/20">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 divide-x divide-y auto-rows-fr min-h-[500px]">
        {days.map((day, idx) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={idx}
              className={cn(
                "p-2 min-h-[100px] transition-colors hover:bg-muted/10",
                !isCurrentMonth && "bg-muted/5 opacity-50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full",
                    isToday(day)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
                  </span>
                )}
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className="group cursor-pointer p-1.5 rounded bg-muted/50 border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-1.5 w-1.5 p-0 rounded-full",
                          task.status === "completed"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        )}
                      />
                      <span className="text-[10px] font-mono text-muted-foreground/60">
                        {task.task_number}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium truncate leading-none">
                      {task.title}
                    </p>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1 pt-1 italic">
                    <MoreHorizontal className="h-3 w-3" />
                    and {dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
