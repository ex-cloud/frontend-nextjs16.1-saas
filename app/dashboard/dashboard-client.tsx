"use client";

/**
 * Dashboard Client Component
 *
 * Client-side interactive wrapper for dashboard
 * Receives real data from server component as props
 */

import { LazyChartAreaInteractive } from "@/lib/lazy-components";
import { DashboardStats } from "./actions";
import { UserMetricsChart } from "@/components/user-metrics-chart";
import { UserRolesChart } from "@/components/user-roles-chart";

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
      change: "+0%", // Can calculate from historical data
      changeType: "positive" as const,
      icon: "users",
    },
    {
      title: "Active Users",
      value: userStats.active_users.toString(),
      change: `${Math.round(
        (userStats.active_users / userStats.total_users) * 100
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
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {cardData.map((card, index) => (
          <div
            key={index}
            className="rounded-lg border bg-card p-4 glass-card fade-in-up shadow-sm hover:shadow-md transition-all duration-300"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
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
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <LazyChartAreaInteractive data={chartData} />
        </div>

        <div className="col-span-3">
          <div
            className="rounded-lg border bg-card p-4 glass-card fade-in-up h-full"
            style={{ animationDelay: "0.4s" }}
          >
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border-b last:border-0 pb-2 last:pb-0"
                  >
                    <p className="font-medium text-sm">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.causer?.name || "System"} · {activity.log_name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <UserMetricsChart stats={userStats} />
        <UserRolesChart data={userStats.users_by_role} />

        <div
          className="rounded-lg border bg-card p-4 glass-card fade-in-up"
          style={{ animationDelay: "0.6s" }}
        >
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
        </div>
      </div>
    </div>
  );
}
