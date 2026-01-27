import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
  hoverEffect?: boolean;
}

export function GlassCard({
  children,
  className,
  intensity = "medium",
  hoverEffect = false,
  ...props
}: GlassCardProps) {
  const intensityMap = {
    low: "bg-white/40 dark:bg-black/20 backdrop-blur-md border-white/20 dark:border-white/10",
    medium:
      "bg-white/60 dark:bg-black/40 backdrop-blur-lg border-white/30 dark:border-white/10 shadow-sm",
    high: "bg-white/80 dark:bg-black/60 backdrop-blur-xl border-white/40 dark:border-white/20 shadow-md",
  };

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-300",
        intensityMap[intensity],
        hoverEffect &&
          "hover:bg-white/70 dark:hover:bg-black/50 hover:shadow-lg hover:-translate-y-1",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
