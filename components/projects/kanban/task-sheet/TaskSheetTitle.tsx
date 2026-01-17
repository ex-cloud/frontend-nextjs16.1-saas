"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Task } from "@/types/project";

interface TaskSheetTitleProps {
  task: Task;
  onUpdate: (field: keyof Task, value: string) => void;
}

export function TaskSheetTitle({ task, onUpdate }: TaskSheetTitleProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedValue, setEditedValue] = React.useState(task.title);

  React.useEffect(() => {
    setEditedValue(task.title);
  }, [task.title]);

  const handleSave = () => {
    onUpdate("title", editedValue);
    setIsEditing(false);
  };

  return (
    <div className="group relative">
      {isEditing ? (
        <Textarea
          value={editedValue}
          onChange={(e) => setEditedValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSave();
            }
          }}
          autoFocus
          className="text-4xl font-bold h-auto py-0 px-0 border-none bg-transparent focus-visible:ring-0 resize-none min-h-[44px] leading-tight shadow-none"
        />
      ) : (
        <h1
          className="text-4xl font-bold leading-tight cursor-text hover:bg-muted/10 rounded-md px-1 -mx-1 transition-colors min-h-[44px]"
          onClick={() => setIsEditing(true)}
        >
          {task.title || "Untitled Task"}
        </h1>
      )}
    </div>
  );
}
