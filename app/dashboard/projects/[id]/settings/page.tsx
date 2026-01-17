"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/lib/api/services/project.service";
import { departmentApi } from "@/lib/api/departments";
import {
  CreateProjectInput,
  ProjectStatus,
  ProjectPriority,
} from "@/types/project";
import { User as HrmUser } from "@/types/hrm";
import { User as AppUser } from "@/types/user";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Save,
  Trash2,
  ArrowLeft,
  Users,
  Settings2,
  FileText,
  History,
  Paperclip,
  Plus,
  Loader2,
  Trash,
  Tags,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DeleteProjectDialog } from "@/components/projects/modals/DeleteProjectDialog";
import { AddMemberDialog } from "@/components/projects/modals/AddMemberDialog";
import { ProjectViewTabs } from "@/components/projects/dynamic/ProjectViewTabs";
import { DynamicTableView } from "@/components/projects/dynamic/DynamicTableView";
import { ProjectCalendarView } from "@/components/projects/dynamic/ProjectCalendarView";
import { DynamicBoardView } from "@/components/projects/dynamic/DynamicBoardView";
import { ProjectGalleryView } from "@/components/projects/dynamic/ProjectGalleryView";
import { TaskSheet } from "@/components/projects/kanban/TaskSheet";
import { CustomFieldManager } from "@/components/projects/dynamic/CustomFieldManager";
import { Task } from "@/types/project";

