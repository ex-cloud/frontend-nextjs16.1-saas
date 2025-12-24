"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus, Edit, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  useTeamMembers,
  useAddTeamMember,
  useUpdateTeamMember,
  useRemoveTeamMember,
} from "@/hooks/use-teams";
import type { Team, TeamMember } from "@/types/hrm";
import { toast } from "sonner";

interface TeamMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
}

export function TeamMembersDialog({
  open,
  onOpenChange,
  team,
}: TeamMembersDialogProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState("");
  const [editRole, setEditRole] = useState("");

  // Fetch team members
  const { data, isLoading, refetch } = useTeamMembers(team.id, true, 1, 50);

  // Mutations
  const addMemberMutation = useAddTeamMember(team.id);
  const updateMemberMutation = useUpdateTeamMember(team.id);
  const removeMemberMutation = useRemoveTeamMember(team.id);

  const handleAddMember = async () => {
    if (!newUserId || !newRole) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await addMemberMutation.mutateAsync({
        user_id: parseInt(newUserId),
        role_in_team: newRole,
      });
      setNewUserId("");
      setNewRole("");
      setShowAddMember(false);
      refetch();
    } catch (error: unknown) {
      console.error("Failed to add member:", error);
    }
  };

  const handleUpdateMember = async (member: TeamMember) => {
    if (!editRole) {
      toast.error("Please select a role");
      return;
    }

    try {
      await updateMemberMutation.mutateAsync({
        userId: member.user_id,
        roleInTeam: editRole,
      });
      setEditingMember(null);
      setEditRole("");
      refetch();
    } catch (error: unknown) {
      console.error("Failed to update member:", error);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (
      !confirm("Are you sure you want to remove this member from the team?")
    ) {
      return;
    }

    try {
      await removeMemberMutation.mutateAsync(userId);
      refetch();
    } catch (error: unknown) {
      console.error("Failed to remove member:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Team Members - {team.name}</DialogTitle>
          <DialogDescription>
            Manage team members and their roles within the team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Team Stats */}
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
            <div>
              <div className="text-sm text-muted-foreground">Total Members</div>
              <div className="text-2xl font-bold">
                {team.members_count || 0}
              </div>
            </div>
            {team.max_members && (
              <>
                <Separator orientation="vertical" className="h-12" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Max Capacity
                  </div>
                  <div className="text-2xl font-bold">{team.max_members}</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    Available Slots
                  </div>
                  <div className="text-2xl font-bold">
                    {team.max_members - (team.members_count || 0)}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Add Member Section */}
          {showAddMember ? (
            <div className="p-4 border rounded-lg space-y-4">
              <h4 className="font-medium">Add New Member</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    User ID
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter user ID"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Role in Team
                  </label>
                  <Input
                    placeholder="e.g., Developer, Designer"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={handleAddMember}
                    disabled={addMemberMutation.isPending}
                    className="flex-1"
                  >
                    {addMemberMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddMember(false);
                      setNewUserId("");
                      setNewRole("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowAddMember(true)} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member to Team
            </Button>
          )}

          {/* Members Table */}
          <div className="border rounded-lg">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role in Team</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data && data.data.length > 0 ? (
                    data.data.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {member.user?.name || `User #${member.user_id}`}
                            </div>
                            {member.user?.email && (
                              <div className="text-sm text-muted-foreground">
                                {member.user.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingMember?.id === member.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                placeholder="Enter role"
                                className="max-w-[200px]"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdateMember(member)}
                                disabled={updateMemberMutation.isPending}
                              >
                                {updateMemberMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Save"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingMember(null);
                                  setEditRole("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="secondary">
                              {member.role_in_team}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.joined_at
                            ? new Date(member.joined_at).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={member.is_active ? "default" : "secondary"}
                          >
                            {member.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {editingMember?.id !== member.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingMember(member);
                                  setEditRole(member.role_in_team || "");
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.user_id)}
                              disabled={removeMemberMutation.isPending}
                              className="text-destructive hover:text-destructive"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No members in this team yet. Add members to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
