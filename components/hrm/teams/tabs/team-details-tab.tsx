"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Team } from "@/types/hrm";
import {
  Building2,
  Users,
  Calendar,
  UserCircle,
  Layers,
  Activity,
} from "lucide-react";

interface TeamDetailsTabProps {
  team: Team;
}

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

// Helper function to get type label
function getTypeLabel(type: string): string {
  switch (type) {
    case "permanent":
      return "Permanent";
    case "project":
      return "Project";
    case "cross_functional":
      return "Cross Functional";
    default:
      return type;
  }
}

export function TeamDetailsTab({ team }: TeamDetailsTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* General Information */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            General Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Team Name
              </span>
              <p className="font-medium">{team.name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3" /> Code
              </span>
              <p className="font-medium font-mono text-sm bg-muted px-2 py-1 rounded w-fit">
                {team.code}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Department
              </span>
              <p className="font-medium">
                {team.department?.name || "No Department"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" /> Team Type
              </span>
              <Badge variant="outline" className="capitalize">
                {getTypeLabel(team.team_type)}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <UserCircle className="h-3 w-3" /> Team Lead
              </span>
              {team.team_lead ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={team.team_lead.avatar || ""} />
                    <AvatarFallback className="text-xs">
                      {team.team_lead.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">
                    {team.team_lead.name}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No Team Lead
                </p>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Team Capacity
              </span>
              <p className="font-medium">
                {team.active_members_count || 0}
                {team.max_members ? ` / ${team.max_members}` : " (Unlimited)"}
                {team.is_full && (
                  <Badge variant="destructive" className="ml-2">
                    Full
                  </Badge>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-1 border-t pt-4 mt-4">
            <span className="text-sm text-muted-foreground">Description</span>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">
              {team.description || "No description provided."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Status & Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Status & Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="flex">
                <Badge
                  variant={getStatusVariant(team.status)}
                  className="capitalize"
                >
                  {team.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
            {team.start_date && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">
                  Start Date
                </span>
                <p className="text-sm">
                  {new Date(team.start_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            {team.end_date && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">End Date</span>
                <p className="text-sm">
                  {new Date(team.end_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Created At</span>
              <p className="text-sm">
                {new Date(team.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">
                Last Updated
              </span>
              <p className="text-sm">
                {new Date(team.updated_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
