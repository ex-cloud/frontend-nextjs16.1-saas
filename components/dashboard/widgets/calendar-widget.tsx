"use client";

import * as React from "react";
import { GlassCard } from "@/components/ui/glass";
import { Calendar } from "@/components/ui/calendar"; // Assuming shadcn Calendar exists
import { cn } from "@/lib/utils";

interface CalendarWidgetProps {
  className?: string;
}

export function CalendarWidget({ className }: CalendarWidgetProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <GlassCard
      className={cn("p-4 h-full flex flex-col", className)}
      intensity="low"
    >
      <div className="flex items-center justify-between mb-2">
        {/* <h3 className="font-semibold text-lg">Calendar</h3> */}
      </div>
      <div className="flex-1 flex items-center justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border shadow-sm bg-background/50 backdrop-blur-sm"
        />
      </div>
    </GlassCard>
  );
}
