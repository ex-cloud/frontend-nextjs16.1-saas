"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/protected-route";
import { TeamTable } from "@/components/hrm/teams/team-table";
import { TeamForm } from "@/components/hrm/teams/team-form";
import { TeamMembersDialog } from "@/components/hrm/teams/team-members";
import {
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useRestoreTeam,
} from "@/hooks/use-teams";
import { toast } from "sonner";
import type { Team, TeamInput } from "@/types/hrm";

export default function TeamsPage() {
  const router = useRouter();
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    team: Team | null;
  }>({
    open: false,
    team: null,
  });
  const [membersDialog, setMembersDialog] = useState<{
    open: boolean;
    team: Team | null;
  }>({
    open: false,
    team: null,
  });

  // Mutations
  const createMutation = useCreateTeam();
  const updateMutation = useUpdateTeam();
  const deleteMutation = useDeleteTeam();
  const restoreMutation = useRestoreTeam();

  // Handlers
  const handleView = (team: Team) => {
    router.push(`/dashboard/hrm/teams/${team.id}`);
  };

  const handleCreate = () => {
    setFormDialog({ open: true, team: null });
  };

  const handleEdit = (team: Team) => {
    setFormDialog({ open: true, team });
  };

  const handleManageMembers = (team: Team) => {
    setMembersDialog({ open: true, team });
  };

  const handleSubmit = async (data: TeamInput) => {
    try {
      if (formDialog.team) {
        await updateMutation.mutateAsync({
          id: formDialog.team.id,
          data,
        });
        toast.success("Team updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Team created successfully");
      }
      setFormDialog({ open: false, team: null });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Operation failed";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDelete = async (team: Team) => {
    if (!confirm("Are you sure you want to delete this team?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(team.id);
      toast.success("Team deleted successfully");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Delete failed";
      toast.error(errorMessage);
    }
  };

  const handleRestore = async (team: Team) => {
    try {
      await restoreMutation.mutateAsync(team.id);
      toast.success("Team restored successfully");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Restore failed";
      toast.error(errorMessage);
    }
  };

  return (
    <ProtectedRoute requireAuth>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
            <p className="text-muted-foreground">
              Manage teams and their members across the organization
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <TeamTable
                onCreate={handleCreate}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onManageMembers={handleManageMembers}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Dialog */}
      <TeamForm
        open={formDialog.open}
        onOpenChange={(open) => setFormDialog({ open, team: null })}
        onSubmit={handleSubmit}
        team={formDialog.team}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Members Dialog */}
      {membersDialog.team && (
        <TeamMembersDialog
          open={membersDialog.open}
          onOpenChange={(open) => setMembersDialog({ open, team: null })}
          team={membersDialog.team}
        />
      )}
    </ProtectedRoute>
  );
}
