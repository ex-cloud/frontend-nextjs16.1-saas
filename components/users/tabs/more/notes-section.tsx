"use client";

import { useState } from "react";
import { useUserComments, useAddComment } from "@/lib/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface NotesSectionProps {
  userId: string;
}

export function NotesSection({ userId }: NotesSectionProps) {
  const [comment, setComment] = useState("");
  const { data: comments, isLoading } = useUserComments(userId);
  const addMutation = useAddComment();

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    await addMutation.mutateAsync({ id: userId, body: comment });
    setComment("");
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Notes & Comments</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="bg-muted/30 p-2 rounded-md">
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
              placeholder="Write a note or comment..."
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
                Add Comment
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
            comments?.map((item) => (
              <div key={item.id} className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border border-background bg-blue-500 z-10" />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      {item.author?.name || "Unknown"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {item.type}
                    </span>
                    <span className="text-muted-foreground text-xs ml-auto">
                      {item.created_at}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-md text-sm">
                    {item.body}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
