"use client";

import * as React from "react";
import { Paperclip } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AttachmentsTab() {
  return (
    <Card className="border-sidebar-border/40 shadow-sm">
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
        <CardDescription>Files associated with this project</CardDescription>
      </CardHeader>
      <CardContent className="py-20 text-center text-muted-foreground">
        <Paperclip className="h-10 w-10 mx-auto mb-4 opacity-20" />
        <p>No attachments yet.</p>
      </CardContent>
    </Card>
  );
}
