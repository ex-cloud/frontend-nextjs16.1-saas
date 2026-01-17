"use client";

import * as React from "react";
import { History } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ActivityTab() {
  return (
    <Card className="border-sidebar-border/40 shadow-sm">
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
        <CardDescription>Recent changes to this project</CardDescription>
      </CardHeader>
      <CardContent className="py-20 text-center text-muted-foreground">
        <History className="h-10 w-10 mx-auto mb-4 opacity-20" />
        <p>Activity history coming soon.</p>
      </CardContent>
    </Card>
  );
}
