"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Task,
  Comment,
  ProjectMember,
  CustomFieldDefinition,
  CustomFieldFile,
  CustomFieldType,
} from "@/types/project";
import { taskService } from "@/lib/api/services/task.service";
import { projectService } from "@/lib/api/services/project.service";
import { toast } from "sonner";
import axios from "axios";

import { TaskSheetHeader } from "./task-sheet/TaskSheetHeader";
import { TaskSheetTitle } from "./task-sheet/TaskSheetTitle";
import { TaskSheetProperties } from "./task-sheet/TaskSheetProperties";
import { TaskSheetDescription } from "./task-sheet/TaskSheetDescription";
import { TaskSheetComments } from "./task-sheet/TaskSheetComments";

interface TaskSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
  customFieldDefinitions?: CustomFieldDefinition[];
  onAddProperty?: (type: CustomFieldType) => void;
}

export function TaskSheet({
  task,
  open,
  onOpenChange,
  onRefresh,
  customFieldDefinitions,
  onAddProperty,
}: TaskSheetProps) {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [projectMembers, setProjectMembers] = React.useState<ProjectMember[]>(
    []
  );
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [isTogglingTimer, setIsTogglingTimer] = React.useState(false);

  const fetchComments = React.useCallback(async () => {
    if (task) {
      try {
        const data = await taskService.getTaskComments(task.id);
        setComments(data);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      }
    }
  }, [task]);

  const fetchMembers = React.useCallback(async () => {
    if (task) {
      try {
        const members = await projectService.getProjectMembers(
          String(task.project_id)
        );
        setProjectMembers(members);
      } catch (error) {
        console.error("Failed to fetch project members:", error);
      }
    }
  }, [task]);

  const checkRunningTimer = React.useCallback(async () => {
    if (task) {
      try {
        const response = await taskService.getActiveTimer();
        if (
          response.is_running &&
          String(response.data?.task_id) === String(task.id)
        ) {
          setIsTimerRunning(true);
        } else {
          setIsTimerRunning(false);
        }
      } catch {
        setIsTimerRunning(false);
      }
    }
  }, [task]);

  React.useEffect(() => {
    if (open && task) {
      fetchComments();
      fetchMembers();
      checkRunningTimer();
    }
  }, [open, task, fetchComments, fetchMembers, checkRunningTimer]);

  if (!task) return null;

  const handleToggleTimer = async () => {
    try {
      setIsTogglingTimer(true);
      const res = await taskService.toggleTimeTracking(task.id);
      setIsTimerRunning(res.is_running);
      toast.success(res.is_running ? "Timer started" : "Timer stopped");
      if (onRefresh) onRefresh();
    } catch (error: unknown) {
      let message = "Failed to toggle timer";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setIsTogglingTimer(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      await taskService.updateTask(task.id, { status: "done" });
      toast.success("Task completed!");
      if (onRefresh) onRefresh();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Failed to complete task:", error);
      toast.error("Failed to complete task");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleUpdate = async (field: keyof Task, value: unknown) => {
    if (!task) return;
    try {
      await taskService.updateTask(task.id, {
        [field]: value,
      });
      toast.success(`${String(field).replace("_", " ")} updated`);
      if (onRefresh) onRefresh();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleUpdateCustomField = async (
    fieldId: string | number,
    value: unknown
  ) => {
    if (!task) return;
    try {
      const currentValues = task.custom_values || {};
      const newValues = { ...currentValues, [String(fieldId)]: value };

      await taskService.updateTask(task.id, {
        custom_values: newValues,
      });

      toast.success("Property updated");
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Failed to update custom field:", error);
      toast.error("Failed to update property");
    }
  };

  const handleFileUpload = async (defId: string | number, file: File) => {
    if (!task) return;
    try {
      setIsLoading(true);
      const uploadedFile = await taskService.uploadFile(file);
      const currentFiles =
        (task.custom_values?.[String(defId)] as CustomFieldFile[]) || [];
      const newFiles = [...currentFiles, uploadedFile];
      await handleUpdateCustomField(defId, newFiles);
      toast.success("File uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = async (defId: string | number, index: number) => {
    if (!task) return;
    const currentFiles =
      (task.custom_values?.[String(defId)] as CustomFieldFile[]) || [];
    const newFiles = currentFiles.filter((_, i) => i !== index);
    await handleUpdateCustomField(defId, newFiles);
  };

  const handleDelete = async () => {
    try {
      await taskService.deleteTask(task.id);
      toast.success("Task deleted");
      if (onRefresh) onRefresh();
      onOpenChange(false);
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] p-0 flex flex-col bg-background h-full">
        <SheetTitle className="sr-only">Task Details</SheetTitle>
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col min-h-full">
            <TaskSheetHeader
              task={task}
              isTimerRunning={isTimerRunning}
              isTogglingTimer={isTogglingTimer}
              isCompleting={isCompleting}
              onToggleTimer={handleToggleTimer}
              onComplete={handleComplete}
              onDelete={handleDelete}
            />

            {/* Main Content Area */}
            <div className="px-12 pt-10 pb-40 space-y-12 max-w-full">
              <TaskSheetTitle task={task} onUpdate={handleUpdate} />

              {/* Properties Section */}
              <TaskSheetProperties
                task={task}
                projectMembers={projectMembers}
                customFieldDefinitions={customFieldDefinitions}
                onUpdate={handleUpdate}
                onUpdateCustomField={handleUpdateCustomField}
                onFileUpload={handleFileUpload}
                onRemoveFile={removeFile}
                isLoading={isLoading}
                onAddProperty={onAddProperty}
              />

              {/* Description Section */}
              <TaskSheetDescription task={task} onUpdate={handleUpdate} />

              {/* Comments Section */}
              <TaskSheetComments
                taskId={task.id}
                comments={comments}
                onRefresh={fetchComments}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
