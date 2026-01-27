"use client";

/**
 * Dashboard Client Component
 *
 * Client-side interactive wrapper for dashboard
 * Receives real data from server component as props
 * Features: Customizable grid layout with drag-and-drop
 */

import { LazyChartAreaInteractive } from "@/lib/lazy-components";
import { DashboardStats } from "./actions";
import { UserMetricsChart } from "@/components/user-metrics-chart";
import { UserRolesChart } from "@/components/user-roles-chart";

import { GlassCard } from "@/components/ui/glass";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { CalendarWidget } from "@/components/dashboard/widgets/calendar-widget";
import { LiveFeedWidget } from "@/components/dashboard/widgets/live-feed-widget";
import { QuickLinksWidget } from "@/components/dashboard/widgets/quick-links-widget";

interface DashboardClientProps {
  data: DashboardStats;
}

export function DashboardClient({ data }: DashboardClientProps) {
  const { userStats, hrmStats, recentActivities, chartData } = data;

  // Transform stats for SectionCards format
  const cardData = [
    {
      title: "Total Users",
      value: userStats.total_users.toString(),
      change: "+0%",
      changeType: "positive" as const,
      icon: "users",
    },
    {
      title: "Active Users",
      value: userStats.active_users.toString(),
      change: `${Math.round(
        (userStats.active_users / userStats.total_users) * 100,
      )}%`,
      changeType: "positive" as const,
      icon: "userCheck",
    },
    {
      title: "Departments",
      value: hrmStats.total_departments.toString(),
      change: "+0%",
      changeType: "neutral" as const,
      icon: "building",
    },
    {
      title: "Positions",
      value: hrmStats.total_positions.toString(),
      change: `${hrmStats.total_teams} teams`,
      changeType: "neutral" as const,
      icon: "briefcase",
    },
  ];

  return (
    <DashboardGrid>
      {/* 1. Stats Grid */}
      <div
        key="stats"
        className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 h-full"
      >
        {cardData.map((card, index) => (
          <GlassCard key={index} intensity="medium" hoverEffect className="p-4">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {card.title}
            </p>
            <h3 className="text-3xl font-extrabold mt-2 tracking-tight">
              {card.value}
            </h3>
            <p
              className={`text-xs mt-2 font-semibold ${
                card.changeType === "positive"
                  ? "text-green-600"
                  : "text-muted-foreground"
              }`}
            >
              {card.change}
            </p>
          </GlassCard>
        ))}
      </div>

      {/* 2. Quick Links */}
      <div key="quick-links" className="h-full">
        <QuickLinksWidget />
      </div>

      {/* 3. Main Chart */}
      <div key="main-chart" className="h-full">
        <GlassCard className="p-0 overflow-hidden h-full" intensity="low">
          <LazyChartAreaInteractive data={chartData} />
        </GlassCard>
      </div>

      {/* 4. Calendar */}
      <div key="calendar" className="h-full">
        <CalendarWidget />
      </div>

      {/* 5. Live Feed (Replacing old 'activity') */}
      <div key="live-feed" className="h-full">
        <LiveFeedWidget initialActivities={recentActivities} />
      </div>

      {/* 6. Bottom Charts */}
      <div key="user-metrics" className="h-full">
        <UserMetricsChart stats={userStats} />
      </div>

      <div key="role-distribution" className="h-full">
        <UserRolesChart data={userStats.users_by_role} />
      </div>

      {/* 7. HRM Overview */}
      <div key="hrm-overview" className="h-full">
        <GlassCard className="p-4 h-full" intensity="medium">
          <h3 className="text-lg font-semibold mb-4">HRM Overview</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Departments
              </span>
              <span className="font-medium">{hrmStats.total_departments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Active Departments
              </span>
              <span className="font-medium">{hrmStats.active_departments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Positions
              </span>
              <span className="font-medium">{hrmStats.total_positions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Teams</span>
              <span className="font-medium">{hrmStats.total_teams}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </DashboardGrid>
  );
}
