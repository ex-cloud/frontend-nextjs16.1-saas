"use client";

import * as React from "react";
import { Users, Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Project, ProjectMember } from "@/types/project";

interface TeamTabProps {
  project: Project;
  explicitMembers: ProjectMember[];
  loadingMembers: boolean;
  setShowAddMemberDialog: (show: boolean) => void;
  handleRemoveMember: (userId: string | number) => Promise<void>;
}

export function TeamTab({
  project,
  explicitMembers,
  loadingMembers,
  setShowAddMemberDialog,
  handleRemoveMember,
}: TeamTabProps) {
  return (
    <Card className="border-sidebar-border/40 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team & Assignments</CardTitle>
          <CardDescription>
            Manage who is involved in this project
          </CardDescription>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => setShowAddMemberDialog(true)}
        >
          <Plus className="h-4 w-4" /> Add Member
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 focus-visible:outline-none">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Project Owner</h4>
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
              <Avatar>
                <AvatarImage src={project.owner?.avatar_url || ""} />
                <AvatarFallback>
                  {project.owner?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{project.owner?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {project.owner?.email}
                </p>
              </div>
              <Badge
                variant="outline"
                className="ml-auto bg-primary/10 text-primary border-primary/20"
              >
                Owner
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center justify-between">
              Resource Assignments
              <span className="text-xs font-normal text-muted-foreground">
                {explicitMembers.length} Members
              </span>
            </h4>

            <div className="space-y-3">
              {loadingMembers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : explicitMembers.length > 0 ? (
                explicitMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-sidebar-border/40 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user?.avatar_url || ""} />
                        <AvatarFallback>
                          {member.user?.name?.substring(0, 2).toUpperCase() ||
                            "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {member.user?.name || "Unknown User"}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] capitalize"
                          >
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {member.is_team_assignment ? (
                            <span className="flex items-center gap-2">
                              <Users className="h-3 w-3" /> Inherited via Team
                            </span>
                          ) : (
                            "Explicitly Assigned"
                          )}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 rounded-lg border border-dashed border-sidebar-border/60">
                  <p className="text-sm text-muted-foreground">
                    No explicit members assigned yet.
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowAddMemberDialog(true)}
                  >
                    Assign now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
