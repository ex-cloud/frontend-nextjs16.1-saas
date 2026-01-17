"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DeleteProjectDialog } from "@/components/projects/modals/DeleteProjectDialog";
import { Project } from "@/types/project";
import { Department } from "@/types/hrm";

interface GeneralTabProps {
  project: Project;
  departments: Department[];
  availableOwners: { id: string | number; name: string; avatar_url?: string }[];
  selectedDeptId: string | undefined;
  setSelectedDeptId: (id: string | undefined) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  saving: boolean;
  handleSave: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  onDeleteSuccess: () => void;
}

export function GeneralTab({
  project,
  departments,
  availableOwners,
  selectedDeptId,
  setSelectedDeptId,
  selectedDate,
  setSelectedDate,
  saving,
  handleSave,
  showDeleteDialog,
  setShowDeleteDialog,
  onDeleteSuccess,
}: GeneralTabProps) {
  return (
    <form
      onSubmit={handleSave}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      <div className="md:col-span-2 space-y-6">
        <Card className="border-sidebar-border/40 shadow-sm">
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>Basic details about your project</CardDescription>
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
                  value={selectedDeptId || "none"}
                  onValueChange={setSelectedDeptId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
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
            <Button type="submit" className="w-full gap-2" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
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
                onSuccess={onDeleteSuccess}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
