"use client";

import { useState, useRef } from "react";
import {
  useUserComments,
  useAddComment,
  useUploadAttachment,
} from "@/lib/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Loader2, X, Bold, Italic, List } from "lucide-react";
import { toast } from "sonner";
import { Comment } from "@/types/user";
import { formatDistanceToNow } from "date-fns";

interface NotesAndCommentsProps {
  userId: string;
}

export function NotesAndComments({ userId }: NotesAndCommentsProps) {
  const [commentText, setCommentText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data
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
      toast.success("Comment added");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Notes & Comments</h3>

        {/* Editor Box */}
        <div className="border rounded-md bg-background shadow-sm">
          {/* Fake Toolbar for visual matching */}
          <div className="flex items-center gap-2 p-2 border-b bg-muted/20">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Bold className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Italic className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <List className="h-3 w-3" />
            </Button>
          </div>

          <Textarea
            placeholder="Write a note or comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[100px] border-none shadow-none focus-visible:ring-0 resize-y p-3"
            disabled={isSubmitting}
          />

          <div className="p-2 flex items-center justify-between border-t bg-muted/10">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
              />
              {selectedFile ? (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  <Paperclip className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">
                    {selectedFile.name}
                  </span>
                  <button onClick={() => setSelectedFile(null)} type="button">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-8"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach File
                </Button>
              )}
            </div>

            <Button
              size="sm"
              onClick={handlePost}
              disabled={(!commentText.trim() && !selectedFile) || isSubmitting}
              className="h-8"
            >
              {isSubmitting && (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              )}
              Add Comment
            </Button>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4 pt-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm">
            Loading...
          </div>
        ) : comments?.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm italic py-4">
            No comments yet.
          </div>
        ) : (
          <div className="space-y-6">
            {comments?.map((comment: Comment) => (
              <div
                key={comment.id}
                className="relative pl-4 border-l-2 border-muted pb-0"
              >
                {/* Dot */}
                <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-background" />

                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {comment.author?.name || "Unknown"}
                    </span>
                    <span className="text-muted-foreground">commented</span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <div className="text-sm bg-muted/20 p-3 rounded-md">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {comment.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
