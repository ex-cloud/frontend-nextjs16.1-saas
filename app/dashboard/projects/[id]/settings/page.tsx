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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Settings2,
  Users,
  Tags,
  FileText,
  Paperclip,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AddMemberDialog } from "@/components/projects/modals/AddMemberDialog";

// Sub-components
import { GeneralTab } from "@/components/projects/settings/GeneralTab";
import { TeamTab } from "@/components/projects/settings/TeamTab";
import { PropertiesTab } from "@/components/projects/settings/PropertiesTab";
import { TasksTab } from "@/components/projects/settings/TasksTab";
import { AttachmentsTab } from "@/components/projects/settings/AttachmentsTab";
import { ActivityTab } from "@/components/projects/settings/ActivityTab";

export default function ProjectSettingsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const [selectedDeptId, setSelectedDeptId] = React.useState<
    string | undefined
  >();

  const {
    data: project,
    isLoading: loadingProject,
    refetch: refetchProject,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.getProject(String(id)),
    staleTime: 60000,
  });

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

  // Sync selectedDeptId and selectedDate with project data once loaded
  React.useEffect(() => {
    if (project?.department_id) {
      setSelectedDeptId(project.department_id.toString());
    } else if (project) {
      setSelectedDeptId("none");
    }
    if (project?.due_date) {
      setSelectedDate(new Date(project.due_date));
    }
  }, [project]);

  const { data: ownersRes } = useQuery({
    queryKey: ["department-users", selectedDeptId],
    queryFn: () => departmentApi.getUsers(Number(selectedDeptId)),
    enabled: !!selectedDeptId && selectedDeptId !== "none",
    staleTime: 300000,
  });

  const availableOwners = React.useMemo(() => {
    // Map HrmUser/AppUser to a common interface for GeneralTab
    const hrmUsers: {
      id: string | number;
      name: string;
      avatar_url?: string;
    }[] = (ownersRes?.data || []).map((u) => ({
      id: u.id,
      name: u.name,
      avatar_url: u.avatar_url || undefined,
    }));

    const owner = project?.owner;
    if (owner && !hrmUsers.find((u) => String(u.id) === String(owner.id))) {
      hrmUsers.unshift({
        id: owner.id,
        name: owner.name,
        avatar_url: owner.avatar_url,
      });
    }
    return hrmUsers;
  }, [ownersRes, project?.owner]);

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
        department_id:
          (formData.get("department_id") as string) === "none"
            ? undefined
            : (formData.get("department_id") as string),
        owner_id: (formData.get("owner_id") as string) || undefined,
        due_date: (formData.get("due_date") as string) || undefined,
        budget: Number(formData.get("budget")),
      };

      await projectService.updateProject(project.id, data);
      toast.success("Project updated successfully");
      refetchProject();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string | number) => {
    try {
      await projectService.removeProjectMember(String(id), memberId);
      toast.success("Member removed");
      refetchMembers();
    } catch {
      toast.error("Failed to remove member");
    }
  };

  if (loadingProject || loadingDepts) {
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

  if (!project) return <div className="p-6">Project not found</div>;

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

        <TabsContent value="general">
          <GeneralTab
            project={project}
            departments={departmentsResponse?.data || []}
            availableOwners={availableOwners}
            selectedDeptId={selectedDeptId}
            setSelectedDeptId={setSelectedDeptId}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            saving={saving}
            handleSave={handleSave}
            showDeleteDialog={showDeleteDialog}
            setShowDeleteDialog={setShowDeleteDialog}
            onDeleteSuccess={() => router.push("/dashboard/projects")}
          />
        </TabsContent>

        <TabsContent value="team">
          <TeamTab
            project={project}
            explicitMembers={explicitMembers}
            loadingMembers={loadingMembers}
            setShowAddMemberDialog={setShowAddMemberDialog}
            handleRemoveMember={handleRemoveMember}
          />
        </TabsContent>

        <TabsContent value="properties">
          <PropertiesTab project={project} onRefresh={refetchProject} />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab
            project={project}
            explicitMembers={explicitMembers}
            onRefresh={refetchProject}
          />
        </TabsContent>

        <TabsContent value="attachments">
          <AttachmentsTab />
        </TabsContent>

        <TabsContent value="history">
          <ActivityTab />
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
