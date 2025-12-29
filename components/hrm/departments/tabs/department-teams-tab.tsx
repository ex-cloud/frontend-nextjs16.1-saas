"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDepartmentTeams } from "@/hooks/use-departments";
import { useCreateTeam } from "@/hooks/use-teams";
import { UsersRound, Plus, User, Search, Check, Link2, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { TEAM_TYPE_OPTIONS, TEAM_STATUS_OPTIONS, Team } from "@/types/hrm";
import { toast } from "sonner";
import { teamApi } from "@/lib/api/teams";

interface DepartmentTeamsTabProps {
  departmentId: number;
  onRefresh?: () => void;
}

export function DepartmentTeamsTab({
  departmentId,
  onRefresh,
}: DepartmentTeamsTabProps) {
  const { data, isLoading, refetch } = useDepartmentTeams(departmentId, 1, 50);
  const createTeamMutation = useCreateTeam();

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [teamToRemove, setTeamToRemove] = useState<Team | null>(null);

  // Add existing team state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Create new team state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    team_type: "permanent" as const,
    description: "",
    max_members: "",
  });

  const getTeamTypeLabel = (type: string) => {
    const option = TEAM_TYPE_OPTIONS.find((o) => o.value === type);
    return option?.label || type;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "destructive";
      case "completed":
        return "outline";
      case "on_hold":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    const option = TEAM_STATUS_OPTIONS.find((o) => o.value === status);
    return option?.label || status;
  };

  // Open Add Team dialog (assign existing)
  const handleOpenAddDialog = async () => {
    setSelectedTeams([]);
    setSearchQuery("");
    setAddDialogOpen(true);
    setLoadingAvailable(true);

    try {
      // Fetch all teams not in this department
      const response = await teamApi.list({ per_page: 100 });
      const currentTeamIds = (data?.data || []).map((t) => t.id);
      // Filter teams that are not already in this department
      const available = (response.data || []).filter(
        (t) =>
          t.department_id !== departmentId && !currentTeamIds.includes(t.id)
      );
      setAvailableTeams(available);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      toast.error("Failed to load available teams");
    } finally {
      setLoadingAvailable(false);
    }
  };

  // Open Create Team dialog
  const handleOpenCreateDialog = () => {
    setFormData({
      name: "",
      code: "",
      team_type: "permanent",
      description: "",
      max_members: "",
    });
    setCreateDialogOpen(true);
  };

  const handleToggleTeam = (teamId: number) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  // Add existing teams to department
  const handleAddTeams = async () => {
    if (selectedTeams.length === 0) return;

    setIsAdding(true);
    try {
      // Update each team to belong to this department
      await Promise.all(
        selectedTeams.map((teamId) =>
          teamApi.update(teamId, { department_id: departmentId })
        )
      );

      toast.success(
        `Successfully added ${selectedTeams.length} team(s) to department`
      );
      setAddDialogOpen(false);
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error("Failed to add teams:", error);
      toast.error("Failed to add teams. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  // Create new team
  const handleCreateTeam = async () => {
    if (!formData.name || !formData.code) {
      toast.error("Name and Code are required");
      return;
    }

    try {
      await createTeamMutation.mutateAsync({
        name: formData.name,
        code: formData.code,
        team_type: formData.team_type,
        description: formData.description || undefined,
        max_members: formData.max_members
          ? parseInt(formData.max_members)
          : undefined,
        department_id: departmentId,
        status: "active",
      });

      toast.success("Team created successfully");
      setCreateDialogOpen(false);
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error("Failed to create team:", error);
      toast.error("Failed to create team");
    }
  };

  // Remove team from department
  const handleRemoveClick = (team: Team) => {
    setTeamToRemove(team);
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!teamToRemove) return;

    setIsRemoving(true);
    try {
      // Set team's department_id to null
      await teamApi.update(teamToRemove.id, { department_id: null });

      toast.success(
        `Successfully removed ${teamToRemove.name} from department`
      );
      setRemoveDialogOpen(false);
      setTeamToRemove(null);
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error("Failed to remove team:", error);
      toast.error("Failed to remove team. Please try again.");
    } finally {
      setIsRemoving(false);
    }
  };

  const filteredTeams = availableTeams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.code.toLowerCase().includes(searchQuery.toLowerCase())
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

  const teams = data?.data || [];

  return (
    <div className="px-6 pb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <UsersRound className="h-5 w-5" />
            Department Teams ({teams.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleOpenAddDialog}>
              <Link2 className="h-4 w-4 mr-2" />
              Add Team
            </Button>
            <Button size="sm" onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-center py-8">
              <UsersRound className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No teams in this department
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenAddDialog}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Add Existing Team
                </Button>
                <Button size="sm" onClick={handleOpenCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Team
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Team Lead</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UsersRound className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{team.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{team.code}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTeamTypeLabel(team.team_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {team.team_lead ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={team.team_lead.avatar || ""} />
                            <AvatarFallback className="text-xs">
                              {team.team_lead.name?.charAt(0) || "L"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{team.team_lead.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          <User className="h-3 w-3 inline mr-1" />
                          Not assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {team.members_count || 0}
                        {team.max_members && ` / ${team.max_members}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(team.status)}
                        className={
                          team.status === "inactive"
                            ? "bg-red-500 hover:bg-red-600"
                            : ""
                        }
                      >
                        {getStatusLabel(team.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveClick(team)}
                      >
                        <X className="h-4 w-4 mr-1" />
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

      {/* Add Existing Team Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team to Department</DialogTitle>
            <DialogDescription>
              Select existing teams to add to this department.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px] border rounded-md">
              {loadingAvailable ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredTeams.map((team) => {
                    const isActive = team.status === "active";
                    const statusColor =
                      team.status === "active"
                        ? "bg-green-500"
                        : team.status === "inactive"
                        ? "bg-red-500"
                        : team.status === "on_hold"
                        ? "bg-orange-500"
                        : "bg-gray-500";

                    return (
                      <div
                        key={team.id}
                        className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer ${
                          !isActive
                            ? "opacity-50 cursor-not-allowed bg-muted/50"
                            : ""
                        }`}
                        onClick={() => {
                          if (isActive) handleToggleTeam(team.id);
                        }}
                      >
                        <Checkbox
                          checked={selectedTeams.includes(team.id)}
                          disabled={!isActive}
                          onCheckedChange={() => handleToggleTeam(team.id)}
                        />
                        <UsersRound className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{team.name}</p>
                            <div
                              className={`w-2 h-2 rounded-full ${statusColor}`}
                              title={getStatusLabel(team.status)}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {team.code}
                          </p>
                        </div>
                        {selectedTeams.includes(team.id) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    );
                  })}
                  {filteredTeams.length === 0 && !loadingAvailable && (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery
                        ? "No teams found matching your search"
                        : "No available teams to add"}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {selectedTeams.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedTeams.length} team(s) selected
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTeams}
              disabled={selectedTeams.length === 0 || isAdding}
            >
              {isAdding ? "Adding..." : "Add Teams"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Team Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team for this department.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Development Team Alpha"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="e.g., DEV-ALPHA"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_type">Team Type</Label>
              <Select
                value={formData.team_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    team_type: value as typeof formData.team_type,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team type" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_members">Max Members</Label>
              <Input
                id="max_members"
                type="number"
                placeholder="Leave empty for unlimited"
                value={formData.max_members}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    max_members: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Team description..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={createTeamMutation.isPending}
            >
              {createTeamMutation.isPending ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Team Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{teamToRemove?.name}&quot;
              from this department? The team will still exist but won&apos;t be
              linked to this department.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
