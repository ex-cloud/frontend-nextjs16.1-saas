"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";

export default function ActivityPage() {
  return (
    <ProtectedRoute allowedRoles={["Super Admin", "Admin"]}>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
            <p className="text-muted-foreground">
              View and monitor system activities
            </p>
          </div>
        </div>

        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <Activity className="inline mr-2 h-5 w-5" />
                Activity Logs
              </CardTitle>
              <CardDescription>
                Activity log monitoring will be implemented in Task 10
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coming soon: Activity log viewer with filtering and export
                functionality
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
