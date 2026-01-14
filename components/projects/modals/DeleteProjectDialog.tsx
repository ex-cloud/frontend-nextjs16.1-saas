"use client";

import * as React from "react";
import { toast } from "sonner";
import { projectService } from "@/lib/api/services/project.service";
import type { Project } from "@/types/project";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface DeleteProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "trash" | "permanent";
}

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
  mode = "trash",
}: DeleteProjectDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmName, setConfirmName] = React.useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (mode === "permanent") {
        await projectService.forceDeleteProject(project.id);
        toast.success("Project permanently deleted");
      } else {
        await projectService.deleteProject(project.id);
        toast.success("Project moved to trash");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error(
        mode === "permanent"
          ? "Failed to permanently delete project"
          : "Failed to delete project"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(val) => {
        if (!val) setConfirmName("");
        onOpenChange(val);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === "permanent"
              ? "Are you absolutely sure?"
              : "Move project to trash?"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-4">
              <div className="text-sm text-muted-foreground">
                {mode === "permanent" ? (
                  <>
                    This action <strong>cannot be undone</strong>. This will
                    permanently delete the project{" "}
                    <strong>{project.name}</strong> and remove all associated
                    data from the servers.
                  </>
                ) : (
                  <>
                    This will move the project <strong>{project.name}</strong>{" "}
                    to the Recycle Bin. You can restore it later if needed.
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  Please type <strong>{project.name}</strong> to confirm:
                </Label>
                <Input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="Enter project name"
                  className="border-destructive/50 focus-visible:ring-destructive"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Reason for deletion (Optional)
                </Label>
                <Textarea
                  placeholder="Optional reason..."
                  className="min-h-[60px] text-sm"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmName("")}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={confirmName !== project.name || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting
              ? "Processing..."
              : mode === "permanent"
              ? "I understand, delete permanently"
              : "Move to Trash"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
