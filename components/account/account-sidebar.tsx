"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import {
  useUploadAvatar,
  useDeleteAvatar,
  profileKeys,
} from "@/lib/hooks/use-profile";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types/user";

interface AccountSidebarProps {
  profile: User | undefined;
}

export function AccountSidebar({ profile }: AccountSidebarProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    if (!profile) return 0;

    const fields = [
      profile.name,
      profile.email,
      profile.username,
      profile.phone,
      profile.employee_number,
      profile.department_id,
      profile.position_id,
      profile.avatar_url,
      profile.profile?.bio,
      profile.profile?.birth_date,
    ];

    const filledFields = fields.filter(
      (f) => f !== null && f !== undefined && f !== ""
    ).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion();
  const isEmailVerified = !!profile?.email_verified_at;

  // Avatar handlers
  const handleAvatarChange = async (file: File | null) => {
    if (!file) return;

    setAvatarFile(file);
    try {
      await uploadAvatarMutation.mutateAsync(file);
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
      setAvatarFile(null);
    } catch {
      setAvatarFile(null);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await deleteAvatarMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
      setAvatarFile(null);
    } catch {
      // Error handled by mutation
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
              key={profile?.avatar_url || "avatar-upload"}
              value={avatarFile || profile?.avatar_url || null}
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
            <h3 className="font-semibold text-lg">{profile?.name || "User"}</h3>
            <p className="text-sm text-muted-foreground">
              {profile?.username || "username"}
            </p>
          </div>

          {/* User ID and Joined */}
          <div className="grid grid-cols-2 gap-4 w-full mt-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">
                User ID
              </p>
              <p className="text-sm font-medium">
                {profile?.employee_number || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">
                Joined
              </p>
              <p className="text-sm font-medium">
                {profile?.join_date
                  ? format(new Date(profile.join_date), "MMM yyyy")
                  : profile?.created_at
                  ? format(new Date(profile.created_at), "MMM yyyy")
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Stats */}
      <Card className="shadow-none rounded-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Connection Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Completion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Profile Completion</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {/* Verification Status */}
          <div className="flex items-center justify-between text-sm">
            <span>Verification</span>
            {isEmailVerified ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-600">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Pending</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tags Section */}
      <Card className="shadow-none rounded-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profile?.department?.name && (
              <Badge variant="secondary" className="px-3 py-1">
                {profile.department.name}
              </Badge>
            )}
            {profile?.position?.name && (
              <Badge variant="outline" className="px-3 py-1">
                {profile.position.name}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Add custom tag...
          </p>
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground px-1">
        <div>
          <span className="block font-semibold mb-1">Record Created</span>
          {profile?.created_at
            ? formatDistanceToNow(new Date(profile.created_at), {
                addSuffix: true,
              })
            : "N/A"}
        </div>
        <div>
          <span className="block font-semibold mb-1">Last Updated</span>
          {profile?.updated_at
            ? formatDistanceToNow(new Date(profile.updated_at), {
                addSuffix: true,
              })
            : "N/A"}
        </div>
      </div>
    </div>
  );
}
