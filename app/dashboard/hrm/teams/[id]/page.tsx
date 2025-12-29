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
  Users,
  Activity,
  Edit,
  Power,
  MoreHorizontal,
  Trash2,
  Layers,
} from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { useTeam, useUpdateTeam, useDeleteTeam } from "@/hooks/use-teams";
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
import { TeamDetailsTab } from "@/components/hrm/teams/tabs/team-details-tab";
import { TeamMembersTab } from "@/components/hrm/teams/tabs/team-members-tab";
import { TeamForm } from "@/components/hrm/teams/team-form";
import { toast } from "sonner";
import type { TeamInput } from "@/types/hrm";

// Helper function to get status variant
function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "inactive":
      return "secondary";
    case "completed":
      return "outline";
    case "on_hold":
      return "destructive";
    default:
      return "secondary";
  }
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = Number(params.id);

  // State for dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Queries and Mutations
  const { data: team, isLoading, refetch } = useTeam(teamId);
  const updateMutation = useUpdateTeam();
  const deleteMutation = useDeleteTeam();

  // Handlers
  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: TeamInput) => {
    try {
      await updateMutation.mutateAsync({ id: teamId, data });
      toast.success("Team updated successfully");
      setEditDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed";
      toast.error(message);
      throw error;
    }
  };

  const handleToggleStatus = async () => {
    if (!team) return;

    // Determine next status based on current status
    let newStatus = team.status;
    if (team.status === "active") {
      newStatus = "inactive";
    } else if (team.status === "inactive") {
      newStatus = "active";
    }

    try {
      const updateData: Partial<TeamInput> = {
        name: team.name,
        code: team.code,
        team_type: team.team_type,
        status: newStatus,
      };

      await updateMutation.mutateAsync({
        id: teamId,
        data: updateData,
      });
      toast.success(`Team status changed to ${newStatus}`);
      refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Status update failed";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(teamId);
      toast.success("Team deleted successfully");
      router.push("/dashboard/hrm/teams");
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

  if (!team) {
    return (
      <ProtectedRoute requireAuth>
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">Team not found</div>
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
            {/* Left: Back button + Team name + Status */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard/hrm/teams")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2">
                <Layers className="h-6 w-6 text-muted-foreground" />
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {team.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Code: {team.code}
                  </p>
                </div>
                <Badge
                  variant={getStatusVariant(team.status)}
                  className="capitalize"
                >
                  {team.status.replace("_", " ")}
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
                    {team.status === "active"
                      ? "Mark as Inactive"
                      : "Mark as Active"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Team
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
                  <Layers className="h-4 w-4" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="data-[state=active]:bg-transparent flex-0 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0 data-[state=active]:border-zinc-900 data-[state=active]:rounded-b-none px-0 py-1 text-muted-foreground data-[state=active]:text-foreground"
                >
                  <Users className="h-4 w-4" />
                  <span>Members ({team.active_members_count || 0})</span>
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
                  <TeamDetailsTab team={team} />
                </TabsContent>

                <TabsContent value="members" className="m-0 pt-6">
                  <TeamMembersTab team={team} onRefresh={refetch} />
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
                                {team.updated_at
                                  ? formatDistanceToNow(
                                      new Date(team.updated_at),
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
                                {team.created_at
                                  ? formatDistanceToNow(
                                      new Date(team.created_at),
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

      {/* Edit Team Dialog */}
      <TeamForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditSubmit}
        team={team}
        isLoading={updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{team.name}&quot;? This
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
