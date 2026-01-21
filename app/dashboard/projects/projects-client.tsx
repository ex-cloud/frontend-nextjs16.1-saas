"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Settings,
  Trash2,
  Search,
  Plus,
  Filter,
  RefreshCcw,
  LayoutGrid,
  List,
  History,
  RotateCcw,
  Trash,
} from "lucide-react";
import type { Project, ProjectFilters, ProjectStatus } from "@/types/project";
import { User } from "@/types/user";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectDialog } from "@/components/projects/modals/ProjectDialog";
import { DeleteProjectDialog } from "@/components/projects/modals/DeleteProjectDialog";
import { RestoreProjectDialog } from "@/components/projects/modals/RestoreProjectDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

import { useProjects } from "@/hooks/use-projects";
import { createEcho } from "@/lib/echo";
import { useBroadcastChannel, type BroadcastMessage } from "@/lib/broadcast";
import Echo from "laravel-echo";

export function ProjectsClient() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [view, setView] = React.useState<"grid" | "table">("grid");
  const [isTrash, setIsTrash] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [deleteProject, setDeleteProject] = React.useState<Project | null>(
    null
  );
  const [restoreProject, setRestoreProject] = React.useState<Project | null>(
    null
  );
  const [forceDeleteProject, setForceDeleteProject] =
    React.useState<Project | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const filters: ProjectFilters = React.useMemo(() => {
    const f: ProjectFilters = { page: 1, per_page: 50 };
    if (debouncedSearch) f.search = debouncedSearch;
    if (status !== "all") f.status = status as ProjectStatus;
    if (isTrash) f.only_trashed = true;
    return f;
  }, [debouncedSearch, status, isTrash]);

  const {
    data: projectsRes,
    isLoading: loading,
    refetch: fetchProjects,
  } = useProjects(filters);
  const projects: Project[] = React.useMemo(
    () => projectsRes?.data || [],
    [projectsRes?.data]
  );

  // Listen for real-time updates via Laravel Echo (Cross-device)
  const projectIds = React.useMemo(
    () => projects.map((p) => p.id).join(","),
    [projects]
  );

  React.useEffect(() => {
    let echoInstance: Echo<"pusher"> | null = null;
    const activeChannels: string[] = [];

    const setupEcho = async () => {
      try {
        const echo = await createEcho();
        if (!echo) return;
        echoInstance = echo;

        for (const project of projects) {
          const channelName = `projects.${project.id}`;
          const channel = echo.private(channelName);

          channel.listen(".task.moved", () => {
            console.log(
              `[ProjectsClient] Real-time update: Task moved in project ${project.id}, refreshing...`
            );
            fetchProjects();
          });

          channel.listen(".task.deleted", () => {
            console.log(
              `[ProjectsClient] Real-time update: Task deleted in project ${project.id}, refreshing...`
            );
            fetchProjects();
          });

          channel.listen(
            ".project.progress_updated",
            (e: { progress: number }) => {
              console.log(
                `[ProjectsClient] Real-time progress update for project ${project.id}: ${e.progress}%`
              );
              fetchProjects(); // Refresh to get the latest task counts and other potential changes
            }
          );

          activeChannels.push(channelName);
        }
      } catch (err) {
        console.error("[ProjectsClient] Echo subscription failed:", err);
      }
    };

    if (projects.length > 0) {
      void setupEcho();
    }

    return () => {
      const currentEcho = echoInstance;
      if (currentEcho) {
        for (const name of activeChannels) {
          try {
            currentEcho.leave(name);
          } catch {
            // Silence cleanup errors
          }
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIds, fetchProjects]);

  // Listen for cross-tab broadcasts to auto-refresh data (Same browser)
  const handleBroadcast = React.useCallback(
    (message: BroadcastMessage) => {
      // Refresh when any task-related change occurs
      if (
        message.type === "TASK_MOVED" ||
        message.type === "TASK_CREATED" ||
        message.type === "TASK_UPDATED" ||
        message.type === "TASK_DELETED" ||
        message.type === "PROJECT_PROGRESS_CHANGED" ||
        message.type === "REFRESH_PROJECTS"
      ) {
        console.log(
          "[ProjectsClient] Received broadcast, refreshing...",
          message.type
        );
        fetchProjects();
      }
    },
    [fetchProjects]
  );

  useBroadcastChannel(handleBroadcast);

  return (
    <div className="flex flex-col gap-6 p-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isTrash ? "Recycle Bin" : "Projects"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isTrash
              ? "View and restore recently deleted projects."
              : "Manage and track all your organization's projects in one place."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchProjects()}
            disabled={loading}
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button
            variant={isTrash ? "secondary" : "outline"}
            className="gap-2"
            onClick={() => setIsTrash(!isTrash)}
          >
            {isTrash ? (
              <List className="h-4 w-4" />
            ) : (
              <History className="h-4 w-4" />
            )}
            {isTrash ? "Active Projects" : "Recycle Bin"}
          </Button>
          <Button
            className="gap-2 shadow-sm"
            onClick={() => setIsDialogOpen(true)}
            disabled={isTrash}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9 bg-background/50 shadow-none border-sidebar-border/40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px] bg-background/50 border-sidebar-border/40">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border border-sidebar-border/40 rounded-md p-1 bg-muted/30">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                view === "grid" && "bg-background shadow-sm"
              )}
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                view === "table" && "bg-background shadow-sm"
              )}
              onClick={() => setView("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i: number) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length > 0 ? (
        view === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isTrash={isTrash}
                onRefresh={fetchProjects}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-sidebar-border/40 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-sidebar-border/40">
                  <tr>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3 text-right">Tasks</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sidebar-border/20 border-sidebar-border/40">
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/dashboard/projects/${project.id}/settings`
                        )
                      }
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-sidebar-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/dashboard/projects/${project.id}/kanban`
                              );
                            }}
                          >
                            <LayoutGrid className="h-4 w-4" />
                          </Button>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                              {project.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                              {project.key}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className="capitalize text-[10px] font-medium px-2 py-0 h-5"
                        >
                          {project.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize shadow-none text-[10px] font-medium px-2 py-0 h-5 border-0",
                            project.priority === "critical"
                              ? "bg-destructive/10 text-destructive"
                              : project.priority === "high"
                              ? "bg-orange-500/10 text-orange-600"
                              : "bg-blue-500/10 text-blue-600"
                          )}
                        >
                          {project.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex -space-x-1.5">
                          {(project.members || [])
                            .slice(0, 3)
                            .map((u: User) => (
                              <Avatar
                                key={u.id}
                                className="h-6 w-6 border-2 border-background ring-1 ring-sidebar-border/20"
                              >
                                <AvatarImage
                                  src={
                                    u.avatar_url ||
                                    `https://avatar.vercel.sh/${u.id}.png`
                                  }
                                />
                                <AvatarFallback className="text-[8px]">
                                  {u.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          {(project.members?.length || 0) > 3 && (
                            <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                              +{(project.members?.length || 0) - 3}
                            </div>
                          )}
                          {(project.members?.length || 0) === 0 && (
                            <span className="text-[10px] text-muted-foreground/50 italic">
                              None
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-medium">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden border border-sidebar-border/10">
                            <div
                              className="h-full bg-sidebar-primary transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(var(--sidebar-primary),0.4)]"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-muted-foreground">
                        {project.tasks_count || 0}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {isTrash ? (
                              <>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRestoreProject(project);
                                  }}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Restore
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-rose-500 focus:text-rose-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setForceDeleteProject(project);
                                  }}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete Perm.
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/dashboard/projects/${project.id}/kanban`
                                    );
                                  }}
                                >
                                  <LayoutGrid className="mr-2 h-4 w-4" />
                                  Board
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/dashboard/projects/${project.id}/settings`
                                    );
                                  }}
                                >
                                  <Settings className="mr-2 h-4 w-4" />
                                  Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-rose-500 focus:text-rose-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteProject(project);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl border-muted-foreground/20 bg-muted/5">
          <div className="rounded-full bg-muted p-4 mb-4">
            <LayoutGrid className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <h3 className="text-xl font-semibold">No projects found</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            Try adjusting your filters or create a new project to get started.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setSearch("");
              setStatus("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
      <ProjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchProjects}
      />
      {deleteProject && (
        <DeleteProjectDialog
          project={deleteProject}
          open={!!deleteProject}
          onOpenChange={(open) => !open && setDeleteProject(null)}
          onSuccess={fetchProjects}
          mode="trash"
        />
      )}
      {restoreProject && (
        <RestoreProjectDialog
          project={restoreProject}
          open={!!restoreProject}
          onOpenChange={(open) => !open && setRestoreProject(null)}
          onSuccess={fetchProjects}
        />
      )}
      {forceDeleteProject && (
        <DeleteProjectDialog
          project={forceDeleteProject}
          open={!!forceDeleteProject}
          onOpenChange={(open) => !open && setForceDeleteProject(null)}
          onSuccess={fetchProjects}
          mode="permanent"
        />
      )}
    </div>
  );
}
