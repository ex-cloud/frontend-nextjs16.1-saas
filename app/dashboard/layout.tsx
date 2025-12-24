import * as React from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Enterprise Admin",
  description: "Manage your enterprise operations",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