export default function ProjectSettingsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const [activeViewId, setActiveViewId] = React.useState<string | number>(
    "default"
  );
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  const {
    data: project,
    isLoading: loadingProject,
    refetch: refetchProject,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.getProject(String(id)),
    staleTime: 60000,
  });

  const handleAddCustomField = async (
    type:
      | "text"
      | "number"
      | "date"
      | "select"
      | "multi_select"
      | "files"
      | "formula"
  ) => {
    try {
      await projectService.createCustomField(String(id), {
        name: `New ${type} field`,
        type,
        position: project?.custom_field_definitions?.length || 0,
      });
      toast.success("Property added");
      refetchProject();
    } catch {
      toast.error("Failed to add property");
    }
  };

  const { data: departmentsResponse, isLoading: loadingDepts } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentApi.list({ per_page: 50 }),
    staleTime: 300000,
  });

  const {
    data: explicitMembers = [],
    isLoading: loadingMembers,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ["project-members", id],
    queryFn: () => projectService.getProjectMembers(String(id)),
    staleTime: 30000,
  });

  // State to track currently selected department in the form (for owners dropdown)
  const [selectedDeptId, setSelectedDeptId] = React.useState<
    string | undefined
  >(project?.department_id?.toString());

  const deptId = project?.department_id;
  const dueDateStr = project?.due_date;

  // Sync selectedDeptId and selectedDate with project data once loaded
  React.useEffect(() => {
    if (deptId) {
      setSelectedDeptId((prev) => {
        const next = deptId.toString();
        return prev === next ? prev : next;
      });
    }
    if (dueDateStr) {
      setSelectedDate((prev) => {
        const next = new Date(dueDateStr);
        if (prev?.getTime() === next.getTime()) return prev;
        return next;
      });
    }
  }, [deptId, dueDateStr]);

  const { data: ownersRes } = useQuery({
    queryKey: ["department-users", selectedDeptId],
    queryFn: () => departmentApi.getUsers(Number(selectedDeptId)),
    enabled: !!selectedDeptId,
    staleTime: 300000,
  });

  const availableOwners = React.useMemo(() => {
    const users: (HrmUser | AppUser)[] = [...(ownersRes?.data || [])];
    const currentOwner = project?.owner;
    if (currentOwner) {
      if (!users.find((u) => String(u.id) === String(currentOwner.id))) {
        users.unshift(currentOwner as AppUser);
      }
    }
    return users;
  }, [ownersRes, project?.owner]);

  const loading = loadingProject || loadingDepts;

  const handleRemoveMember = async (userId: string | number) => {
    try {
      await projectService.removeProjectMember(String(id), userId);
      toast.success("Member removed");
      refetchMembers();
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project) return;

    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const data: Partial<CreateProjectInput> = {
        name: formData.get("name") as string,
        key: formData.get("key") as string,
        description: formData.get("description") as string,
        status: formData.get("status") as ProjectStatus,
        priority: formData.get("priority") as ProjectPriority,
        department_id: (formData.get("department_id") as string) || undefined,
        owner_id: (formData.get("owner_id") as string) || undefined,
        due_date: (formData.get("due_date") as string) || undefined,
        budget: Number(formData.get("budget")),
      };

      await projectService.updateProject(project.id, data);
      toast.success("Project updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[400px] md:col-span-2" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) return <div>Project not found</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8 text-foreground">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 space-y-0.5">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground text-sm">
            Manage settings and project information for {project.key}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-background/50 capitalize">
            {project.status.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className="bg-background/50 capitalize">
            {project.priority}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6 text-foreground">
        <TabsList className="bg-background/50 border">
          <TabsTrigger value="general" className="gap-2">
            <Settings2 className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" /> Team & Assignments
          </TabsTrigger>
          <TabsTrigger value="properties" className="gap-2">
            <Tags className="h-4 w-4" /> Properties
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <FileText className="h-4 w-4" /> Project Tasks
          </TabsTrigger>
          <TabsTrigger value="attachments" className="gap-2">
            <Paperclip className="h-4 w-4" /> Attachments
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" /> Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="md:col-span-2 space-y-6">
              <Card className="border-sidebar-border/40 shadow-sm">
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                  <CardDescription>
                    Basic details about your project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={project.name}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="key">Project Key</Label>
                      <Input
                        id="key"
                        name="key"
                        defaultValue={project.key}
                        required
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={project.description}
                      className="min-h-[120px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-sidebar-border/40 shadow-sm">
                <CardHeader>
                  <CardTitle>Organization & Ownership</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department_id">Department</Label>
                      <Select
                        name="department_id"
                        value={selectedDeptId || ""}
                        onValueChange={setSelectedDeptId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Department</SelectItem>
                          {(departmentsResponse?.data || []).map((dept) => (
                            <SelectItem key={dept.id} value={String(dept.id)}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner_id">Project Owner</Label>
                      <Select
                        name="owner_id"
                        defaultValue={String(project.owner_id || "")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Owner" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOwners.map((user) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-sidebar-border/40 shadow-sm">
                <CardHeader>
                  <CardTitle>Timeline & Budget</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="due_date">Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full text-left font-normal",
                              !project.due_date && "text-muted-foreground"
                            )}
                          >
                            {selectedDate ? (
                              format(selectedDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {/* Hidden input to submit with FormData */}
                      <input
                        type="hidden"
                        name="due_date"
                        value={selectedDate ? selectedDate.toISOString() : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget (USD)</Label>
                      <Input
                        type="number"
                        id="budget"
                        name="budget"
                        defaultValue={project.budget}
                        step="0.01"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-sidebar-border/40 shadow-sm">
                <CardHeader>
                  <CardTitle>Status & Priority</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Status</Label>
                    <Select name="status" defaultValue={project.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority Level</Label>
                    <Select name="priority" defaultValue={project.priority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <hr className="my-2 border-sidebar-border/40" />
                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={saving}
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive">
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions for this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Project
                  </Button>

                  {project && (
                    <DeleteProjectDialog
                      project={project}
                      open={showDeleteDialog}
                      onOpenChange={setShowDeleteDialog}
                      onSuccess={() => router.push("/dashboard/projects")}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="team">
          <Card className="border-sidebar-border/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team & Assignments</CardTitle>
                <CardDescription>
                  Manage who is involved in this project
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setShowAddMemberDialog(true)}
              >
                <Plus className="h-4 w-4" /> Add Member
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 focus-visible:outline-none">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Project Owner</h4>
                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                    <Avatar>
                      <AvatarImage src={project.owner?.avatar_url || ""} />
                      <AvatarFallback>
                        {project.owner?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {project.owner?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project.owner?.email}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="ml-auto bg-primary/10 text-primary border-primary/20"
                    >
                      Owner
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold flex items-center justify-between">
                    Resource Assignments
                    <span className="text-xs font-normal text-muted-foreground">
                      {explicitMembers.length} Members
                    </span>
                  </h4>

                  <div className="space-y-3">
                    {loadingMembers ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : explicitMembers.length > 0 ? (
                      explicitMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-sidebar-border/40 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={member.user?.avatar_url || ""}
                              />
                              <AvatarFallback>
                                {member.user?.name
                                  ?.substring(0, 2)
                                  .toUpperCase() || "??"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">
                                  {member.user?.name || "Unknown User"}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] capitalize"
                                >
                                  {member.role}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {member.is_team_assignment ? (
                                  <span className="flex items-center gap-2">
                                    <Users className="h-3 w-3" /> Inherited via
                                    Team
                                  </span>
                                ) : (
                                  "Explicitly Assigned"
                                )}
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 rounded-lg border border-dashed border-sidebar-border/60">
                        <p className="text-sm text-muted-foreground">
                          No explicit members assigned yet.
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setShowAddMemberDialog(true)}
                        >
                          Assign now
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties">
          <Card className="border-sidebar-border/40 shadow-sm">
            <CardHeader>
              <CardTitle>Custom Properties</CardTitle>
              <CardDescription>
                Define the data structure for tasks in this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project && (
                <CustomFieldManager
                  projectId={project.id}
                  initialFields={project.custom_field_definitions || []}
                  onRefresh={() => refetchProject()}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="border-sidebar-border/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Tasks</CardTitle>
                <CardDescription>
                  Overview of all tasks in this project
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => router.push(`/dashboard/projects/${id}/kanban`)}
              >
                <FileText className="h-4 w-4" /> Open Kanban
              </Button>
            </CardHeader>
            <CardContent>
              {(() => {
                // Flatten tasks from all boards and lists
                const allTasks =
                  project.boards?.flatMap(
                    (board) =>
                      board.lists?.flatMap((list) =>
                        (list.tasks || []).map((task) => ({
                          ...task,
                          listName: list.name,
                          boardName: board.name,
                        }))
                      ) || []
                  ) || [];

                if (allTasks.length === 0) {
                  return (
                    <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                      <FileText className="h-10 w-10 mx-auto mb-4 opacity-20" />
                      <p>No tasks yet in this project.</p>
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() =>
                          router.push(`/dashboard/projects/${id}/kanban`)
                        }
                      >
                        Create tasks on Kanban Board
                      </Button>
                    </div>
                  );
                }

                const views = project.project_views || [];
                const hasViews = views.length > 0;

                // Add a default view if none exist or to always have "All Tasks"
                const displayViews = hasViews
                  ? views
                  : [
                      {
                        id: "default",
                        name: "All Tasks",
                        type: "table" as const,
                        project_id: project.id,
                        position: 0,
                        is_default: true,
                      },
                    ];

                const activeView = displayViews.find(
                  (v) => v.id === activeViewId
                );

                const handleSaveViewConfig = async (
                  viewId: string | number
                ) => {
                  if (viewId === "default") return;
                  try {
                    const view = project.project_views?.find(
                      (v) => v.id === viewId
                    );
                    if (!view) return;

                    await projectService.updateProjectView(project.id, viewId, {
                      config: view.config, // Later: capture actual current filters/sorts
                    });
                    toast.success("View configuration saved");
                  } catch {
                    toast.error("Failed to save view configuration");
                  }
                };

                return (
                  <div className="space-y-6">
                    <ProjectViewTabs
                      views={displayViews}
                      activeViewId={activeViewId}
                      onViewChange={setActiveViewId}
                      onSave={handleSaveViewConfig}
                    />

                    {activeView?.type === "calendar" ? (
                      <ProjectCalendarView
                        tasks={allTasks}
                        customFields={project.custom_field_definitions || []}
                        onTaskClick={setSelectedTask}
                        className="h-[600px]"
                      />
                    ) : activeView?.type === "board" ? (
                      <DynamicBoardView
                        tasks={allTasks}
                        customFields={project.custom_field_definitions || []}
                        onTaskClick={setSelectedTask}
                        groupFieldId={
                          activeView.config?.group_by as
                            | string
                            | number
                            | undefined
                        }
                      />
                    ) : activeView?.type === "gallery" ? (
                      <ProjectGalleryView
                        tasks={allTasks}
                        onTaskClick={setSelectedTask}
                      />
                    ) : (
                      <DynamicTableView
                        tasks={allTasks}
                        customFields={project.custom_field_definitions || []}
                        onTaskClick={setSelectedTask}
                        onAddProperty={handleAddCustomField}
                      />
                    )}

                    {selectedTask && (
                      <TaskSheet
                        task={selectedTask}
                        open={!!selectedTask}
                        onOpenChange={(open) => !open && setSelectedTask(null)}
                        onRefresh={() => {
                          refetchProject();
                        }}
                        customFieldDefinitions={
                          project.custom_field_definitions || []
                        }
                      />
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="attachments">
          <Card className="border-sidebar-border/40 shadow-sm">
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>
                Files associated with this project
              </CardDescription>
            </CardHeader>
            <CardContent className="py-20 text-center text-muted-foreground">
              <Paperclip className="h-10 w-10 mx-auto mb-4 opacity-20" />
              <p>No attachments yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card className="border-sidebar-border/40 shadow-sm">
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>Recent changes to this project</CardDescription>
            </CardHeader>
            <CardContent className="py-20 text-center text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-4 opacity-20" />
              <p>Activity history coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {project && (
        <AddMemberDialog
          projectId={String(id)}
          open={showAddMemberDialog}
          onOpenChange={setShowAddMemberDialog}
          onSuccess={() => refetchMembers()}
          departmentId={project.department_id}
        />
      )}
    </div>
  );
}
