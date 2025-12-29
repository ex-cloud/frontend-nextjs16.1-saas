"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Position } from "@/types/hrm";
import { GraduationCap, AlertCircle } from "lucide-react";

interface PositionSkillsTabProps {
  position: Position;
}

export function PositionSkillsTab({ position }: PositionSkillsTabProps) {
  const skills = position.required_skills || [];

  return (
    <div className="px-6 pb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Required Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
              <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
              <p>No specific skills listed for this position.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1 text-sm"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
