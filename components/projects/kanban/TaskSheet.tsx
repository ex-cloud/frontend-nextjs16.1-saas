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
  Calendar,
  Clock,
  MessageSquare,
  History,
  Play,
  Plus,
  CheckCircle2,
  Trash2,
  Send,
} from "lucide-react";
import type { Task, Comment, TimeLog } from "@/types/project";
import { taskService } from "@/lib/api/services/task.service";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

  React.useEffect(() => {
    if (open && task) {
      fetchActivity();
      fetchComments();
      fetchTimeLogs();
      setEditedTitle(task.title);
      setEditedDesc(task.description || "");
    }
  }, [open, task, fetchActivity, fetchComments, fetchTimeLogs]);

  if (!task) return null;

  const handleToggleTimer = async () => {
    try {
      const res = await taskService.toggleTimeTracking(task.id);
      setIsTimerRunning(res.is_running);
      toast.success(res.is_running ? "Timer started" : "Timer stopped");
      fetchTimeLogs();
      fetchActivity();
    } catch {
      toast.error("Failed to toggle timer");
    }
  };

  const handleComplete = async () => {
    try {
      // Use 'done' to match Kanban column slugs (done, completed, finish)
      await taskService.updateTask(task.id, { status: "done" });
      toast.success("Task completed!");
      // Wait for refresh before closing to ensure UI updates
      if (onRefresh) {
        await onRefresh();
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to complete task:", error);
      toast.error("Failed to complete task");
    }
  };

  const handleUpdate = async (field: "title" | "description") => {
    try {
      await taskService.updateTask(task.id, {
        [field]: field === "title" ? editedTitle : editedDesc,
      });
      setIsEditingTitle(false);
      setIsEditingDesc(false);
      toast.success("Task updated");
      if (onRefresh) onRefresh();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await taskService.deleteTask(task.id);
        toast.success("Task deleted");
        if (onRefresh) onRefresh();
        onOpenChange(false);
      } catch {
        toast.error("Delete failed");
      }
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
    } catch (error) {
      console.error("Failed to add comment:", error);
      // Type-safe error handling without using `any`
      let errorMessage = "Failed to add comment";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Check for axios-like response structure
      if (typeof error === "object" && error !== null && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      toast.error(errorMessage);
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
                >
                  {isTimerRunning ? (
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
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Complete
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={() => handleUpdate("title")}
                onKeyDown={(e) => e.key === "Enter" && handleUpdate("title")}
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
                  <div className="flex items-center gap-2 pt-1">
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
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Due Date
                  </span>
                  <div className="flex items-center gap-2 pt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString()
                        : "No due date"}
                    </span>
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
                        onClick={() => handleUpdate("description")}
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
                  {activeTab === "comments" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add Comment
                    </Button>
                  )}
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
