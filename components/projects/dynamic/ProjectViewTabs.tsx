"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  List,
  Calendar,
  Image as ImageIcon,
  Plus,
  MoreHorizontal,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectView, ProjectViewType } from "@/types/project";

interface ProjectViewTabsProps {
  views: ProjectView[];
  activeViewId: string | number;
  onViewChange: (viewId: string | number) => void;
  onAddView?: () => void;
  onSave?: (viewId: string | number) => void;
  className?: string;
}

const viewIcons: Record<ProjectViewType, React.ReactNode> = {
  table: <List className="h-4 w-4" />,
  board: <LayoutGrid className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  gallery: <ImageIcon className="h-4 w-4" />,
};

export function ProjectViewTabs({
  views,
  activeViewId,
  onViewChange,
  onAddView,
  onSave,
  className,
}: ProjectViewTabsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b pb-1 gap-2 overflow-x-auto scrollbar-none",
        className
      )}
    >
      <div className="flex items-center gap-1">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors border-b-2 -mb-[6px]",
              activeViewId === view.id
                ? "border-sidebar-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-md"
            )}
          >
            {viewIcons[view.type] || <List className="h-4 w-4" />}
            <span>{view.name}</span>
          </button>
        ))}

        {onAddView && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={onAddView}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onSave && activeViewId !== "default" && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 border-dashed hover:border-sidebar-primary hover:text-sidebar-primary transition-colors"
            onClick={() => onSave(activeViewId)}
          >
            <Save className="h-4 w-4" />
            <span>Save View</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
