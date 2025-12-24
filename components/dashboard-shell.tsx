"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { ErrorBoundary } from "@/components/error-boundary";

interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * DashboardShell is a Client Component that houses all interactive providers.
 * By keeping this separate from the layout.tsx (Server Component), we:
 * 1. Allow layout.tsx to handle server-side metadata.
 * 2. Avoid boundary issues when passing event handlers (like onReset) during static generation.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  const sidebarStyle = React.useMemo<React.CSSProperties>(
    () =>
      ({
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties),
    []
  );

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <ErrorBoundary
              onReset={() => {
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              }}
            >
              {children}
            </ErrorBoundary>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
