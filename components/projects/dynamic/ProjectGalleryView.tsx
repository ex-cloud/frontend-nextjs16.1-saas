"use client";

import * as React from "react";
import { Task } from "@/types/project";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import Image from "next/image";

interface ProjectGalleryViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  className?: string;
}

export function ProjectGalleryView({
  tasks,
  onTaskClick,
  className,
}: ProjectGalleryViewProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {tasks.map((task) => {
        // Try to find an image for the cover
        const coverImage =
          task.custom_values &&
          Object.values(task.custom_values).find((val) => {
            if (Array.isArray(val)) {
              const first = val[0];
              const url =
                typeof first === "string"
                  ? first
                  : (first as Record<string, unknown>)?.url;
              return (
                typeof url === "string" &&
                /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url)
              );
            }
            return false;
          });

        const imageUrl = (
          coverImage && Array.isArray(coverImage)
            ? typeof coverImage[0] === "string"
              ? coverImage[0]
              : (coverImage[0] as Record<string, unknown>)?.url
            : null
        ) as string | null;

        return (
          <div
            key={task.id}
            onClick={() => onTaskClick?.(task)}
            className="group flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm hover:ring-1 hover:ring-primary/20 hover:border-primary/30 transition-all cursor-pointer"
          >
            {/* Card Cover */}
            <div className="h-32 w-full bg-muted relative overflow-hidden">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={task.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary/10 select-none">
                    {task.task_number}
                  </span>
                </div>
              )}
              <div className="absolute top-2 left-2">
                <Badge
                  variant="outline"
                  className="bg-background/80 backdrop-blur-sm text-[10px] font-mono border-none shadow-sm"
                >
                  {task.task_number}
                </Badge>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 space-y-3 flex-1 flex flex-col">
              <h4 className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {task.title}
              </h4>

              <div className="flex items-center gap-2 mt-auto">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[9px] h-4 px-1 capitalize",
                    task.priority === "high" || task.priority === "urgent"
                      ? "bg-red-500/10 text-red-600"
                      : ""
                  )}
                >
                  {task.priority}
                </Badge>
                <div className="flex-1" />
                {task.assignee && (
                  <Avatar className="h-5 w-5 border border-background">
                    <AvatarImage src={task.assignee.avatar_url || ""} />
                    <AvatarFallback className="text-[8px]">
                      {task.assignee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              {task.due_date && (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
