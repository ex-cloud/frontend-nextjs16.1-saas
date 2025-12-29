"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Briefcase,
  Users,
  GraduationCap,
  Activity,
  Edit,
  Power,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import {
  usePosition,
  useUpdatePosition,
  useDeletePosition,
} from "@/hooks/use-positions";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PositionDetailsTab } from "@/components/hrm/positions/tabs/position-details-tab";
import { PositionUsersTab } from "@/components/hrm/positions/tabs/position-users-tab";
import { PositionSkillsTab } from "@/components/hrm/positions/tabs/position-skills-tab";
import { PositionForm } from "@/components/hrm/positions/position-form";
import { toast } from "sonner";
import type { PositionInput } from "@/types/hrm";

export default function PositionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const positionId = Number(params.id);

  // State for dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Queries and mutations
  const { data: position, isLoading, refetch } = usePosition(positionId);
  const updateMutation = useUpdatePosition();
  const deleteMutation = useDeletePosition();

  // Handlers
  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: PositionInput) => {
    try {
      await updateMutation.mutateAsync({ id: positionId, data });
      toast.success("Position updated successfully");
      setEditDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed";
      toast.error(message);
      throw error;
    }
  };

  const handleToggleStatus = async () => {
    if (!position) return;
    try {
      const updateData: Partial<PositionInput> = {
        name: position.name,
        code: position.code,
        department_id: position.department_id,
        is_active: !position.is_active,
      };

      await updateMutation.mutateAsync({
        id: positionId,
        data: updateData,
      });
      toast.success(
        `Position ${
          position.is_active ? "deactivated" : "activated"
        } successfully`
      );
      refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Status update failed";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(positionId);
      toast.success("Position deleted successfully");
      router.push("/dashboard/hrm/positions");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requireAuth>
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-96 w-full mt-4" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!position) {
    return (
      <ProtectedRoute requireAuth>
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">Position not found</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            {/* Left: Back button + Position name + Status */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard/hrm/positions")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-muted-foreground" />
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {position.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Code: {position.code}
                  </p>
                </div>
                <Badge variant={position.is_active ? "default" : "secondary"}>
                  {position.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleToggleStatus}>
                    <Power className="h-4 w-4 mr-2" />
                    {position.is_active ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Position
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tabs with ERPNext/Frappe Style */}
          <div className="border-1 rounded-md border-gray-400 overflow-hidden">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="h-auto p-0 bg-transparent gap-6 border-b w-full justify-start rounded-b-none px-4 pt-2">
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:bg-transparent flex-0 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0 data-[state=active]:border-zinc-900 data-[state=active]:rounded-b-none px-0 py-1 text-muted-foreground data-[state=active]:text-foreground"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-transparent flex-0 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0 data-[state=active]:border-zinc-900 data-[state=active]:rounded-b-none px-0 py-1 text-muted-foreground data-[state=active]:text-foreground"
                >
                  <Users className="h-4 w-4" />
                  <span>Users ({position.users_count || 0})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="skills"
                  className="data-[state=active]:bg-transparent flex-0 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0 data-[state=active]:border-zinc-900 data-[state=active]:rounded-b-none px-0 py-1 text-muted-foreground data-[state=active]:text-foreground"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Skills</span>
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-transparent flex-0 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0 data-[state=active]:border-zinc-900 data-[state=active]:rounded-b-none px-0 py-1 text-muted-foreground data-[state=active]:text-foreground"
                >
                  <Activity className="h-4 w-4" />
                  <span>Activity</span>
                </TabsTrigger>
              </TabsList>

              <div className="mt-0">
                <TabsContent value="details" className="m-0 pt-6">
                  <PositionDetailsTab position={position} />
                </TabsContent>

                <TabsContent value="users" className="m-0 pt-6">
                  <PositionUsersTab position={position} onRefresh={refetch} />
                </TabsContent>

                <TabsContent value="skills" className="m-0 pt-6">
                  <PositionSkillsTab position={position} />
                </TabsContent>

                <TabsContent value="activity" className="m-0 pt-6">
                  <div className="px-6 pb-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2 text-sm">
                            <span>•</span>
                            <div>
                              <span className="font-medium">System</span>
                              <span className="text-muted-foreground">
                                {" "}
                                last updated ·{" "}
                              </span>
                              <span className="text-muted-foreground">
                                {position.updated_at
                                  ? formatDistanceToNow(
                                      new Date(position.updated_at),
                                      {
                                        addSuffix: true,
                                      }
                                    )
                                  : "recently"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <span>•</span>
                            <div>
                              <span className="font-medium">System</span>
                              <span className="text-muted-foreground">
                                {" "}
                                created this ·{" "}
                              </span>
                              <span className="text-muted-foreground">
                                {position.created_at
                                  ? formatDistanceToNow(
                                      new Date(position.created_at),
                                      {
                                        addSuffix: true,
                                      }
                                    )
                                  : "recently"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Edit Position Dialog */}
      <PositionForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditSubmit}
        position={position}
        isLoading={updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Position</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{position.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
