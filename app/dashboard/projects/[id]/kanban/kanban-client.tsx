"use client";

import * as React from "react";
import { projectService } from "@/lib/api/services/project.service";
import type { Project, Board, TaskList } from "@/types/project";
import { KanbanBoard } from "@/components/projects/kanban/KanbanBoard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Settings, Plus, Columns, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface KanbanClientProps {
  projectId: string;
}

export function KanbanClient({ projectId }: KanbanClientProps) {
  const [project, setProject] = React.useState<Project | null>(null);
  const [, setBoards] = React.useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = React.useState<Board | null>(null);
  const [lists, setLists] = React.useState<TaskList[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchProjectData = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Project
      const projectData = await projectService.getProject(projectId);
      setProject(projectData);

      // 2. Fetch Boards
      const boardsData = await projectService.getProjectBoards(projectId);
      setBoards(boardsData);

      console.log(`Loaded ${boardsData.length} boards`);

      // 3. Set Active Board (default or first)
      const defaultBoard =
        boardsData.find((b) => b.is_default) || boardsData[0];
      if (defaultBoard) {
        setActiveBoard(defaultBoard);
        // 4. Fetch Lists & Tasks
        const listsData = await projectService.getBoardLists(defaultBoard.id);
        setLists(listsData);
      }
    } catch (error) {
      console.error("Failed to fetch kanban data:", error);
      toast.error("Failed to load project board");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

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
            <Button variant="outline" size="icon" onClick={fetchProjectData}>
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
            onRefresh={fetchProjectData}
          />
        )}
      </div>
    </div>
  );
}
