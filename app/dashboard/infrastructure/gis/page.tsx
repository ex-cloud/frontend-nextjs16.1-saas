"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

// Leaflet needs window, so we must load it dynamically with SSR disabled
const GisMap = dynamic(() => import("@/components/infrastructure/GisMap"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-[600px] w-full rounded-xl" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  ),
});

import { ProtectedRoute } from "@/components/protected-route";

export default function GisPage() {
  return (
    <ProtectedRoute allowedRoles={["Super Admin", "Admin", "Network Engineer"]}>
      <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            GIS Topology Mapping
          </h1>
          <p className="text-muted-foreground">
            Visualisasikan dan kelola infrastruktur fisik jaringan Anda di atas
            peta nyata.
          </p>
        </div>
        <Card className="overflow-hidden border-gray-400 shadow-none rounded-md bg-sidebar/50 backdrop-blur-sm">
          <div className="p-0">
            <GisMap />
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
