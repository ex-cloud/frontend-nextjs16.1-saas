"use client";

import * as React from "react";
import { KanbanBoard } from "@/components/projects/kanban/KanbanBoard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Settings, Plus, Columns, Share2 } from "lucide-react";
// import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface KanbanClientProps {
  projectId: string;
}

import {
  useProject,
  useProjectBoards,
  useBoardLists,
} from "@/hooks/use-projects";

export function KanbanClient({ projectId }: KanbanClientProps) {
  const { data: project, isLoading: loadingProject } = useProject(projectId);
  const { data: boards, isLoading: loadingBoards } =
    useProjectBoards(projectId);

  const activeBoard = React.useMemo(() => {
    if (!boards) return null;
    return boards.find((b) => b.is_default) || boards[0] || null;
  }, [boards]);

  const {
    data: lists = [],
    isLoading: loadingLists,
    refetch: refetchLists,
  } = useBoardLists(activeBoard?.id || "");

  const loading = loadingProject || loadingBoards || loadingLists;

  const handleRefresh = React.useCallback(() => {
    refetchLists();
  }, [refetchLists]);

  if (loading) {
    return (
      <div className="flex flex-col h-full gap-4 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[250px]" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </div>
        <Separator />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i: number) => (
            <Skeleton key={i} className="h-[600px] w-[300px] flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex flex-col h-full bg-background/50 overflow-hidden">
      {/* Kanban Header */}
      <div className="flex flex-col gap-4 p-6 pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sidebar-primary/10 rounded-lg">
              <Columns className="h-6 w-6 text-sidebar-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {project.name}
                </h1>
                <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  {project.key}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {activeBoard?.name || "Kanban Board"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
            <Separator orientation="vertical" className="h-8 mx-1" />
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Board Content */}
      <div className="flex-1 overflow-hidden">
        {activeBoard && (
          <KanbanBoard
            initialLists={lists}
            board={{ id: activeBoard.id, project_id: activeBoard.project_id }}
            onRefresh={handleRefresh}
          />
        )}
      </div>
    </div>
  );
}
