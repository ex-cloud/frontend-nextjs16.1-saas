"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/protected-route";
import { PositionTable } from "@/components/hrm/positions/position-table";
import { PositionForm } from "@/components/hrm/positions/position-form";
import {
  useCreatePosition,
  useUpdatePosition,
  useDeletePosition,
  useRestorePosition,
} from "@/hooks/use-positions";
import { toast } from "sonner";
import type { Position, PositionInput } from "@/types/hrm";

export default function PositionsPage() {
  const router = useRouter();
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    position: Position | null;
  }>({
    open: false,
    position: null,
  });

  // Mutations
  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();
  const deleteMutation = useDeletePosition();
  const restoreMutation = useRestorePosition();

  // Handlers
  const handleView = (position: Position) => {
    router.push(`/dashboard/hrm/positions/${position.id}`);
  };

  const handleCreate = () => {
    setFormDialog({ open: true, position: null });
  };

  const handleEdit = (position: Position) => {
    setFormDialog({ open: true, position });
  };

  const handleSubmit = async (data: PositionInput) => {
    try {
      if (formDialog.position) {
        await updateMutation.mutateAsync({
          id: formDialog.position.id,
          data,
        });
        toast.success("Position updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Position created successfully");
      }
      setFormDialog({ open: false, position: null });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Operation failed";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDelete = async (position: Position) => {
    if (!confirm("Are you sure you want to delete this position?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(position.id);
      toast.success("Position deleted successfully");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Delete failed";
      toast.error(errorMessage);
    }
  };

  const handleRestore = async (position: Position) => {
    try {
      await restoreMutation.mutateAsync(position.id);
      toast.success("Position restored successfully");
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
            <h1 className="text-3xl font-bold tracking-tight">Positions</h1>
            <p className="text-muted-foreground">
              Manage job positions and roles across departments
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <PositionTable
                onCreate={handleCreate}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRestore={handleRestore}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Dialog */}
      <PositionForm
        open={formDialog.open}
        onOpenChange={(open) => setFormDialog({ open, position: null })}
        onSubmit={handleSubmit}
        position={formDialog.position}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </ProtectedRoute>
  );
}
