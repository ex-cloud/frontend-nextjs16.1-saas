"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  MoreVertical,
  LayoutGrid,
  Clock,
  Trash2,
  Trash,
  RotateCcw,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/types/project";
import Link from "next/link";
import { cn } from "@/lib/utils";
import * as React from "react";
import { DeleteProjectDialog } from "./modals/DeleteProjectDialog";
import { RestoreProjectDialog } from "./modals/RestoreProjectDialog";

interface ProjectCardProps {
  project: Project;
  isTrash?: boolean;
  onRefresh?: () => void;
}

const statusColors = {
  planning: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  active: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  on_hold: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  archived: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

const priorityColors = {
  low: "text-slate-500",
  medium: "text-blue-500",
  high: "text-amber-500",
  critical: "text-rose-500",
};

const priorityHoverColors = {
  low: "hover:border-slate-400",
  medium: "hover:border-blue-400",
  high: "hover:border-amber-400",
  critical: "hover:border-rose-400",
};

export function ProjectCard({ project, isTrash, onRefresh }: ProjectCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = React.useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] =
    React.useState(false);

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRestoreDialog(true);
  };

  const handleForceDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPermanentDeleteDialog(true);
  };

  return (
    <>
      <Card
        className={cn(
          "group relative overflow-hidden transition-all hover:shadow-lg bg-card/50 backdrop-blur-sm border-sidebar-border shadow-sidebar",
          priorityHoverColors[project.priority]
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <Link
              href={`/dashboard/projects/${project.id}/kanban`}
              className="hover:underline"
            >
              <h3 className="font-semibold leading-none text-xl tracking-tight text-foreground/90 group-hover:text-sidebar-primary transition-colors">
                {project.name}
              </h3>
            </Link>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {project.key}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {isTrash ? (
                <>
                  {project.permissions?.can_delete && (
                    <>
                      <DropdownMenuItem onClick={handleRestore}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restore
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-rose-500 focus:text-rose-500"
                        onClick={handleForceDelete}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Perm.
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/dashboard/projects/${project.id}/kanban`}
                      className="cursor-pointer"
                    >
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      Board
                    </Link>
                  </DropdownMenuItem>

                  {project.permissions?.can_edit && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/dashboard/projects/${project.id}/settings`}
                        className="cursor-pointer"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {project.permissions?.can_delete && (
                    <DropdownMenuItem
                      className="text-rose-500 cursor-pointer focus:text-rose-500"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
            {project.description || "No description provided."}
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("font-medium", statusColors[project.status])}
            >
              {project.status.replace("_", " ")}
            </Badge>
            <span
              className={cn(
                "text-xs flex items-center gap-1 font-semibold capitalize",
                priorityColors[project.priority]
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {project.priority}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-1.5" />
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex flex-row items-center justify-between text-muted-foreground">
          <div className="flex -space-x-2">
            {(project.members || []).slice(0, 3).map((user) => (
              <Avatar
                key={user.id}
                className="h-7 w-7 border-2 border-background ring-offset-2"
              >
                <AvatarImage
                  src={
                    user.avatar_url || `https://avatar.vercel.sh/${user.id}.png`
                  }
                />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {(project.members?.length || 0) > 3 && (
              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-[10px] font-medium border-2 border-background">
                +{(project.members?.length || 0) - 3}
              </div>
            )}
            {(project.members?.length || 0) === 0 && (
              <div className="h-7 w-7 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground/40">
                <Clock className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>{project.tasks_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {project.due_date
                  ? new Date(project.due_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "No due date"}
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>

      <DeleteProjectDialog
        project={project}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={() => onRefresh?.()}
        mode="trash"
      />
      <RestoreProjectDialog
        project={project}
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        onSuccess={() => onRefresh?.()}
      />
      <DeleteProjectDialog
        project={project}
        open={showPermanentDeleteDialog}
        onOpenChange={setShowPermanentDeleteDialog}
        onSuccess={() => onRefresh?.()}
        mode="permanent"
      />
    </>
  );
}
