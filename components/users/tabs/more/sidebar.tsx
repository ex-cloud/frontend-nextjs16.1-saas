"use client";

import { User } from "@/types/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mail, Building, KeyRound } from "lucide-react";
import { useState } from "react";
import { useUpdateUser } from "@/lib/hooks/use-users";
import { format } from "date-fns";

interface UserSidebarProps {
  user: User;
}

export function UserSidebar({ user }: UserSidebarProps) {
  const [tagInput, setTagInput] = useState("");
  const updateMutation = useUpdateUser();

  const handleAddTag = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      // Optimistic update logic simulation (actual update sends all tags)
      const currentTags = user.tags?.map((t) => t.name) || [];
      if (currentTags.includes(tagInput.trim())) {
        setTagInput("");
        return;
      }

      const newTags = [...currentTags, tagInput.trim()];

      try {
        await updateMutation.mutateAsync({
          id: user.id,
          data: { tags: newTags },
        });
        setTagInput("");
      } catch {
        // Error handled in hook
      }
    }
  };

  const removeTag = async (tagName: string) => {
    const currentTags = user.tags?.map((t) => t.name) || [];
    const newTags = currentTags.filter((t) => t !== tagName);
    await updateMutation.mutateAsync({
      id: user.id,
      data: { tags: newTags },
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" size="sm">
            <KeyRound className="mr-2 h-4 w-4" /> Reset Password
          </Button>
          <Button variant="outline" className="w-full justify-start" size="sm">
            <Mail className="mr-2 h-4 w-4" /> Send Email
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            size="sm"
          >
            <Building className="mr-2 h-4 w-4" /> Block Access
          </Button>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {user.tags?.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground px-2 py-1"
                onClick={() => removeTag(tag.name)}
              >
                #{tag.name}
              </Badge>
            ))}
            {(!user.tags || user.tags.length === 0) && (
              <span className="text-sm text-muted-foreground">No tags</span>
            )}
          </div>
          <Input
            placeholder="Add tag + Enter..."
            className="h-8 text-sm"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            disabled={updateMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Dates/Meta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meta Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium">
              {format(new Date(user.created_at), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Last Login</span>
            <span className="font-medium">
              {user.last_login_at
                ? format(new Date(user.last_login_at), "MMM d, HH:mm")
                : "Never"}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={user.is_active ? "default" : "secondary"}>
              {user.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {user.profile?.preferred_workspace && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Workspace</span>
              <span className="font-medium">
                {user.profile.preferred_workspace}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
