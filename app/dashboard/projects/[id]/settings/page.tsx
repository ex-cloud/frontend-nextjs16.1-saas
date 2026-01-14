"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { projectService } from "@/lib/api/services/project.service";
import { departmentApi } from "@/lib/api/departments";
import {
  Project,
  CreateProjectInput,
  ProjectStatus,
  ProjectPriority,
} from "@/types/project";
import { Department, User, PaginatedResponse } from "@/types/hrm";
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
import { ProjectMember } from "@/types/project";

export default function ProjectSettingsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = React.useState<Project | null>(null);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [availableOwners, setAvailableOwners] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [explicitMembers, setExplicitMembers] = React.useState<ProjectMember[]>(
    []
  );
  const [showAddMemberDialog, setShowAddMemberDialog] = React.useState(false);
  const [loadingMembers, setLoadingMembers] = React.useState(false);

  const loadMembers = React.useCallback(async () => {
    setLoadingMembers(true);
    try {
      const data = await projectService.getProjectMembers(String(id));
      setExplicitMembers(data);
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setLoadingMembers(false);
    }
  }, [id]);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [projData, deptData] = (await Promise.all([
          projectService.getProject(String(id)),
          departmentApi.list({ per_page: 50 }),
        ])) as [Project, PaginatedResponse<Department>];

        setProject(projData);

        // Handle response for departments
        const depts = deptData.data || [];
        setDepartments(depts);

        if (projData.department_id) {
          try {
            const ownersRes = (await departmentApi.getUsers(
              Number(projData.department_id)
            )) as PaginatedResponse<User>;

            let users = ownersRes.data || [];

            // Ensure current owner is in the list
            if (projData.owner) {
              const currentOwner = projData.owner as unknown as User;
              const exists = users.find((u) => u.id === currentOwner.id);
              if (!exists) {
                users = [currentOwner, ...users];
              }
            }

            setAvailableOwners(users);
          } catch (error) {
            console.error("Failed to load department users:", error);
            if (projData.owner) {
              setAvailableOwners([projData.owner as unknown as User]);
            }
          }
        } else if (projData.owner) {
          setAvailableOwners([projData.owner as unknown as User]);
        }
      } catch (err) {
        console.error("Failed to load project:", err);
        // toast.error("Failed to load project details");
      } finally {
        setLoading(false);
      }
    }
    loadData();
    loadMembers();
  }, [id, loadMembers]);

  const handleRemoveMember = async (userId: string | number) => {
    try {
      await projectService.removeProjectMember(String(id), userId);
      toast.success("Member removed");
      loadMembers();
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
          <TabsTrigger value="tasks" className="gap-2">
            <FileText className="h-4 w-4" /> Tasks
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
                        defaultValue={String(project.department_id || "")}
                        onValueChange={async (val) => {
                          const ownersRes = (await departmentApi.getUsers(
                            Number(val)
                          )) as PaginatedResponse<User>;
                          setAvailableOwners(ownersRes.data || []);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
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
                            {project.due_date ? (
                              format(new Date(project.due_date), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              project.due_date
                                ? new Date(project.due_date)
                                : undefined
                            }
                            onSelect={(date) => {
                              // Direct update to state to reflect change immediately
                              setProject({
                                ...project,
                                due_date: date ? date.toISOString() : undefined,
                              });
                            }}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {/* Hidden input to submit with FormData */}
                      <input
                        type="hidden"
                        name="due_date"
                        value={project.due_date || ""}
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

                return (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {allTasks.length} task{allTasks.length !== 1 ? "s" : ""}{" "}
                      total
                    </p>
                    <div className="divide-y border rounded-lg overflow-hidden">
                      {allTasks.slice(0, 20).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Badge
                              variant="outline"
                              className="text-[10px] shrink-0"
                            >
                              {task.task_number || `#${task.id}`}
                            </Badge>
                            <span className="font-medium text-sm truncate">
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize ${
                                task.priority === "urgent"
                                  ? "border-destructive text-destructive"
                                  : task.priority === "high"
                                  ? "border-orange-500 text-orange-500"
                                  : ""
                              }`}
                            >
                              {task.priority || "medium"}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {task.listName}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    {allTasks.length > 20 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Showing first 20 tasks.{" "}
                        <Button
                          variant="link"
                          size="sm"
                          className="text-xs p-0 h-auto"
                          onClick={() =>
                            router.push(`/dashboard/projects/${id}/kanban`)
                          }
                        >
                          View all on Kanban
                        </Button>
                      </p>
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
          onSuccess={loadMembers}
          departmentId={project.department_id}
        />
      )}
    </div>
  );
}
