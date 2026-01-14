"use client";

import { useUserActivities } from "@/lib/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import { ActivityHistoryItem } from "./activity-history-item";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ActivityHistoryProps {
  userId: string;
}

export function ActivityHistory({ userId }: ActivityHistoryProps) {
  const {
    data: activities,
    isLoading,
    refetch,
    isRefetching,
  } = useUserActivities(userId);

  return (
    <Card className="card shadow-none rounded-md">
      <CardHeader className="card-header flex items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Activity History
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            Auto-updated
          </span>
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="p-1.5 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
            title="Sync/Refresh Activities"
          >
            <Loader2
              className={cn(
                "h-4 w-4",
                (isLoading || isRefetching) && "animate-spin"
              )}
            />
            <span className="sr-only">Refresh</span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="">
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activities?.data?.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-muted/10 border-dashed">
              <p className="text-sm text-muted-foreground">
                No recent activity found.
              </p>
            </div>
          ) : (
            <div className="relative pt-2 pb-6">
              {activities?.data?.slice(0, 5).map((log, index, arr) => (
                <ActivityHistoryItem
                  key={log.id}
                  log={log}
                  isLast={index === arr.length - 1}
                />
              ))}
            </div>
          )}

          {/* View Full Audit Log Footer */}
          {!isLoading && activities?.data && activities.data.length > 0 && (
            <div className="pt-4 border-t flex justify-center">
              <Link
                href={`/dashboard/users/${userId}/audit`}
                className="group flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View Full Audit Log
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
