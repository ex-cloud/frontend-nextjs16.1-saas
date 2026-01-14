"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Team, PaginatedResponse } from "@/types/hrm";
import { ProjectMemberRole } from "@/types/project";
import { departmentApi } from "@/lib/api/departments";
import { teamApi } from "@/lib/api/teams";
import { projectService } from "@/lib/api/services/project.service";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Check } from "lucide-react";

interface AddMemberDialogProps {
  projectId: string | number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  departmentId?: string | number;
}

export function AddMemberDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
  departmentId,
}: AddMemberDialogProps) {
  const [activeTab, setActiveTab] = React.useState<"users" | "teams">("users");
  const [search, setSearch] = React.useState("");
  const [users, setUsers] = React.useState<User[]>([]);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [role, setRole] = React.useState<ProjectMemberRole>("member");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
        // In a real app, you'd use a search endpoint.
        // For now, list users by department or all if no search.
        const res = await departmentApi.getUsers(Number(departmentId || 1));
        setUsers((res as PaginatedResponse<User>).data || []);
      } else {
        const res = await teamApi.list({
          search: search || undefined,
          department_id: departmentId ? Number(departmentId) : undefined,
        });
        setTeams(res.data || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load selection data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, departmentId, search]);

  React.useEffect(() => {
    if (open) {
      loadData();
      setSelectedId(null);
    }
  }, [open, loadData]);

  const handleSubmit = async () => {
    if (!selectedId) return;

    setSubmitting(true);
    try {
      await projectService.addProjectMember(projectId, {
        user_id: activeTab === "users" ? selectedId : null,
        team_id: activeTab === "teams" ? selectedId : null,
        role: role,
      });
      toast.success(
        activeTab === "users"
          ? "Member added successfully"
          : "Team added successfully"
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add member:", error);
      toast.error("Failed to add member to project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Project Member</DialogTitle>
          <DialogDescription>
            Assign individual users or entire functional teams to this project.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="users"
          className="w-full"
          onValueChange={(v) => setActiveTab(v as "users" | "teams")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Individuals</TabsTrigger>
            <TabsTrigger value="teams">Functional Teams</TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}...`}
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[300px] rounded-md border p-2">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-1">
                  {activeTab === "users" &&
                    users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedId(user.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent ${
                          selectedId === user.id ? "bg-accent" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || ""} />
                            <AvatarFallback>
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <p className="font-medium leading-none">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        {selectedId === user.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}

                  {activeTab === "teams" &&
                    teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedId(team.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent ${
                          selectedId === team.id ? "bg-accent" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                            <Users className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium leading-none">
                              {team.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {team.code} • {team.team_type}
                            </p>
                          </div>
                        </div>
                        {selectedId === team.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}

                  {((activeTab === "users" && users.length === 0) ||
                    (activeTab === "teams" && teams.length === 0)) &&
                    !loading && (
                      <div className="py-8 text-center text-muted-foreground">
                        No {activeTab} found.
                      </div>
                    )}
                </div>
              )}
            </ScrollArea>

            <div className="space-y-2">
              <Label>Project Role</Label>
              <Select
                value={role}
                onValueChange={(v: ProjectMemberRole) => setRole(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member (Read/Write)</SelectItem>
                  <SelectItem value="manager">Manager (Admin)</SelectItem>
                  <SelectItem value="observer">Observer (Read Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!selectedId || submitting} onClick={handleSubmit}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add to Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
