"use client";

import { useMemo } from "react";
import { useUserActivities, useUserComments } from "@/lib/hooks/use-users";
import { ActivityHistoryItem } from "@/components/users/tabs/more/activity-history-item";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ActivityLog, Comment } from "@/types/user";

interface ActivityAuditTrailProps {
  userId: string;
}

export function ActivityAuditTrail({ userId }: ActivityAuditTrailProps) {
  // Data Fetching
  const { data: activities } = useUserActivities(userId);
  const { data: comments } = useUserComments(userId);

  // Merge and Sort Data
  const stream = useMemo(() => {
    const activityItems: ActivityLog[] = activities?.data || [];

    // Transform comments into ActivityLog shape for unified rendering
    const commentItems: ActivityLog[] = (comments || []).map((c: Comment) => ({
      id: `comment-${c.id}`,
      log_name: "comment",
      description: "commented",
      event: "commented",
      subject_type: "Comment",
      subject_id: String(c.id),
      causer: c.author
        ? {
            id: "unknown",
            name: c.author.name,
            avatar_url: c.author.avatar,
          }
        : null,
      properties: {
        attributes: {
          body: c.body,
        },
      },
      created_at: c.created_at,
      created_at_human: c.created_at,
    }));

    // Combine
    const unified = [...activityItems, ...commentItems];

    // Sort by created_at DESC
    return unified.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  }, [activities, comments]);

  return (
    <Card className="shadow-none rounded-md border mt-6">
      <CardHeader className="border-b px-6 py-4">
        <CardTitle className="text-base font-medium">
          ACTIVITY & AUDIT TRAIL
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-0">
        <div className="space-y-0">
          {stream.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No activity yet.
            </div>
          ) : (
            stream.map((item, index) => (
              <ActivityHistoryItem
                key={item.id}
                log={item}
                isLast={index === stream.length - 1}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
