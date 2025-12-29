"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Position } from "@/types/hrm";
import {
  Building2,
  Wallet,
  Award,
  Calendar,
  Users,
  Briefcase,
} from "lucide-react";

interface PositionDetailsTabProps {
  position: Position;
}

export function PositionDetailsTab({ position }: PositionDetailsTabProps) {
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
                <Briefcase className="h-3 w-3" /> Position Name
              </span>
              <p className="font-medium">{position.name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Award className="h-3 w-3" /> Code
              </span>
              <p className="font-medium font-mono text-sm bg-muted px-2 py-1 rounded w-fit">
                {position.code}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Department
              </span>
              <p className="font-medium">
                {position.department?.name || "No Department"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Level
              </span>
              <p className="font-medium capitalize">
                {position.level?.replace("-", " ") || "N/A"}
              </p>
            </div>
          </div>

          <div className="space-y-1 border-t pt-4 mt-4">
            <span className="text-sm text-muted-foreground">Description</span>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">
              {position.description || "No description provided."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Compensation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Compensation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">
                Salary Range
              </span>
              {position.salary_min || position.salary_max ? (
                <div className="flex flex-col">
                  <p className="font-medium text-lg">{position.salary_range}</p>
                  <span className="text-xs text-muted-foreground">
                    {position.salary_currency} / Month
                  </span>
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Not specified
                </p>
              )}
            </div>
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
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="flex">
                <Badge
                  variant={position.is_active ? "default" : "destructive"}
                  className={!position.is_active ? "bg-red-500" : ""}
                >
                  {position.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Created At</span>
              <p className="text-sm">
                {new Date(position.created_at).toLocaleDateString("en-US", {
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
                {new Date(position.updated_at).toLocaleDateString("en-US", {
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
