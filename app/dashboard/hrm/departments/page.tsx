"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProtectedRoute } from "@/components/protected-route";
import { DepartmentTable } from "@/components/hrm/departments/department-table";
import { DepartmentForm } from "@/components/hrm/departments/department-form";
import { DepartmentTree } from "@/components/hrm/departments/department-tree";
import {
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useRestoreDepartment,
} from "@/hooks/use-departments";
import { toast } from "sonner";
import { Table, Workflow } from "lucide-react";
import type { Department, DepartmentInput } from "@/types/hrm";

export default function DepartmentsPage() {
  const router = useRouter();
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    department: Department | null;
  }>({
    open: false,
    department: null,
  });
  const [activeTab, setActiveTab] = useState<"table" | "tree">("table");

  // Mutations
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();
  const restoreMutation = useRestoreDepartment();

  // Handlers
  const handleView = (department: Department) => {
    router.push(`/dashboard/hrm/departments/${department.id}`);
  };

  const handleCreate = () => {
    setFormDialog({ open: true, department: null });
  };

  const handleEdit = (department: Department) => {
    setFormDialog({ open: true, department });
  };

  const handleSubmit = async (data: DepartmentInput) => {
    try {
      if (formDialog.department) {
        await updateMutation.mutateAsync({
          id: formDialog.department.id,
          data,
        });
        toast.success("Department updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Department created successfully");
      }
      setFormDialog({ open: false, department: null });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Operation failed";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDelete = async (department: Department) => {
    if (!confirm("Are you sure you want to delete this department?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(department.id);
      toast.success("Department deleted successfully");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Delete failed";
      toast.error(errorMessage);
    }
  };

  const handleRestore = async (department: Department) => {
    try {
      await restoreMutation.mutateAsync(department.id);
      toast.success("Department restored successfully");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Restore failed";
      toast.error(errorMessage);
    }
  };

  return (
    <ProtectedRoute requireAuth>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
            <p className="text-muted-foreground">
              Manage organizational departments and hierarchy
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "table" | "tree")}
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="table">
                    <Table className="h-4 w-4 mr-2" />
                    Table View
                  </TabsTrigger>
                  <TabsTrigger value="tree">
                    <Workflow className="h-4 w-4 mr-2" />
                    Tree View
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="table" className="mt-0">
                  <DepartmentTable
                    onCreate={handleCreate}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                  />
                </TabsContent>

                <TabsContent value="tree" className="mt-0">
                  <DepartmentTree />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Dialog */}
      <DepartmentForm
        open={formDialog.open}
        onOpenChange={(open) => setFormDialog({ open, department: null })}
        onSubmit={handleSubmit}
        department={formDialog.department}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </ProtectedRoute>
  );
}
