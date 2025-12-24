import { ProtectedRoute } from "@/components/protected-route";
import { UsersClient } from "./users-client";
import { getUsersPageData } from "./actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  // Fetch initial data on server-side
  const data = await getUsersPageData();

  return (
    <ProtectedRoute allowedRoles={["Super Admin", "Admin"]}>
      <UsersClient initialRoles={data.roles} />
    </ProtectedRoute>
  );
}
