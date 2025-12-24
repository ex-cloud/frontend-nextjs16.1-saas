/**
 * Dashboard Page (Server Component)
 *
 * Fetches real data from backend API server-side
 * Passes data to client components for rendering
 */

import { getDashboardData } from "./actions";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch all dashboard data server-side
  const data = await getDashboardData();

  return <DashboardClient data={data} />;
}
