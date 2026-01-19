"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Comment } from "@/types/project";
import { taskService } from "@/lib/api/services/task.service";
import { toast } from "sonner";
import axios from "axios";

interface TaskSheetCommentsProps {
  taskId: string | number;
  comments: Comment[];
  onRefresh: () => void;
}

export function TaskSheetComments({
  taskId,
  comments,
  onRefresh,
}: TaskSheetCommentsProps) {
  const [newComment, setNewComment] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      setIsLoading(true);
      await taskService.addComment(taskId, { body: newComment });
      setNewComment("");
      onRefresh();
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
    <div className="space-y-6 pt-12 border-t">
      <div
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4 cursor-pointer hover:text-foreground transition-colors"
        onClick={() => {
          // Basic focus logic if direct ref is not available, or just visual feedback.
          // To be robust, we'll add a ref to the Textarea in the next step.
          document.getElementById("comment-input")?.focus();
        }}
      >
        <MessageSquare className="h-4 w-4" />
        <span>Comments</span>
      </div>

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={`https://avatar.vercel.sh/${comment.user_id}.png`}
              />
              <AvatarFallback>
                {comment.author?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {comment.author?.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-sm text-foreground/90">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 pt-4">
        <Avatar className="h-8 w-8">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex flex-col gap-3">
          <Textarea
            id="comment-input"
            placeholder="Add a comment... (Press click on 'Comments' header to focus here too)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] bg-muted/20 border-none focus-visible:ring-1 resize-none text-sm"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              className="h-8 px-4"
              onClick={handleAddComment}
              disabled={isLoading || !newComment.trim()}
            >
              {isLoading && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
