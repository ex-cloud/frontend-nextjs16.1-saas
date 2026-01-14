import { useState, useRef } from "react";
import {
  useUserComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
  useClearComments,
} from "@/lib/hooks/use-users";
import { Comment } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Reply,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  Eraser,
} from "lucide-react";

interface NotesSectionProps {
  userId: string;
  allowClear?: boolean;
}

export function NotesSection({
  userId,
  allowClear = false,
}: NotesSectionProps) {
  const { data: session } = useSession();
  const currentUser = session?.user;

  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(
    null
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Enable polling (Real-time updates)
  const {
    data: comments,
    isLoading,
    refetch,
    isRefetching,
  } = useUserComments(userId, {
    refetchInterval: 3000,
  });

  // Robust Super Admin check without 'any'
  const roles = currentUser?.roles || [];
  const isSuperAdmin = roles.some((role) => {
    const roleName =
      typeof role === "string" ? role : (role as { name: string }).name;
    return roleName?.toLowerCase() === "super admin";
  });

  const addMutation = useAddComment();
  const updateMutation = useUpdateComment();
  const deleteMutation = useDeleteComment();
  const clearMutation = useClearComments();

  const handleReply = (commentId: number, authorName: string) => {
    setReplyTo({ id: commentId, name: authorName });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleEdit = (item: Comment) => {
    setEditingId(item.id);
    setEditBody(item.body);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditBody("");
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editBody.trim()) return;
    await updateMutation.mutateAsync({ userId, commentId, body: editBody });
    setEditingId(null);
    setEditBody("");
  };

  const handleDelete = async (commentId: number) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      await deleteMutation.mutateAsync({ userId, commentId });
    }
  };

  const handleClearChat = async () => {
    if (
      confirm(
        "Are you sure you want to clear ALL comments? This cannot be undone."
      )
    ) {
      await clearMutation.mutateAsync(userId);
    }
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    await addMutation.mutateAsync({
      id: userId,
      body: comment,
      parent_id: replyTo?.id,
    });
    setComment("");
    setReplyTo(null);
  };

  // Group comments for threading
  const rootComments = comments?.filter((c) => !c.parent_id) || [];
  const getReplies = (parentId: number) =>
    comments?.filter((c) => c.parent_id === parentId) || [];

  const renderComment = (item: Comment, isReply = false) => {
    // Current user resolution
    const currentUserId = currentUser?.id;
    const authorId = item.author?.id;

    // Strict comparison after normalization
    const isMe =
      currentUserId !== undefined &&
      authorId !== undefined &&
      String(currentUserId) === String(authorId);

    const isEditing = editingId === item.id;
    const canEdit = isMe || isSuperAdmin;

    // Debug logging for per-comment permission check (commented out for prod)
    // console.log(`Comment ${item.id} - isMe: ${isMe}, isSA: ${isSuperAdmin}, canEdit: ${canEdit}`);

    return (
      <div
        key={item.id}
        className={`relative group ${isReply ? "pl-8 mt-2" : "pl-10 mt-4"}`}
      >
        {/* Connector line for replies */}
        {!isReply && (
          <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border border-background bg-blue-500 z-10" />
        )}
        {isReply && (
          <div className="absolute left-[10px] top-[-10px] bottom-[20px] w-px bg-border rounded-bl-xl border-l-2 border-b-2 border-transparent" />
        )}

        <div className="flex flex-col gap-1 w-full">
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {isMe ? "Me" : item.author?.name || "Unknown"}
              </span>
              <span className="text-muted-foreground text-xs">{item.type}</span>
              <span className="text-muted-foreground text-xs">
                {item.created_at}
              </span>
            </div>

            {/* Actions Dropdown */}
            {canEdit && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(item)}>
                    <Pencil className="mr-2 h-3 w-3" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-3 w-3" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="flex flex-col gap-2 mt-1">
              <Textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="min-h-[60px]"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveEdit(item.id)}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted/40 p-3 rounded-md text-sm group-hover:bg-muted/60 transition-colors break-words whitespace-pre-wrap">
              {item.body}
            </div>
          )}

          {/* Reply Button */}
          {item.author && !isMe && !isReply && !isEditing && (
            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity -mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => handleReply(item.id, item.author!.name)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            </div>
          )}
        </div>

        {/* Render Replies */}
        {!isReply && (
          <div className="space-y-2">
            {getReplies(item.id).map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="card shadow-none rounded-md">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Notes & Comments</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw
                className={`h-3 w-3 ${isRefetching ? "animate-spin" : ""}`}
              />
              Sync
            </Button>
            {allowClear && isSuperAdmin && (
              <Button
                variant="destructive"
                size="sm"
                className="h-8 gap-2"
                onClick={handleClearChat}
                disabled={clearMutation.isPending || comments?.length === 0}
              >
                <Eraser className="h-3 w-3" />
                Clear Chat
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="bg-muted/30 p-2 rounded-md">
            {/* Reply Indicator */}
            {replyTo && (
              <div className="flex items-center justify-between bg-blue-50/50 p-2 mb-2 rounded border border-blue-100 text-xs text-blue-700">
                <span>
                  Replying to <b>{replyTo.name}</b>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent text-blue-700"
                  onClick={handleCancelReply}
                >
                  X
                </Button>
              </div>
            )}

            <div className="flex gap-2 mb-2 p-1 border-b">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="font-bold">B</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="italic">I</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                list
              </Button>
            </div>
            <Textarea
              ref={textareaRef}
              placeholder={
                replyTo
                  ? `Reply to ${replyTo.name}...`
                  : "Write a note or comment..."
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] border-0 bg-transparent focus-visible:ring-0 resize-none"
            />
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={addMutation.isPending || !comment.trim()}
              >
                {addMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {replyTo ? "Send Reply" : "Add Comment"}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6 relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet.
            </p>
          ) : (
            rootComments.map((item) => renderComment(item))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
