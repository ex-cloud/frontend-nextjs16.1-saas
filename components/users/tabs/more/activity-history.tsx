"use client";

import { useUserActivities } from "@/lib/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ActivityHistoryProps {
  userId: string;
}

export function ActivityHistory({ userId }: ActivityHistoryProps) {
  const { data: activities, isLoading } = useUserActivities(userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activities?.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity.
            </p>
          ) : (
            activities?.data?.map((log) => (
              <div key={log.id} className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border border-background bg-slate-400 z-10" />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm justify-between">
                    <span className="font-medium text-foreground">
                      {log.description}
                    </span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Caused by: {log.causer?.name || "System"}
                  </div>
                  {log.properties && Object.keys(log.properties).length > 0 && (
                    <div className="mt-1 p-2 bg-muted/40 rounded text-xs font-mono overflow-x-auto">
                      {JSON.stringify(log.properties, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
