"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { usePositionUsers, positionKeys } from "@/hooks/use-positions";
import { useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, Mail, Search, Check, UserMinus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  hrmAssignmentApi,
  getAllUsersForAssignment,
} from "@/lib/api/hrm-assignments";
import type { User, Position } from "@/types/hrm";

interface PositionUsersTabProps {
  position: Position;
  onRefresh?: () => void;
}

export function PositionUsersTab({
  position,
  onRefresh,
}: PositionUsersTabProps) {
  const { data, isLoading, refetch } = usePositionUsers(position.id, 1, 50);
  const queryClient = useQueryClient();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [userToUnassign, setUserToUnassign] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  // Fetch available users when dialog opens
  const handleOpenAssignDialog = async () => {
    if (!position.department_id) {
      toast.error(
        "Cannot assign users: Position is not linked to a Department."
      );
      return;
    }

    setSelectedUsers([]);
    setSearchQuery("");
    setAssignDialogOpen(true);
    setLoadingAvailable(true);

    try {
      const users = await getAllUsersForAssignment();
      // Filter out users already in this position
      const currentUserIds = (data?.data || []).map((u) => u.id);
      const available = users.filter((u) => !currentUserIds.includes(u.id));
      setAvailableUsers(available);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load available users");
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleToggleUser = (user: User) => {
    if (!user.is_active) {
      return; // Prevent selecting inactive users
    }
    const userId = user.id;
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssignUsers = async () => {
    if (selectedUsers.length === 0 || !position.department_id) return;

    setIsAssigning(true);
    try {
      const response = await hrmAssignmentApi.bulkAssign({
        user_ids: selectedUsers,
        department_id: position.department_id,
        position_id: position.id,
        reason: "Assigned via position detail page",
      });

      // Handle response properly regarding success/failure counts
      const result = response as unknown as {
        data?: {
          summary?: {
            success: number;
            failed: number;
          };
          errors?: Record<string, string>;
        };
      };

      const successCount = result?.data?.summary?.success || 0;
      const failedCount = result?.data?.summary?.failed || 0;

      if (successCount > 0) {
        if (failedCount > 0) {
          const errorMsg = Object.values(
            result?.data?.errors || {}
          )[0] as string;
          toast.warning(
            `Assigned ${successCount} users, but ${failedCount} failed. ${
              errorMsg ? `Reason: ${errorMsg}` : ""
            }`
          );
        } else {
          toast.success(
            `Successfully assigned ${successCount} user(s) to position`
          );
        }

        setAssignDialogOpen(false);

        // Force invalidate queries
        await queryClient.invalidateQueries({
          queryKey: positionKeys.users(position.id),
        });

        // Also invalidate department users
        // Note: We don't import departmentKeys here to avoid circular dep, but we can rely on general invalidation if needed

        refetch();
        onRefresh?.();
      } else {
        // All failed
        const errors = result?.data?.errors || {};
        const firstErrorMessages = Object.values(errors).slice(
          0,
          3
        ) as string[];

        if (firstErrorMessages.length > 0) {
          toast.error(
            `Failed to assign users. Errors: ${firstErrorMessages.join("; ")}`
          );
        } else {
          toast.error(
            `Failed to assign users. ${failedCount} errors occurred.`
          );
        }
      }
    } catch (error) {
      console.error("Failed to assign users (Catch):", error);
      toast.error("Failed to assign users. System error occurred.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignClick = (user: User) => {
    setUserToUnassign(user);
    setUnassignDialogOpen(true);
  };

  const handleUnassignConfirm = async () => {
    if (!userToUnassign) return;

    setIsUnassigning(true);
    try {
      await hrmAssignmentApi.unassign(userToUnassign.id, {
        reason: "Unassigned via position detail page",
      });

      toast.success(
        `Successfully unassigned ${userToUnassign.name} from position`
      );
      setUnassignDialogOpen(false);
      setUserToUnassign(null);
      await queryClient.invalidateQueries({
        queryKey: positionKeys.users(position.id),
      });
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error("Failed to unassign user:", error);
      toast.error("Failed to unassign user. Please try again.");
    } finally {
      setIsUnassigning(false);
    }
  };

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="px-6 pb-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const users = data?.data || [];

  return (
    <div className="px-6 pb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Position Users ({users.length})
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenAssignDialog}
            disabled={!position.department_id}
            title={
              !position.department_id
                ? "Position must belong to a Department to assign users"
                : ""
            }
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Users
          </Button>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users in this position</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleOpenAssignDialog}
                disabled={!position.department_id}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Users
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Employee No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || ""} />
                          <AvatarFallback>
                            {user.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {user.department?.name || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {user.employee_number || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_active ? "default" : "destructive"}
                        className={
                          !user.is_active ? "bg-red-500 hover:bg-red-600" : ""
                        }
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleUnassignClick(user)}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Unassign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assign Users Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Users to Position</DialogTitle>
            <DialogDescription>
              Select users to assign to this position. Note: This will also
              assign them to &quot;{position.department?.name}&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
              {loadingAvailable ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer ${
                        !user.is_active
                          ? "opacity-50 cursor-not-allowed bg-muted/50"
                          : ""
                      }`}
                      onClick={() => handleToggleUser(user)}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        disabled={!user.is_active}
                        onCheckedChange={() => handleToggleUser(user)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || ""} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{user.name}</p>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              user.is_active ? "bg-green-500" : "bg-red-500"
                            }`}
                            title={user.is_active ? "Active" : "Inactive"}
                          />
                        </div>
                        <div className="flex text-xs text-muted-foreground gap-2">
                          <span>{user.email}</span>
                          <span>•</span>
                          <span>{user.department?.name || "No Dept"}</span>
                        </div>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                  {filteredUsers.length === 0 && !loadingAvailable && (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery
                        ? "No users found matching your search"
                        : "No available users to assign"}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {selectedUsers.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedUsers.length} user(s) selected
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignUsers}
              disabled={selectedUsers.length === 0 || isAssigning}
            >
              {isAssigning ? "Assigning..." : "Assign Users"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Confirmation Dialog */}
      <AlertDialog
        open={unassignDialogOpen}
        onOpenChange={setUnassignDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unassign &quot;{userToUnassign?.name}
              &quot;? This will remove their position AND department assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnassigning}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnassignConfirm}
              disabled={isUnassigning}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUnassigning ? "Unassigning..." : "Unassign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
