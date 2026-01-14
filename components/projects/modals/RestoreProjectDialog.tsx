"use client";

import * as React from "react";
import { toast } from "sonner";
import { projectService } from "@/lib/api/services/project.service";
import type { Project } from "@/types/project";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RotateCcw } from "lucide-react";

interface RestoreProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RestoreProjectDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}: RestoreProjectDialogProps) {
  const [isRestoring, setIsRestoring] = React.useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await projectService.restoreProject(project.id);
      toast.success("Project restored successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to restore project");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-blue-500" />
            Restore Project?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to restore the project{" "}
            <strong>{project.name}</strong>? This will make it active and
            visible in your main projects list again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              handleRestore();
            }}
            disabled={isRestoring}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRestoring ? "Restoring..." : "Yes, Restore Project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
