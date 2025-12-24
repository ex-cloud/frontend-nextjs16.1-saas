"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Building2,
  Users,
  Briefcase,
  UsersRound,
  Activity,
  Edit,
  UserPlus,
  Power,
  MoreHorizontal,
  Trash2,
  Search,
  Check,
} from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import {
  useDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "@/hooks/use-departments";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DepartmentDetailsTab } from "@/components/hrm/departments/tabs/department-details-tab";
import { DepartmentUsersTab } from "@/components/hrm/departments/tabs/department-users-tab";
import { DepartmentPositionsTab } from "@/components/hrm/departments/tabs/department-positions-tab";
import { DepartmentTeamsTab } from "@/components/hrm/departments/tabs/department-teams-tab";
import { DepartmentForm } from "@/components/hrm/departments/department-form";
import { toast } from "sonner";
import { getAllUsersForAssignment } from "@/lib/api/hrm-assignments";
import type { DepartmentInput, User } from "@/types/hrm";

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = Number(params.id);

  // State for dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);

  // State for Set Manager
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [settingManager, setSettingManager] = useState(false);

  // Queries and mutations
  const { data: department, isLoading, refetch } = useDepartment(departmentId);
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  // Handlers
  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: DepartmentInput) => {
    try {
      await updateMutation.mutateAsync({ id: departmentId, data });
      toast.success("Department updated successfully");
      setEditDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed";
      toast.error(message);
      throw error;
    }
  };

  const handleToggleStatus = async () => {
    if (!department) return;
    try {
      const updateData: Partial<DepartmentInput> = {
        name: department.name,
        code: department.code,
        description: department.description || undefined,
        location: department.location || undefined,
        budget_allocated: department.budget_allocated,
        parent_id: department.parent_id,
        manager_id: department.manager_id,
        is_active: !department.is_active,
      };

      await updateMutation.mutateAsync({
        id: departmentId,
        data: updateData,
      });
      toast.success(
        `Department ${
          department.is_active ? "deactivated" : "activated"
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
      await deleteMutation.mutateAsync(departmentId);
      toast.success("Department deleted successfully");
      router.push("/dashboard/hrm/departments");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed";
      toast.error(message);
    }
  };

  // Open Set Manager dialog
  const handleOpenManagerDialog = async () => {
    setSearchQuery("");
    setSelectedUserId(department?.manager_id || null);
    setManagerDialogOpen(true);
    setLoadingUsers(true);

    try {
      const users = await getAllUsersForAssignment();
      setAvailableUsers(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Set Manager handler
  const handleSetManager = async () => {
    if (!department) return;

    setSettingManager(true);
    try {
      // Sanitize department data to match DepartmentInput type
      // We need to convert nulls to undefined for string fields
      const updateData: Partial<DepartmentInput> = {
        name: department.name,
        code: department.code,
        description: department.description || undefined,
        location: department.location || undefined,
        budget_allocated: department.budget_allocated,
        parent_id: department.parent_id,
        manager_id: selectedUserId,
        is_active: department.is_active,
      };

      await updateMutation.mutateAsync({
        id: departmentId,
        data: updateData,
      });
      toast.success(
        selectedUserId
          ? "Manager assigned successfully"
          : "Manager removed successfully"
      );
      setManagerDialogOpen(false);
      refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to set manager";
      toast.error(message);
    } finally {
      setSettingManager(false);
    }
  };

  // Filter users by search
  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (!department) {
    return (
      <ProtectedRoute requireAuth>
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">Department not found</div>
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
            {/* Left: Back button + Department name + Status */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard/hrm/departments")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-muted-foreground" />
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {department.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Code: {department.code}
                  </p>
                </div>
                <Badge variant={department.is_active ? "default" : "secondary"}>
                  {department.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenManagerDialog}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Set Manager
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
                    {department.is_active ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Department
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
                  <Building2 className="h-4 w-4" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-transparent flex-0 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0 data-[state=active]:border-zinc-900 data-[state=active]:rounded-b-none px-0 py-1 text-muted-foreground data-[state=active]:text-foreground"
                >
                  <Users className="h-4 w-4" />
                  <span>Users ({department.users_count || 0})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="positions"
                  className="data-[state=active]:bg-transparent flex-0 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0 data-[state=active]:border-zinc-900 data-[state=active]:rounded-b-none px-0 py-1 text-muted-foreground data-[state=active]:text-foreground"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Positions ({department.positions_count || 0})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="teams"
                  className="data-[state=active]:bg-transparent flex-0 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0 data-[state=active]:border-zinc-900 data-[state=active]:rounded-b-none px-0 py-1 text-muted-foreground data-[state=active]:text-foreground"
                >
                  <UsersRound className="h-4 w-4" />
                  <span>Teams ({department.teams_count || 0})</span>
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
                  <DepartmentDetailsTab department={department} />
                </TabsContent>

                <TabsContent value="users" className="m-0 pt-6">
                  <DepartmentUsersTab
                    departmentId={departmentId}
                    onRefresh={refetch}
                  />
                </TabsContent>

                <TabsContent value="positions" className="m-0 pt-6">
                  <DepartmentPositionsTab
                    departmentId={departmentId}
                    onRefresh={refetch}
                  />
                </TabsContent>

                <TabsContent value="teams" className="m-0 pt-6">
                  <DepartmentTeamsTab
                    departmentId={departmentId}
                    onRefresh={refetch}
                  />
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
                                {department.updated_at
                                  ? formatDistanceToNow(
                                      new Date(department.updated_at),
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
                                {department.created_at
                                  ? formatDistanceToNow(
                                      new Date(department.created_at),
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

      {/* Edit Department Dialog */}
      <DepartmentForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditSubmit}
        department={department}
        isLoading={updateMutation.isPending}
      />

      {/* Set Manager Dialog */}
      <Dialog open={managerDialogOpen} onOpenChange={setManagerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Department Manager</DialogTitle>
            <DialogDescription>
              Select a user to be the manager of &quot;{department?.name}&quot;
              department.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Manager Info */}
            {department?.manager && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">
                  Current Manager
                </p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={department.manager.avatar || ""} />
                    <AvatarFallback>
                      {department.manager.name?.charAt(0) || "M"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {department.manager.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {department.manager.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* User List */}
            <ScrollArea className="h-[300px] border rounded-md">
              {loadingUsers ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {/* Option to remove manager */}
                  <div
                    className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer ${
                      selectedUserId === null ? "bg-primary/10" : ""
                    }`}
                    onClick={() => setSelectedUserId(null)}
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">No Manager</p>
                      <p className="text-xs text-muted-foreground">
                        Remove manager assignment
                      </p>
                    </div>
                    {selectedUserId === null && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer ${
                        selectedUserId === user.id ? "bg-primary/10" : ""
                      }`}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || ""} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      {selectedUserId === user.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                  {filteredUsers.length === 0 && !loadingUsers && (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No users found" : "No users available"}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setManagerDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSetManager} disabled={settingManager}>
              {settingManager ? "Saving..." : "Set Manager"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{department.name}&quot;?
              This action cannot be undone.
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
