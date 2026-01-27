"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  isEditing: boolean;
  className?: string;
}

export function SortableItem({
  id,
  children,
  isEditing,
  className,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    zIndex: isDragging ? 50 : undefined,
    position: "relative",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group/sortable",
        isEditing && "hover:ring-2 hover:ring-primary/20 rounded-xl",
        isDragging && "opacity-50 ring-2 ring-primary scale-105 shadow-xl z-50",
        className,
      )}
    >
      {/* Drag Handle - Only visible in Edit Mode */}
      {isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-10 p-1.5 bg-background/80 backdrop-blur-sm rounded-md shadow-sm border border-border/50 cursor-grab opacity-0 group-hover/sortable:opacity-100 transition-opacity hover:bg-accent"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Overlay to prevent interactions with content while editing */}
      {isEditing && <div className="absolute inset-0 z-0 bg-transparent" />}

      {children}
    </div>
  );
}
