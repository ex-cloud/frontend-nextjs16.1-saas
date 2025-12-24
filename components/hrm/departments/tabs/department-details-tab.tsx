"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MapPin, DollarSign, User } from "lucide-react";
import type { Department } from "@/types/hrm";

interface DepartmentDetailsTabProps {
  department: Department;
}

export function DepartmentDetailsTab({
  department,
}: DepartmentDetailsTabProps) {
  const formatCurrency = (value: string | number | null | undefined) => {
    if (!value) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="px-6 pb-6 space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Department Name</p>
              <p className="font-medium">{department.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Code</p>
              <p className="font-mono font-medium">{department.code}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={department.is_active ? "default" : "secondary"}>
                {department.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="space-y-1 md:col-span-2 lg:col-span-3">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">
                {department.description || (
                  <span className="text-muted-foreground italic">
                    No description provided
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manager & Parent */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Manager</p>
              {department.manager ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={department.manager.avatar || ""} />
                    <AvatarFallback>
                      {department.manager.name?.charAt(0) || "M"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{department.manager.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {department.manager.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No manager assigned
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Parent Department</p>
              {department.parent ? (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{department.parent.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {department.parent.code}
                  </Badge>
                </div>
              ) : (
                <p className="text-muted-foreground italic">Root department</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location & Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location & Budget
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">
                {department.location || (
                  <span className="text-muted-foreground italic">
                    Not specified
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Allocated Budget</p>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium">
                  {formatCurrency(department.budget_allocated)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">
                {department.users_count || 0}
              </p>
              <p className="text-sm text-muted-foreground">Users</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">
                {department.positions_count || 0}
              </p>
              <p className="text-sm text-muted-foreground">Positions</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">
                {department.teams_count || 0}
              </p>
              <p className="text-sm text-muted-foreground">Teams</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">
                {department.children?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Sub-departments</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
