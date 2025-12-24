"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Shield } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";

export default function RolesPage() {
  return (
    <ProtectedRoute allowedRoles={["Super Admin", "Admin"]}>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Roles Management
            </h1>
            <p className="text-muted-foreground">
              Manage system roles and permissions
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </div>

        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <Shield className="inline mr-2 h-5 w-5" />
                Roles
              </CardTitle>
              <CardDescription>
                Role management will be implemented in Task 9
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coming soon: Role CRUD with permission assignment interface
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
