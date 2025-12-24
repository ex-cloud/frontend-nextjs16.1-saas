"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { User } from "@/types/user";
import {
  useUpdateUser,
  useUploadAvatar,
  useDeleteAvatar,
} from "@/lib/hooks/use-users";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface UserDetailsTabProps {
  user: User;
  userId: string;
}

const userDetailsSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Full name is required"),
  first_name: z.string().optional(),
  middle_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  language: z.string().optional(),
  time_zone: z.string().optional(),
  is_active: z.boolean(),
});

type UserDetailsFormData = z.infer<typeof userDetailsSchema>;

export function UserDetailsTab({ user, userId }: UserDetailsTabProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const queryClient = useQueryClient();
  const updateMutation = useUpdateUser();
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();

  const form = useForm<UserDetailsFormData>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: {
      email: user.email || "",
      name: user.name || "",
      first_name: user.first_name || "",
      middle_name: user.middle_name || "",
      last_name: user.last_name || "",
      username: user.username || "",
      language: user.language || "English",
      time_zone: user.time_zone || "Asia/Jakarta",
      is_active: user.is_active,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = form;

  const isActive = useWatch({
    control: form.control,
    name: "is_active",
  });

  const onSubmit = async (data: UserDetailsFormData) => {
    try {
      // Update basic user info
      await updateMutation.mutateAsync({
        id: userId,
        data: {
          email: data.email,
          name: data.name,
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          username: data.username,
          language: data.language,
          time_zone: data.time_zone,
          is_active: data.is_active,
        },
      });

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });

      toast.success("User details updated successfully");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update user";
      toast.error(message);
    }
  };

  const handleAvatarChange = async (file: File | null) => {
    if (!file) return;

    setAvatarFile(file);

    // Upload immediately
    try {
      await uploadAvatarMutation.mutateAsync({ id: userId, file });

      // Invalidate and refetch user data
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

      // Invalidate and refetch user data
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-4 pb-4">
      {/* Enabled Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="enabled"
          checked={isActive}
          onCheckedChange={(checked) =>
            setValue("is_active", checked as boolean, { shouldDirty: true })
          }
        />
        <Label htmlFor="enabled" className="font-medium cursor-pointer">
          Enabled
        </Label>
        <span className="text-sm text-muted-foreground ml-2">
          (Allow user to login and access the system)
        </span>
      </div>

      {/* Side by Side: Basic Info + Profile Picture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info - 2 columns */}
        <Card className="lg:col-span-2 shadow-none">
          <CardContent className="px-4">
            <h3 className="text-lg font-semibold mb-4">Basic Info</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Row 1: Email, Full Name, Language */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  {...register("language")}
                  placeholder="English"
                />
              </div>

              {/* Row 2: First Name, Username, Time Zone */}
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" {...register("first_name")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input id="username" {...register("username")} />
                {errors.username && (
                  <p className="text-sm text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_zone">Time Zone</Label>
                <Input
                  id="time_zone"
                  {...register("time_zone")}
                  placeholder="Asia/Jakarta"
                />
              </div>

              {/* Row 3: Middle Name, Last Name */}
              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input id="middle_name" {...register("middle_name")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" {...register("last_name")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Picture - 1 column */}
        <Card className="border-none shadow-none">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>

            <AvatarUpload
              value={avatarFile || user.avatar_url || null}
              onChange={handleAvatarChange}
              onRemove={handleAvatarRemove}
              maxSize={2 * 1024 * 1024}
              disabled={
                uploadAvatarMutation.isPending || deleteAvatarMutation.isPending
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      {isDirty && (
        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      )}

      {/* Comments Section */}
      {/* <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Comments</h3>
          
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url || ""} />
              <AvatarFallback>
                {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            
            <Textarea
              placeholder="Type a reply / comment"
              className="flex-1"
              rows={2}
            />
          </div>
        </CardContent>
      </Card> */}

      {/* Activity Section */}
      {/* <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Activity</h3>
            <Button variant="outline" size="sm">
              + New Email
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <span>•</span>
              <div>
                <span className="font-medium">Administrator</span>
                <span className="text-muted-foreground"> last edited this · </span>
                <span className="text-muted-foreground">
                  {user.updated_at ? formatDistanceToNow(new Date(user.updated_at), { addSuffix: true }) : "recently"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <span>•</span>
              <div>
                <span className="font-medium">Administrator</span>
                <span className="text-muted-foreground"> created this · </span>
                <span className="text-muted-foreground">
                  {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : "recently"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </form>
  );
}
