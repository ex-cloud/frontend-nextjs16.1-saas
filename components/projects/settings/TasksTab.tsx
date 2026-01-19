"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ProjectViewTabs } from "@/components/projects/dynamic/ProjectViewTabs";
import { ProjectCalendarView } from "@/components/projects/dynamic/ProjectCalendarView";
import { DynamicBoardView } from "@/components/projects/dynamic/DynamicBoardView";
import { ProjectGalleryView } from "@/components/projects/dynamic/ProjectGalleryView";
import { DynamicTableView } from "@/components/projects/dynamic/DynamicTableView";
import { TaskSheet } from "@/components/projects/kanban/TaskSheet";
import { projectService } from "@/lib/api/services/project.service";
import { taskService } from "@/lib/api/services/task.service";
import {
  Project,
  Task,
  CustomFieldType,
  ProjectMember,
  CustomFieldFile,
} from "@/types/project";

interface TasksTabProps {
  project: Project;
  explicitMembers: ProjectMember[];
  onRefresh: () => void;
}

export function TasksTab({
  project,
  explicitMembers,
  onRefresh,
}: TasksTabProps) {
  const router = useRouter();
  const [activeViewId, setActiveViewId] = React.useState<string | number>(
    "default"
  );
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  // Flatten tasks from all boards and lists
  const allTasks = React.useMemo(() => {
    return (
      project?.boards?.flatMap(
        (board) =>
          board.lists?.flatMap((list) =>
            (list.tasks || []).map((task) => ({
              ...task,
              listName: list.name,
              boardName: board.name,
            }))
          ) || []
      ) || []
    );
  }, [project]);

  if (allTasks.length === 0) {
    return (
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
            onClick={() =>
              router.push(`/dashboard/projects/${project.id}/kanban`)
            }
          >
            <FileText className="h-4 w-4" /> Open Kanban
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
            <FileText className="h-10 w-10 mx-auto mb-4 opacity-20" />
            <p>No tasks yet in this project.</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() =>
                router.push(`/dashboard/projects/${project.id}/kanban`)
              }
            >
              Create tasks on Kanban Board
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const views = project.project_views || [];
  const displayViews =
    views.length > 0
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

  const activeView = displayViews.find((v) => v.id === activeViewId);

  const handleAddCustomField = async (type: CustomFieldType) => {
    try {
      await projectService.createCustomField(String(project.id), {
        name: `New ${type} field`,
        type,
        position: project?.custom_field_definitions?.length || 0,
      });
      toast.success("Property added");
      onRefresh();
    } catch {
      toast.error("Failed to add property");
    }
  };

  const handleUpdateTaskCustomField = async (
    taskId: string | number,
    fieldId: string | number,
    value: unknown
  ) => {
    try {
      // Find the latest task from the memoized array
      const task = allTasks.find((t) => String(t.id) === String(taskId));
      if (!task) return;

      const currentValues = task.custom_values || {};
      const newValues = {
        ...currentValues,
        [String(fieldId)]: value,
      };

      await taskService.updateTask(taskId, {
        custom_values: newValues,
      });

      toast.success("Property updated");
      onRefresh();
    } catch (error) {
      console.error("Failed to update custom field:", error);
      toast.error("Failed to update property");
    }
  };

  const handleUpdateTask = async (
    taskId: string | number,
    field: keyof Task,
    value: unknown
  ) => {
    try {
      await taskService.updateTask(taskId, {
        [field]: value,
      });
      toast.success("Task updated");
      onRefresh();
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleFileUpload = async (
    taskId: string | number,
    defId: string | number,
    file: File
  ) => {
    try {
      // 1. Upload the file first
      const uploadedFile = await taskService.uploadFile(file);

      // 2. Refresh task data locally to avoid race conditions with multiple uploads
      // Find the task in the latest available state
      const task = allTasks.find((t) => String(t.id) === String(taskId));
      if (!task) throw new Error("Task not found");

      const existingValues = task.custom_values || {};
      const currentFiles =
        (existingValues[String(defId)] as CustomFieldFile[]) || [];

      // Ensure we don't duplicate or lose files
      const nextFiles = [
        ...currentFiles,
        {
          name: uploadedFile.name,
          url: uploadedFile.url,
          size: uploadedFile.size,
          type: file.type,
        },
      ];

      const newValues = {
        ...existingValues,
        [String(defId)]: nextFiles,
      };

      // 3. Update the task
      await taskService.updateTask(taskId, {
        custom_values: newValues,
      });

      toast.success("File uploaded successfully");
      onRefresh();
    } catch (error) {
      console.error("Upload/Update failed:", error);
      toast.error("Upload failed");
    }
  };

  const handleSaveViewConfig = async (viewId: string | number) => {
    if (viewId === "default") return;
    try {
      const view = project.project_views?.find((v) => v.id === viewId);
      if (!view) return;

      await projectService.updateProjectView(project.id, viewId, {
        config: view.config,
      });
      toast.success("View configuration saved");
    } catch {
      toast.error("Failed to save view configuration");
    }
  };

  return (
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
          onClick={() =>
            router.push(`/dashboard/projects/${project.id}/kanban`)
          }
        >
          <FileText className="h-4 w-4" /> Open Kanban
        </Button>
      </CardHeader>
      <CardContent>
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
                activeView.config?.group_by as string | number | undefined
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
              onUpdateCustomField={handleUpdateTaskCustomField}
              onUpdateTask={handleUpdateTask}
              onFileUpload={handleFileUpload}
              projectMembers={explicitMembers}
            />
          )}

          {selectedTask && (
            <TaskSheet
              task={selectedTask}
              open={!!selectedTask}
              onOpenChange={(open) => !open && setSelectedTask(null)}
              onRefresh={onRefresh}
              customFieldDefinitions={project.custom_field_definitions || []}
              onAddProperty={handleAddCustomField}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
