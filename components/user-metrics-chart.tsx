"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserStats } from "@/types/user";

interface UserMetricsChartProps {
  stats: UserStats;
}

export function UserMetricsChart({ stats }: UserMetricsChartProps) {
  const data = [
    { name: "Active", value: stats.active_users, color: "var(--primary)" },
    {
      name: "Inactive",
      value: stats.inactive_users,
      color: "var(--muted-foreground)",
    },
  ];

  // Custom localized legend/tooltip can be added here

  return (
    <Card
      className="glass-card shadow-sm fade-in-up"
      style={{ animationDelay: "0.4s" }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          User Activity Level
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">
              Verified
            </p>
            <p className="text-xl font-bold">{stats.verified_users}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">
              Unverified
            </p>
            <p className="text-xl font-bold">{stats.unverified_users}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
