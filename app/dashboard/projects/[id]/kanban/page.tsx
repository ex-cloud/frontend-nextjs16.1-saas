import { ProtectedRoute } from "@/components/protected-route";
import { KanbanClient } from "./kanban-client";

export const dynamic = "force-dynamic";

interface KanbanPageProps {
  params: {
    id: string;
  };
}

export default async function KanbanPage({ params }: KanbanPageProps) {
  const { id } = await params;

  return (
    <ProtectedRoute allowedRoles={["*"]}>
      <KanbanClient projectId={id} />
    </ProtectedRoute>
  );
}
