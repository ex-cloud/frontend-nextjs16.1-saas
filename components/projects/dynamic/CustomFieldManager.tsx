"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  Type,
  Hash,
  Calendar,
  ListFilter,
  Tags,
  FileText,
  GripVertical,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomFieldDefinition, CustomFieldType } from "@/types/project";
import { projectService } from "@/lib/api/services/project.service";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CustomFieldManagerProps {
  projectId: string | number;
  initialFields: CustomFieldDefinition[];
  onRefresh: () => void;
}

const FIELD_TYPES: {
  type: CustomFieldType;
  label: string;
  icon: React.ElementType;
}[] = [
  { type: "text", label: "Text", icon: Type },
  { type: "number", label: "Number", icon: Hash },
  { type: "date", label: "Date", icon: Calendar },
  { type: "select", label: "Select", icon: ListFilter },
  { type: "multi_select", label: "Multi-select", icon: Tags },
  { type: "files", label: "Files", icon: FileText },
  { type: "formula", label: "Formula", icon: Calculator },
];

export function CustomFieldManager({
  projectId,
  initialFields,
  onRefresh,
}: CustomFieldManagerProps) {
  const [fields, setFields] =
    React.useState<CustomFieldDefinition[]>(initialFields);

  React.useEffect(() => {
    setFields(initialFields);
  }, [initialFields]);

  const handleAddField = async (type: CustomFieldType) => {
    try {
      const newField = await projectService.createCustomField(projectId, {
        name: `New ${type} field`,
        type,
        position: fields.length,
      });
      setFields([...fields, newField]);
      toast.success("Property added");
      onRefresh();
    } catch {
      toast.error("Failed to add property");
    }
  };

  const handleUpdateName = async (fieldId: string | number, name: string) => {
    try {
      await projectService.updateCustomField(projectId, fieldId, { name });
      onRefresh();
    } catch {
      toast.error("Failed to update name");
    }
  };

  const handleDeleteField = async (fieldId: string | number) => {
    try {
      await projectService.deleteCustomField(projectId, fieldId);
      setFields(fields.filter((f) => f.id !== fieldId));
      toast.success("Property deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete property");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Properties</h3>
          <p className="text-xs text-muted-foreground">
            Manage custom fields for tasks in this project
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {FIELD_TYPES.map((ft) => (
              <DropdownMenuItem
                key={ft.type}
                onClick={() => handleAddField(ft.type)}
                className="gap-2"
              >
                <ft.icon className="h-4 w-4 text-muted-foreground" />
                {ft.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border bg-card/50">
        <div className="divide-y divide-border">
          {fields.length > 0 ? (
            fields.map((field) => {
              const Icon =
                FIELD_TYPES.find((ft) => ft.type === field.type)?.icon || Type;
              return (
                <div
                  key={field.id}
                  className="flex items-center gap-3 p-3 group transition-colors hover:bg-muted/30"
                >
                  <div className="cursor-grab text-muted-foreground/40 group-hover:text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      defaultValue={field.name}
                      onBlur={(e) => {
                        if (e.target.value !== field.name) {
                          handleUpdateName(field.id, e.target.value);
                        }
                      }}
                      className="h-8 border-none bg-transparent p-0 font-medium focus-visible:ring-0"
                    />
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {field.type.replace("_", " ")}
                      </div>
                      {field.type === "formula" && (
                        <div className="flex-1">
                          <Input
                            placeholder="e.g. {{price}} * {{quantity}}"
                            defaultValue={
                              (field.options as { formula?: string })
                                ?.formula || ""
                            }
                            onBlur={async (e) => {
                              const formula = e.target.value;
                              await projectService.updateCustomField(
                                projectId,
                                field.id,
                                {
                                  options: {
                                    ...(field.options as object),
                                    formula,
                                  },
                                }
                              );
                              onRefresh();
                            }}
                            className="h-6 text-[10px] bg-muted/50 border-dashed"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Property?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the &quot;{field.name}
                          &quot; property and all data associated with it in all
                          tasks.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteField(field.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-4">
                <Tags className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">
                No custom properties defined yet.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Add one to start tracking more data on your tasks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
