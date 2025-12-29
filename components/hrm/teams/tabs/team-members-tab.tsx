"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  useTeamMembers,
  teamKeys,
  useAddTeamMember,
  useRemoveTeamMember,
  useUpdateTeamMember,
  useTeamRoles,
} from "@/hooks/use-teams";
import { teamApi } from "@/lib/api/teams";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Mail,
  Search,
  Check,
  UserMinus,
  Briefcase,
  Pencil,
} from "lucide-react";
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
import { toast } from "sonner";
import { getAllUsersForAssignment } from "@/lib/api/hrm-assignments";
import { departmentApi } from "@/lib/api/departments";
import type { User, Team, TeamMember } from "@/types/hrm";

interface TeamMembersTabProps {
  team: Team;
  onRefresh?: () => void;
}

export function TeamMembersTab({ team, onRefresh }: TeamMembersTabProps) {
  const { data, isLoading, refetch } = useTeamMembers(team.id, true, 1, 50);
  const queryClient = useQueryClient();
  const addMemberMutation = useAddTeamMember(team.id);
  const removeMemberMutation = useRemoveTeamMember(team.id);
  const updateMemberMutation = useUpdateTeamMember(team.id);
  const { data: roles = [] } = useTeamRoles("team");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [allMemberIds, setAllMemberIds] = useState<Set<string>>(new Set());

  // Inline Edit Role State (replaces dialog)
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);

  // Fetch available users when dialog opens
  const handleOpenAddDialog = async () => {
    setSelectedUserId(null);
    setSelectedRoleId("");
    setSearchQuery("");
    setAddDialogOpen(true);
    setLoadingAvailable(true);

    try {
      // 1. Fetch available users
      let users: User[];

      // For department-specific teams, fetch directly from department endpoint
      // This ensures consistency with "Department Users" tab
      if (team.department_id && team.team_type !== "cross_functional") {
        const deptUsersRes = await departmentApi.getUsers(
          team.department_id,
          1,
          100
        );
        users = deptUsersRes.data || [];
      } else {
        // For cross-functional teams, fetch all users
        users = await getAllUsersForAssignment();
      }

      // 2. Fetch fresh team members (up to 100) to ensure accurate "Joined" status
      const currentMembersRes = await teamApi.getMembers(team.id, true, 1, 100);
      // Fix: Strictly typed response handling (No 'any')
      const resData = currentMembersRes.data as unknown;
      let membersList: TeamMember[] = [];

      // Type guard for paginated object
      const hasDataProp = (v: unknown): v is { data: unknown } =>
        typeof v === "object" && v !== null && "data" in v;

      if (Array.isArray(resData)) {
        membersList = resData as TeamMember[];
      } else if (hasDataProp(resData)) {
        const level1 = resData.data;
        if (Array.isArray(level1)) {
          membersList = level1 as TeamMember[];
        } else if (hasDataProp(level1) && Array.isArray(level1.data)) {
          membersList = level1.data as TeamMember[];
        }
      }

      const memberIds = new Set<string>(
        membersList.map((m) => String(m.user?.id || m.user_id))
      );

      // Log removed properly

      setAllMemberIds(memberIds);

      // No more frontend filtering needed - data comes from correct source
      setAvailableUsers(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load available users");
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    try {
      await addMemberMutation.mutateAsync({
        user_id: selectedUserId,
        team_role_id: selectedRoleId ? Number(selectedRoleId) : undefined,
      });
      setAddDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: teamKeys.members(team.id),
      });
      refetch();
      onRefresh?.();
    } catch (error) {
      // Error already handled by mutation
      console.error("Add member error:", error);
    }
  };

  const handleRoleChange = async (member: TeamMember, newRoleId: string) => {
    // Robust ID check
    const userId = member.user_id || member.user?.id;

    if (!userId) {
      toast.error("Error", { description: "Cannot identify user ID" });
      return;
    }

    try {
      const roleId = parseInt(newRoleId);
      const roleName = roles.find((r) => r.id === roleId)?.name;

      // Show loading toast (optional, but good for UX on slower connections)
      const toastId = toast.loading("Updating role...");

      await updateMemberMutation.mutateAsync({
        userId: userId,
        teamRoleId: roleId,
        roleInTeam: roleName,
      });

      // Dismiss loading toast - mutation onSuccess will show success toast
      toast.dismiss(toastId);

      // Reset editing state
      setEditingMemberId(null);
    } catch (error) {
      toast.dismiss(); // Dismiss loading if error
      console.error("Failed to update role:", error);
      // Error toast is handled by mutation onError
    }
  };

  const handleRemoveClick = (member: TeamMember) => {
    setMemberToRemove(member);
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!memberToRemove) return;

    try {
      // Fix: Get user ID from nested user object if not in root
      const userId = memberToRemove.user?.id || memberToRemove.user_id;

      if (!userId) {
        toast.error("Failed to identify user for removal");
        return;
      }

      await removeMemberMutation.mutateAsync(userId);
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
      await queryClient.invalidateQueries({
        queryKey: teamKeys.members(team.id),
      });
      refetch();
      onRefresh?.();
    } catch (error) {
      // Error already handled by mutation
      console.error("Remove member error:", error);
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

  const members = data?.data || [];
  const isTeamFull = team.is_full || false;

  return (
    <div className="px-6 pb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({members.length}
            {team.max_members ? ` / ${team.max_members}` : ""})
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenAddDialog}
            disabled={isTeamFull}
            title={isTeamFull ? "Team is full" : ""}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No members in this team</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleOpenAddDialog}
                disabled={isTeamFull}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Role in Team</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user?.avatar || ""} />
                          <AvatarFallback>
                            {member.user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {member.user?.name || "Unknown"}
                          </span>
                          {team.team_lead_id === member.user_id && (
                            <Badge variant="outline" className="text-xs">
                              Lead
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {member.user?.email || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {member.user?.department?.name || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {member.user?.position?.name || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingMemberId === member.id ? (
                        <Select
                          defaultValue={member.team_role_id?.toString()}
                          onValueChange={(val) => handleRoleChange(member, val)}
                          disabled={updateMemberMutation.isPending}
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={String(role.id)}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          {member.role_in_team ? (
                            <Badge variant="secondary">
                              {member.role_in_team}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setEditingMemberId(member.id)}
                            title="Edit Role"
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(member.joined_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveClick(member)}
                        disabled={team.team_lead_id === member.user_id}
                        title={
                          team.team_lead_id === member.user_id
                            ? "Cannot remove team lead"
                            : ""
                        }
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member to Team</DialogTitle>
            <DialogDescription>
              Select a user to add to &quot;{team.name}&quot;.
              {team.department_id && team.team_type !== "cross_functional" && (
                <>
                  {" "}
                  Only users from{" "}
                  <span className="font-semibold">
                    {team.department?.name || "the same department"}
                  </span>{" "}
                  can be added.
                </>
              )}
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

            {/* Info banner if filtering by department */}
            {team.department_id &&
              team.team_type !== "cross_functional" &&
              !loadingAvailable && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Department Filter:</strong> Only showing users from{" "}
                    <span className="font-semibold">
                      {team.department?.name || "this department"}
                    </span>
                    .
                    {availableUsers.length === 0 && (
                      <>
                        <br />
                        <span className="text-blue-900 mt-1 inline-block">
                          ⚠️ No users assigned to this department yet. Please
                          assign users to the department first.
                        </span>
                      </>
                    )}
                  </p>
                </div>
              )}

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
                  {filteredUsers.map((user) => {
                    // HYBRID CHECK: Check both fresh fetch (allMemberIds) AND current hook data
                    const isAlreadyMember =
                      allMemberIds.has(String(user.id)) ||
                      (data?.data || []).some(
                        (m) =>
                          String(m.user?.id || m.user_id) === String(user.id)
                      );

                    const isDisabled = isAlreadyMember || !user.is_active;

                    return (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all mb-1 ${
                          selectedUserId === user.id
                            ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
                            : isAlreadyMember
                            ? "bg-slate-200/60 border-transparent"
                            : "bg-white hover:bg-slate-50 border-transparent hover:border-slate-200 cursor-pointer"
                        } ${
                          isDisabled ? "pointer-events-none opacity-80" : ""
                        }`}
                        onClick={() =>
                          !isDisabled && setSelectedUserId(user.id)
                        }
                      >
                        <Avatar
                          className={`h-9 w-9 border ${
                            isAlreadyMember ? "grayscale opacity-70" : ""
                          }`}
                        >
                          <AvatarImage src={user.avatar || ""} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <p
                              className={`font-medium text-sm truncate ${
                                isAlreadyMember
                                  ? "text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {user.name}
                            </p>

                            {isAlreadyMember ? (
                              <Badge
                                variant="outline"
                                className="h-5 px-2 text-[10px] uppercase font-bold bg-slate-200 text-slate-600 border-slate-300"
                              >
                                ✅ Added
                              </Badge>
                            ) : (
                              <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  user.is_active ? "bg-green-500" : "bg-red-500"
                                }`}
                                title={user.is_active ? "Active" : "Inactive"}
                              />
                            )}
                          </div>

                          <div className="flex text-xs text-muted-foreground gap-2 truncate mt-0.5">
                            <span>{user.email}</span>
                            {user.department?.name && (
                              <>
                                <span>•</span>
                                <span>{user.department.name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {selectedUserId === user.id && (
                          <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        {isAlreadyMember && (
                          <div className="text-muted-foreground/40 px-2 text-xs font-medium">
                            Joined
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredUsers.length === 0 && !loadingAvailable && (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery
                        ? "No users found matching your search"
                        : "No available users to add"}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {selectedUserId && (
              <div className="pt-4 px-1">
                <Label className="mb-2 block">Role in Team</Label>
                <Select
                  value={selectedRoleId}
                  onValueChange={setSelectedRoleId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUserId || addMemberMutation.isPending}
            >
              {addMemberMutation.isPending ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog Removed */}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{memberToRemove?.user?.name}
              &quot; from this team?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMemberMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={removeMemberMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMemberMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
