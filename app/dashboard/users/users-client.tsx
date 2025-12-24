"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UserTable } from "@/components/users/user-table";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { UserDetailDialog } from "@/components/users/user-detail-dialog";
import { DeleteConfirmationDialog } from "@/components/users/delete-confirmation-dialog";
import {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useBulkDeleteUsers,
  useActivateUser,
  useDeactivateUser,
  useVerifyEmail,
  useSendPasswordReset,
  useUploadAvatar,
  useDeleteAvatar,
} from "@/lib/hooks/use-users";
import type { User } from "@/types/user";
import type {
  CreateUserFormData,
  UpdateUserFormData,
} from "@/lib/validations/user.schema";

interface Role {
  id: string;
  name: string;
}

interface UserFormSubmitData extends Record<string, unknown> {
  avatar?: File | null;
  avatarRemoved?: boolean;
}

interface UsersClientProps {
  initialRoles: Role[];
}

export function UsersClient({ initialRoles }: UsersClientProps) {
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({
    open: false,
    user: null,
  });
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    userId: string | null;
  }>({
    open: false,
    userId: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: User | null;
    isBulk: boolean;
    ids: string[];
  }>({
    open: false,
    user: null,
    isBulk: false,
    ids: [],
  });

  // Mutations
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const bulkDeleteMutation = useBulkDeleteUsers();
  const activateMutation = useActivateUser();
  const deactivateMutation = useDeactivateUser();
  const verifyEmailMutation = useVerifyEmail();
  const sendPasswordResetMutation = useSendPasswordReset();
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();

  // Handlers
  const handleCreateNew = useCallback(() => {
    setFormDialog({ open: true, user: null });
  }, []);

  const handleView = useCallback((user: User) => {
    // Navigate to detail page instead of opening dialog
    window.location.href = `/dashboard/users/${user.id}`;
  }, []);

  const handleEdit = useCallback((user: User) => {
    setFormDialog({ open: true, user });
  }, []);

  const handleDelete = useCallback((user: User) => {
    setDeleteDialog({
      open: true,
      user,
      isBulk: false,
      ids: [],
    });
  }, []);

  const handleBulkDelete = useCallback((ids: string[]) => {
    setDeleteDialog({
      open: true,
      user: null,
      isBulk: true,
      ids,
    });
  }, []);

  const handleActivate = useCallback(
    (user: User) => {
      activateMutation.mutate(user.id);
    },
    [activateMutation]
  );

  const handleDeactivate = useCallback(
    (user: User) => {
      deactivateMutation.mutate(user.id);
    },
    [deactivateMutation]
  );

  const handleVerifyEmail = useCallback(
    (user: User) => {
      verifyEmailMutation.mutate(user.id);
    },
    [verifyEmailMutation]
  );

  const handleResetPassword = useCallback(
    (user: User) => {
      sendPasswordResetMutation.mutate(user.id);
    },
    [sendPasswordResetMutation]
  );

  const handleFormSubmit = async (data: UserFormSubmitData) => {
    try {
      console.log("=== FORM SUBMIT DEBUG ===");
      console.log("Full form data:", data);
      console.log("Avatar value:", data.avatar);
      console.log("Avatar is File?", data.avatar instanceof File);
      console.log("Avatar removed?", data.avatarRemoved);

      let userId: string;

      // Separate avatar and avatarRemoved flag from other data
      const { avatar, avatarRemoved, ...userData } = data;

      console.log("User data (without avatar):", userData);

      if (formDialog.user) {
        // Update existing user
        const updatedUser = await updateMutation.mutateAsync({
          id: formDialog.user.id,
          data: userData as UpdateUserFormData,
        });
        userId = updatedUser.id;
        console.log("User updated, ID:", userId);

        // Handle avatar removal first (if user clicked remove)
        if (avatarRemoved && formDialog.user.avatar_url) {
          console.log("Deleting avatar for user:", userId);
          await deleteAvatarMutation.mutateAsync(userId);
          console.log("Avatar deleted successfully");
        }
      } else {
        // Create new user
        const newUser = await createMutation.mutateAsync(
          userData as CreateUserFormData
        );
        userId = newUser.id;
        console.log("User created, ID:", userId);
      }

      // Upload new avatar if provided (after deletion if needed)
      console.log("Checking avatar upload...", {
        avatar,
        isFile: avatar instanceof File,
      });
      if (avatar && avatar instanceof File) {
        console.log("Uploading avatar for user:", userId);
        const result = await uploadAvatarMutation.mutateAsync({
          id: userId,
          file: avatar,
        });
        console.log("Avatar upload result:", result);
      } else {
        console.log("No avatar to upload");
      }

      setFormDialog({ open: false, user: null });
    } catch (error: unknown) {
      console.error("Error submitting form:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.isBulk) {
      await bulkDeleteMutation.mutateAsync(deleteDialog.ids);
    } else if (deleteDialog.user) {
      await deleteMutation.mutateAsync(deleteDialog.user.id);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage users, roles, and permissions
            </p>
          </div>

          <Card className="border-gray-400 shadow-none rounded-md">
            <CardContent className="p-4">
              <UserTable
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onActivate={handleActivate}
                onDeactivate={handleDeactivate}
                onVerifyEmail={handleVerifyEmail}
                onResetPassword={handleResetPassword}
                onBulkDelete={handleBulkDelete}
                onCreateNew={handleCreateNew}
                initialRoles={initialRoles}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <UserFormDialog
        open={formDialog.open}
        onOpenChange={(open) => setFormDialog({ open, user: null })}
        onSubmit={handleFormSubmit}
        user={formDialog.user}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <UserDetailDialog
        open={detailDialog.open}
        onOpenChange={(open) => setDetailDialog({ open, userId: null })}
        userId={detailDialog.userId}
      />

      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, user: null, isBulk: false, ids: [] })
        }
        onConfirm={handleDeleteConfirm}
        userName={deleteDialog.user?.name}
        isLoading={deleteMutation.isPending || bulkDeleteMutation.isPending}
        isBulk={deleteDialog.isBulk}
        count={deleteDialog.ids.length}
      />
    </>
  );
}
