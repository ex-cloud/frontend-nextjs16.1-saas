"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  X,
  Paperclip,
  Loader2,
  Minimize2,
  Maximize2,
  Send,
} from "lucide-react";
import {
  useUserComments,
  useAddComment,
  useUploadAttachment,
} from "@/lib/hooks/use-users";
import { toast } from "sonner";
import { Comment } from "@/types/user";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface FloatingChatWidgetProps {
  userId: string;
}

export function FloatingChatWidget({ userId }: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Data Fetching
  const {
    data: comments,
    refetch: refetchComments,
    isLoading,
  } = useUserComments(userId);

  // Mutations
  const addCommentMutation = useAddComment();
  const uploadAttachmentMutation = useUploadAttachment();

  const isSubmitting =
    addCommentMutation.isPending || uploadAttachmentMutation.isPending;

  // Auto-scroll to bottom on new comments
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments, isOpen]);

  const handlePost = async () => {
    if (!commentText.trim() && !selectedFile) return;

    try {
      if (selectedFile) {
        await uploadAttachmentMutation.mutateAsync({
          id: userId,
          file: selectedFile,
        });
      }

      if (commentText.trim()) {
        await addCommentMutation.mutateAsync({
          id: userId,
          body: commentText,
        });
      }

      setCommentText("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      refetchComments();
      toast.success("Message sent");
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-105 transition-transform"
      >
        <MessageSquare className="h-6 w-6" />
        {comments && comments.length > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-background"></span>
        )}
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        "fixed bottom-6 right-6 shadow-2xl z-50 flex flex-col transition-all duration-300",
        isExpanded ? "w-[800px] h-[600px]" : "w-[350px] h-[500px]"
      )}
    >
      <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0 bg-primary/5">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Notes & Comments
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent
        className="flex-1 overflow-y-auto p-4 space-y-4"
        ref={scrollRef}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : comments?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm opacity-50">
            <MessageSquare className="h-8 w-8 mb-2" />
            <p>No notes yet.</p>
          </div>
        ) : (
          comments?.map((comment: Comment) => (
            <div key={comment.id} className="flex gap-3 text-sm">
              {/* Simple Avatar */}
              <div className="h-8 w-8 rounded-full bg-accent/50 flex items-center justify-center shrink-0 text-xs font-semibold">
                {comment.author?.name?.substring(0, 2).toUpperCase() || "??"}
              </div>
              <div className="flex flex-col gap-1 max-w-[85%]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs">
                    {comment.author?.name || "Unknown"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <div className="bg-muted/50 p-2 rounded-md rounded-tl-none">
                  <p className="whitespace-pre-wrap">{comment.body}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <CardFooter className="p-3 border-t bg-background flex flex-col gap-2">
        {selectedFile && (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md w-full">
            <Paperclip className="h-3 w-3" />
            <span className="truncate flex-1">{selectedFile.name}</span>
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="hover:text-green-800"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 w-full">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Textarea
            placeholder="Write a note..."
            className="min-h-[38px] max-h-[100px] resize-none py-2"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handlePost();
              }
            }}
          />

          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handlePost}
            disabled={(!commentText.trim() && !selectedFile) || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
