"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Task } from "@/types/project";

interface TaskSheetDescriptionProps {
  task: Task;
  onUpdate: (field: keyof Task, value: string) => void;
}

export function TaskSheetDescription({
  task,
  onUpdate,
}: TaskSheetDescriptionProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedValue, setEditedValue] = React.useState(task.description || "");

  React.useEffect(() => {
    setEditedValue(task.description || "");
  }, [task.description]);

  const handleSave = () => {
    onUpdate("description", editedValue);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            className="min-h-[150px] text-base leading-relaxed p-0 border-none bg-transparent focus-visible:ring-0 resize-none shadow-none"
            placeholder="Add a detailed description..."
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="group/desc relative cursor-text min-h-[100px]"
          onClick={() => setIsEditing(true)}
        >
          <div
            className={cn(
              "text-base leading-relaxed transition-colors",
              !task.description && "text-muted-foreground/40 italic"
            )}
          >
            {task.description || "Press enter to add description..."}
          </div>
        </div>
      )}
    </div>
  );
}
