"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, CalendarIcon } from "lucide-react";
import { taskService } from "@/lib/api/services/task.service";
import { projectService } from "@/lib/api/services/project.service";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import type { ProjectMember } from "@/types/project";
// teamApi import removed as we use projectService for members now

const taskSchema = z.object({
  project_id: z.string().or(z.number()),
  board_id: z.string().or(z.number()),
  list_id: z.string().or(z.number()),
  title: z.string().min(3, "Title too short"),
  description: z.string().optional(),
  type: z.enum(["task", "bug", "story", "epic"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  team_id: z.string().optional(),
  assignee_id: z.string().optional(),
  due_date: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | number;
  boardId: string | number;
  listId: string | number;
  onSuccess?: () => void;
}

export function TaskDialog({
  open,
  onOpenChange,
  projectId,
  boardId,
  listId,
  onSuccess,
}: TaskDialogProps) {
  const [projectMembers, setProjectMembers] = React.useState<ProjectMember[]>(
    []
  );
  const [isAiSuggesting, setIsAiSuggesting] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      project_id: projectId,
      board_id: boardId,
      list_id: listId,
      title: "",
      description: "",
      type: "task",
      priority: "medium",
    },
  });

  const selectedTeamId = form.watch("team_id");

  // Load Project Members on Open
  React.useEffect(() => {
    if (open && projectId) {
      projectService
        .getProjectMembers(String(projectId))
        .then((members) => {
          setProjectMembers(members);
        })
        .catch(() => toast.error("Failed to load project members"));
    }
  }, [open, projectId]);

  // Filter members based on selected team (Client-side)
  // If a user selects a Team (optional), we could filter the list.
  // Currently, we don't display a visible Team Select by default, so this just passes through all members.
  const filteredMembers = React.useMemo(() => {
    if (!selectedTeamId) return projectMembers;
    return projectMembers.filter(
      (m) =>
        String(m.team_id || m.membership?.team_id) === String(selectedTeamId)
    );
  }, [projectMembers, selectedTeamId]);

  const handleAiSuggest = async () => {
    const title = form.getValues("title");
    if (!title) {
      toast.error("Please enter a title first");
      return;
    }

    setIsAiSuggesting(true);
    try {
      const suggestion = await taskService.suggestAssignee(
        projectId,
        title,
        form.getValues("description")
      );
      form.setValue("assignee_id", String(suggestion.suggested_assignee_id));
      toast.success("AI suggested: " + suggestion.reasoning);
    } catch {
      toast.error("AI could not find a suggestion");
    } finally {
      setIsAiSuggesting(false);
    }
  };

  async function onSubmit(values: TaskFormValues) {
    setLoading(true);
    try {
      await taskService.createTask(
        values as unknown as Parameters<typeof taskService.createTask>[0]
      );
      toast.success("Task created");
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch {
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a task and assign it to a project member.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="What needs to be done?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="epic">Epic</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {/* Hidden Team Field for optional metadata if we re-enable strict filtering 
                or if we want to submit team_id. 
                For now, keeping it hidden but form-controlled.
            */}
            <div className="hidden">
              <FormField
                control={form.control}
                name="team_id"
                render={({ field }) => <Input type="hidden" {...field} />}
              />
            </div>

            <FormField
              control={form.control}
              name="assignee_id"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Assignee</FormLabel>
                    {/* Only show AI suggest if there are members to suggest from */}
                    {filteredMembers.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] gap-1 text-sidebar-primary"
                        onClick={handleAiSuggest}
                        disabled={isAiSuggesting}
                      >
                        <Sparkles className="h-3 w-3" />
                        AI Suggest
                      </Button>
                    )}
                  </div>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Project Member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredMembers.map((m) => (
                        <SelectItem
                          key={m.id + "_" + (m.role || "member")}
                          value={String(m.id)}
                        >
                          {m.user?.name || "Unknown"}{" "}
                          {m.role ? `(${m.role})` : ""}
                        </SelectItem>
                      ))}
                      {filteredMembers.length === 0 && (
                        <SelectItem value="none" disabled>
                          No members found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[100px]" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) => field.onChange(date?.toISOString())}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
