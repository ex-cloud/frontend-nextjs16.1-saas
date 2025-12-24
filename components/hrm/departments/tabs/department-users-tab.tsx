"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useDepartmentUsers } from "@/hooks/use-departments";
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
import type { User } from "@/types/hrm";

interface DepartmentUsersTabProps {
  departmentId: number;
  onRefresh?: () => void;
}

export function DepartmentUsersTab({
  departmentId,
  onRefresh,
}: DepartmentUsersTabProps) {
  const { data, isLoading, refetch } = useDepartmentUsers(departmentId, 1, 50);
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
    setSelectedUsers([]);
    setSearchQuery("");
    setAssignDialogOpen(true);
    setLoadingAvailable(true);

    try {
      const users = await getAllUsersForAssignment();
      // Filter out users already in this department
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

  const handleToggleUser = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssignUsers = async () => {
    if (selectedUsers.length === 0) return;

    setIsAssigning(true);
    try {
      await hrmAssignmentApi.bulkAssign({
        user_ids: selectedUsers,
        department_id: departmentId,
        reason: "Assigned via department detail page",
      });

      toast.success(
        `Successfully assigned ${selectedUsers.length} user(s) to department`
      );
      setAssignDialogOpen(false);
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error("Failed to assign users:", error);
      toast.error("Failed to assign users. Please try again.");
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
        reason: "Unassigned via department detail page",
      });

      toast.success(
        `Successfully unassigned ${userToUnassign.name} from department`
      );
      setUnassignDialogOpen(false);
      setUserToUnassign(null);
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
            Department Users ({users.length})
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handleOpenAssignDialog}>
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Users
          </Button>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No users in this department
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleOpenAssignDialog}
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
                  <TableHead>Position</TableHead>
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
                        {user.position?.name || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {user.employee_number || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Active</Badge>
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
            <DialogTitle>Assign Users to Department</DialogTitle>
            <DialogDescription>
              Select users to assign to this department.
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
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                      onClick={() => handleToggleUser(user.id)}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleToggleUser(user.id)}
                      />
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
              &quot; from this department? This will remove their department and
              position assignment.
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
