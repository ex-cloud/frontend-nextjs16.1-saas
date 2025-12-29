import { ProtectedRoute } from "@/components/protected-route";
import { UsersClient } from "./users-client";

export const dynamic = "force-dynamic";

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={["Super Admin", "Admin"]}>
      <UsersClient />
    </ProtectedRoute>
  );
}
