import { ProtectedRoute } from "@/components/protected-route";
import { ProjectsClient } from "./projects-client";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  return (
    <ProtectedRoute allowedRoles={["*"]}>
      <ProjectsClient />
    </ProtectedRoute>
  );
}
