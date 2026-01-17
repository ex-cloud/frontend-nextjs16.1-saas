"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomFieldManager } from "@/components/projects/dynamic/CustomFieldManager";
import { Project } from "@/types/project";

interface PropertiesTabProps {
  project: Project;
  onRefresh: () => void;
}

export function PropertiesTab({ project, onRefresh }: PropertiesTabProps) {
  return (
    <Card className="border-sidebar-border/40 shadow-sm">
      <CardHeader>
        <CardTitle>Custom Properties</CardTitle>
        <CardDescription>
          Define the data structure for tasks in this project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CustomFieldManager
          projectId={project.id}
          initialFields={project.custom_field_definitions || []}
          onRefresh={onRefresh}
        />
      </CardContent>
    </Card>
  );
}
