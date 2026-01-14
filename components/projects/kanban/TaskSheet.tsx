"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  MessageSquare,
  History,
  Play,
  CheckCircle2,
  Trash2,
  Send,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react";
import type { Task, Comment, TimeLog, ProjectMember } from "@/types/project";
import { taskService } from "@/lib/api/services/task.service";
import { projectService } from "@/lib/api/services/project.service";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import axios from "axios";
import { Input } from "@/components/ui/input";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";

interface TaskSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

export function TaskSheet({
  task,
  open,
  onOpenChange,
  onRefresh,
}: TaskSheetProps) {
  const [activeTab, setActiveTab] = React.useState<
    "activity" | "comments" | "time"
  >("activity");
  const [activity, setActivity] = React.useState<
    Array<{ message: string; created_at: string; user?: { name: string } }>
  >([]);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [timeLogs, setTimeLogs] = React.useState<TimeLog[]>([]);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [newComment, setNewComment] = React.useState("");
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [isEditingDesc, setIsEditingDesc] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState("");
  const [editedDesc, setEditedDesc] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [projectMembers, setProjectMembers] = React.useState<ProjectMember[]>(
    []
  );
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [isTogglingTimer, setIsTogglingTimer] = React.useState(false);

  const fetchActivity = React.useCallback(async () => {
    if (task) {
      try {
        const data = await taskService.getTaskActivity(task.id);
        setActivity(data);
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      }
    }
  }, [task]);

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

  const fetchTimeLogs = React.useCallback(async () => {
    if (task) {
      try {
        const data = await taskService.getTaskTimeLogs(task.id);
        setTimeLogs(data);
      } catch (error) {
        console.error("Failed to fetch time logs:", error);
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
      fetchActivity();
      fetchComments();
      fetchTimeLogs();
      fetchMembers();
      checkRunningTimer();
      setEditedTitle(task.title);
      setEditedDesc(task.description || "");
    }
  }, [
    open,
    task,
    fetchActivity,
    fetchComments,
    fetchTimeLogs,
    fetchMembers,
    checkRunningTimer,
  ]);

  if (!task) return null;

  const handleToggleTimer = async () => {
    try {
      setIsTogglingTimer(true);
      const res = await taskService.toggleTimeTracking(task.id);
      setIsTimerRunning(res.is_running);
      toast.success(res.is_running ? "Timer started" : "Timer stopped");
      fetchTimeLogs();
      fetchActivity();
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
      if (onRefresh) await onRefresh();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Failed to complete task:", error);
      toast.error("Failed to complete task");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleUpdate = async (
    field: string,
    value: string | number | null | undefined
  ) => {
    try {
      await taskService.updateTask(task.id, {
        [field]: value,
      });
      setIsEditingTitle(false);
      setIsEditingDesc(false);
      toast.success(`${field.replace("_", " ")} updated`);
      if (onRefresh) onRefresh();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await taskService.deleteTask(task.id);
      toast.success("Task deleted");
      if (onRefresh) onRefresh();
      onOpenChange(false);
    } catch {
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      setIsLoading(true);
      await taskService.addComment(task.id, { body: newComment });
      setNewComment("");
      fetchComments();
      fetchActivity();
    } catch (error: unknown) {
      let message = "Failed to add comment";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] p-0 flex flex-col">
        <div className="p-6 pb-4">
          <SheetHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 uppercase tracking-wider font-bold"
              >
                {task.task_number}
              </Badge>
              <div className="flex items-center gap-2">
                <Button
                  variant={isTimerRunning ? "destructive" : "outline"}
                  size="sm"
                  className="h-8 gap-2"
                  onClick={handleToggleTimer}
                  disabled={isTogglingTimer}
                >
                  {isTogglingTimer ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isTimerRunning ? (
                    <Clock className="h-3.5 w-3.5 animate-pulse" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  {isTimerRunning ? "Stop Timer" : "Track Time"}
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-2"
                  onClick={handleComplete}
                  disabled={isCompleting || task.status === "done"}
                >
                  {isCompleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {task.status === "done" ? "Completed" : "Complete"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the task &quot;{task.title}&quot; and remove all
                        associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Task
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={() => handleUpdate("title", editedTitle)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleUpdate("title", editedTitle)
                }
                autoFocus
                className="text-2xl font-semibold h-auto py-1 px-2 -ml-2"
              />
            ) : (
              <SheetTitle
                className="text-2xl leading-tight cursor-pointer hover:bg-muted/50 rounded px-2 -ml-2 transition-colors"
                onClick={() => setIsEditingTitle(true)}
              >
                {task.title}
              </SheetTitle>
            )}
            <SheetDescription className="text-sm">
              Current Status:{" "}
              <span className="text-foreground font-semibold capitalize">
                {task.status?.replace("_", " ") ?? "To Do"}
              </span>
            </SheetDescription>
          </SheetHeader>
        </div>

        <Separator />

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center px-4 h-12 bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-2 text-xs rounded-none border-b-2 border-transparent px-4",
                activeTab === "activity" &&
                  "border-sidebar-primary text-sidebar-primary bg-sidebar-accent/50"
              )}
              onClick={() => setActiveTab("activity")}
            >
              <History className="h-4 w-4" />
              Activity
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-2 text-xs rounded-none border-b-2 border-transparent px-4",
                activeTab === "comments" &&
                  "border-sidebar-primary text-sidebar-primary bg-sidebar-accent/50"
              )}
              onClick={() => setActiveTab("comments")}
            >
              <MessageSquare className="h-4 w-4" />
              Comments
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-2 text-xs rounded-none border-b-2 border-transparent px-4",
                activeTab === "time" &&
                  "border-sidebar-primary text-sidebar-primary bg-sidebar-accent/50"
              )}
              onClick={() => setActiveTab("time")}
            >
              <Clock className="h-4 w-4" />
              Time Logs
            </Button>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8">
              {/* Task Details Section */}
              <div className="grid grid-cols-2 gap-6 pb-6 border-b border-sidebar-border/30">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Assignee
                  </span>
                  <div className="pt-1">
                    <Select
                      value={String(task.assignee_id || "unassigned")}
                      onValueChange={(val) =>
                        handleUpdate(
                          "assignee_id",
                          val === "unassigned" ? null : val
                        )
                      }
                    >
                      <SelectTrigger className="h-8 border-none bg-transparent hover:bg-muted/50 transition-colors p-1 -ml-1 w-auto min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={`https://avatar.vercel.sh/${task.assignee?.id}.png`}
                            />
                            <AvatarFallback>
                              {task.assignee?.name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {task.assignee?.name || "Unassigned"}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {projectMembers.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.user?.name || "Unknown"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Due Date
                  </span>
                  <div className="pt-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-2 p-1 -ml-1 font-medium hover:bg-muted/50"
                        >
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {task.due_date
                              ? format(new Date(task.due_date), "PPP")
                              : "No due date"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarPicker
                          mode="single"
                          selected={
                            task.due_date ? new Date(task.due_date) : undefined
                          }
                          onSelect={(date) =>
                            handleUpdate("due_date", date?.toISOString())
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Description
                </span>
                {isEditingDesc ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedDesc}
                      onChange={(e) => setEditedDesc(e.target.value)}
                      className="min-h-[100px] text-sm"
                      placeholder="Add a detailed description..."
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingDesc(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate("description", editedDesc)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-sm text-foreground/80 leading-relaxed cursor-pointer hover:bg-muted/30 p-2 -m-2 rounded transition-colors min-h-[40px]"
                    onClick={() => setIsEditingDesc(true)}
                  >
                    {task.description || "No description provided."}
                  </div>
                )}
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {activeTab === "activity"
                      ? "Recent Activity"
                      : activeTab === "comments"
                      ? "Discussion"
                      : "Time Tracking"}
                  </span>
                </div>

                {activeTab === "activity" && (
                  <div className="space-y-4">
                    {activity.length > 0 ? (
                      activity.map((act, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="relative mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-sidebar-primary ring-4 ring-sidebar-primary/10" />
                            {i !== activity.length - 1 && (
                              <div className="absolute top-2 left-1 -ml-[1px] w-[2px] h-full bg-sidebar-border/30" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-foreground/90">
                              {act.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {act.created_at
                                ? formatDistanceToNow(new Date(act.created_at))
                                : "some time"}{" "}
                              ago
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic py-4">
                        No recent activity found.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "comments" && (
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src="https://avatar.vercel.sh/me.png" />
                        <AvatarFallback>ME</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Write a comment..."
                          className="text-xs min-h-[80px]"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            className="h-8 gap-2"
                            onClick={handleAddComment}
                            disabled={isLoading || !newComment.trim()}
                          >
                            <Send className="h-3.5 w-3.5" />
                            Post Comment
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 pt-2">
                      {comments.length > 0 ? (
                        comments.map((comment, i) => (
                          <div key={i} className="flex gap-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={comment.author?.avatar_url} />
                              <AvatarFallback>
                                {comment.author?.name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground">
                                  {comment.author?.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {comment.created_at
                                    ? formatDistanceToNow(
                                        new Date(comment.created_at)
                                      )
                                    : "recently"}{" "}
                                  ago
                                </span>
                              </div>
                              <p className="text-sm text-foreground/80 leading-snug">
                                {comment.body}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <MessageSquare className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground italic">
                            No comments yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "time" && (
                  <div className="space-y-4">
                    {timeLogs.length > 0 ? (
                      <div className="rounded-md border border-sidebar-border/30 overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-muted/50 uppercase tracking-tight font-bold text-[10px]">
                            <tr>
                              <th className="p-2 pl-4">User</th>
                              <th className="p-2">Date</th>
                              <th className="p-2 text-right pr-4">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-sidebar-border/30">
                            {timeLogs.map((log, i) => (
                              <tr key={i} className="hover:bg-muted/20">
                                <td className="p-2 pl-4 flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={log.user?.avatar_url} />
                                    <AvatarFallback>
                                      {log.user?.name?.[0] || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  {log.user?.name || "User"}
                                </td>
                                <td className="p-2 text-muted-foreground">
                                  {log.start_time
                                    ? new Date(
                                        log.start_time
                                      ).toLocaleDateString()
                                    : "-"}
                                </td>
                                <td className="p-2 text-right pr-4 font-medium">
                                  {log.duration_minutes}m
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">
                          No time logged for this task.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
