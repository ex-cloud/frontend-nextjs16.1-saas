"use client";

import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  FileText,
  Settings,
  Briefcase,
  PlusCircle,
  BarChart,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuickLink {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
}

const LINKS: QuickLink[] = [
  {
    icon: UserPlus,
    label: "Add Employee",
    href: "/dashboard/users/create",
    color: "text-blue-500",
  },
  {
    icon: PlusCircle,
    label: "New Project",
    href: "/dashboard/projects/create",
    color: "text-green-500",
  },
  {
    icon: FileText,
    label: "Reports",
    href: "/dashboard/reports",
    color: "text-purple-500",
  },
  {
    icon: Briefcase,
    label: "Manage Roles",
    href: "/dashboard/roles",
    color: "text-orange-500",
  },
  {
    icon: BarChart,
    label: "Analytics",
    href: "/dashboard/analytics",
    color: "text-pink-500",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/dashboard/settings",
    color: "text-gray-500",
  },
];

export function QuickLinksWidget({ className }: { className?: string }) {
  return (
    <GlassCard
      className={cn("p-4 h-full flex flex-col", className)}
      intensity="low"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Quick Actions</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {LINKS.map((link, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-full flex flex-col items-center justify-center gap-2 py-4 hover:border-primary/50 hover:bg-accent/50 transition-all group"
            asChild
          >
            <Link href={link.href}>
              <link.icon
                className={cn(
                  "w-6 h-6 transition-transform group-hover:scale-110",
                  link.color,
                )}
              />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                {link.label}
              </span>
            </Link>
          </Button>
        ))}
      </div>
    </GlassCard>
  );
}
