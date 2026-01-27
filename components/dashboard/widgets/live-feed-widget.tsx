"use client";

import { GlassCard } from "@/components/ui/glass";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";
import { ActivityLog } from "@/types/user";

interface LiveFeedWidgetProps {
  initialActivities: ActivityLog[];
  className?: string;
}

export function LiveFeedWidget({
  initialActivities,
  className,
}: LiveFeedWidgetProps) {
  // In a real scenario, we'd use a useEffect to subscribe to Echo/Pusher here
  // and prepend new activities to the list. For now, we render the initial list.

  return (
    <GlassCard
      className={cn("p-4 h-full flex flex-col", className)}
      intensity="low"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          <h3 className="font-semibold text-lg">Live Activity</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
          Real-time
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[300px] scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {initialActivities.length > 0 ? (
          initialActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-3 items-start p-3 rounded-lg bg-background/40 hover:bg-background/60 transition-colors border border-border/50"
            >
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-primary/80">
                    {activity.causer?.name || "System"}
                  </span>
                  <span>•</span>
                  <span>{activity.log_name}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
            <Activity className="w-8 h-8 opacity-20" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
