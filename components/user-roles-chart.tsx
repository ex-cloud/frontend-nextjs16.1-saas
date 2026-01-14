"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserRolesChartProps {
  data: Array<{
    role: string;
    count: number;
  }>;
}

export function UserRolesChart({ data }: UserRolesChartProps) {
  // Sort data by count descending
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <Card
      className="glass-card shadow-sm fade-in-up"
      style={{ animationDelay: "0.5s" }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Users by Role</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={sortedData}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="role"
                type="category"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                width={80}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? "var(--primary)" : "var(--ring)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
