"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/user";
import { formatDistanceToNow, format } from "date-fns";
import { QuickActionsCard } from "@/components/users/tabs/more/sidebar";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { useUploadAvatar, useDeleteAvatar } from "@/lib/hooks/use-users";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UserDetailsSidebarProps {
  user: User;
  userId: string;
}

export function UserDetailsSidebar({ user, userId }: UserDetailsSidebarProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();

  const handleAvatarChange = async (file: File | null) => {
    if (!file) return;

    setAvatarFile(file);

    try {
      await uploadAvatarMutation.mutateAsync({ id: userId, file });

      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });

      setAvatarFile(null);
      toast.success("Avatar uploaded successfully");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to upload avatar";
      toast.error(message);
      setAvatarFile(null);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await deleteAvatarMutation.mutateAsync(userId);
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });

      setAvatarFile(null);
      toast.success("Avatar removed successfully");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to remove avatar";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Card with Avatar */}
      <Card className="shadow-none rounded-md">
        <CardContent className="pt-2">
          {/* Avatar Upload */}
          <div className="mb-4 w-full">
            <AvatarUpload
              key={user.avatar_url || "avatar-upload"}
              value={avatarFile || user.avatar_url || null}
              onChange={handleAvatarChange}
              onRemove={handleAvatarRemove}
              maxSize={2 * 1024 * 1024}
              disabled={
                uploadAvatarMutation.isPending || deleteAvatarMutation.isPending
              }
            />
          </div>

          {/* Name and Role */}
          <div className="text-center">
            <h3 className="font-semibold text-lg">{user.name || "User"}</h3>
            <p className="text-sm text-muted-foreground">
              {user.username || "username"}
            </p>
          </div>

          {/* User ID and Joined */}
          <div className="grid grid-cols-2 gap-4 w-full mt-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">
                User ID
              </p>
              <p className="text-sm font-medium">
                {user.employee_number || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">
                Joined
              </p>
              <p className="text-sm font-medium">
                {user.join_date
                  ? format(new Date(user.join_date), "MMM yyyy")
                  : user.created_at
                  ? format(new Date(user.created_at), "MMM yyyy")
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Quick Actions */}
      <QuickActionsCard />

      {/* Connections (Placeholder) */}
      <Card className="card shadow-none rounded-md">
        <CardHeader className="card-header">
          <CardTitle className="text-base font-medium">Connections</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y text-sm">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Attendance</span>
              </div>
              <Badge variant="secondary" className="rounded-full px-2">
                24
              </Badge>
            </div>
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span>Leave Applications</span>
              </div>
              <Badge variant="secondary" className="rounded-full px-2">
                2
              </Badge>
            </div>
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Salary Slips</span>
              </div>
              <Badge variant="secondary" className="rounded-full px-2">
                12
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground px-1">
        <div>
          <span className="block font-semibold mb-1">Created</span>
          {user.created_at
            ? formatDistanceToNow(new Date(user.created_at), {
                addSuffix: true,
              })
            : "N/A"}
        </div>
        <div>
          <span className="block font-semibold mb-1">Modified</span>
          {user.updated_at
            ? formatDistanceToNow(new Date(user.updated_at), {
                addSuffix: true,
              })
            : "N/A"}
        </div>
      </div>
    </div>
  );
}
