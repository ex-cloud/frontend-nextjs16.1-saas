"use client";

import { useEffect } from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { departmentSchema } from "@/lib/validations/hrm";
import { useDepartments } from "@/hooks/use-departments";
import type { Department, DepartmentInput } from "@/types/hrm";
import { z } from "zod";

interface DepartmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DepartmentInput) => Promise<void>;
  department?: Department | null;
  isLoading?: boolean;
}

export function DepartmentForm({
  open,
  onOpenChange,
  onSubmit,
  department,
  isLoading = false,
}: DepartmentFormProps) {
  const isEditMode = !!department;

  // Fetch departments for parent selection
  const { data: departmentsData } = useDepartments({
    per_page: 100,
    is_active: true,
  });

  const form = useForm<z.infer<typeof departmentSchema>>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      code: "",
      name: "",
      description: undefined,
      parent_id: undefined,
      manager_id: undefined,
      budget_allocated: undefined,
      location: undefined,
      is_active: true,
    },
  });

  // Reset form when department changes or dialog opens
  useEffect(() => {
    if (open) {
      if (department) {
        form.reset({
          code: department.code,
          name: department.name,
          description: department.description || undefined,
          parent_id: department.parent_id || undefined,
          manager_id: department.manager_id || undefined,
          budget_allocated:
            department.budget_allocated !== null &&
            department.budget_allocated !== undefined
              ? Number(department.budget_allocated)
              : undefined,
          location: department.location || undefined,
          is_active: department.is_active,
        });
      } else {
        form.reset({
          code: "",
          name: "",
          description: undefined,
          parent_id: undefined,
          manager_id: undefined,
          budget_allocated: undefined,
          location: undefined,
          is_active: true,
        });
      }
    }
  }, [department, open, form]);

  const handleSubmit = async (data: z.infer<typeof departmentSchema>) => {
    try {
      // Filter out null values and ensure proper types
      const submitData: DepartmentInput = {
        ...data,
        is_active: data.is_active ?? true,
        description: data.description || undefined,
        location: data.location || undefined,
        parent_id:
          data.parent_id && String(data.parent_id) === "none"
            ? null
            : data.parent_id,
      };
      await onSubmit(submitData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Filter out current department from parent selection (prevent self-parent)
  const availableParents =
    departmentsData?.data.filter((d) => d.id !== department?.id) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Department" : "Create New Department"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update department information and settings."
              : "Add a new department to your organization."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Basic Information</h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField<z.infer<typeof departmentSchema>, "code">
                  control={form.control}
                  name="code"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof departmentSchema>,
                      "code"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Code *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="DEPT-001"
                          {...field}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>
                        Unique department identifier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField<z.infer<typeof departmentSchema>, "name">
                  control={form.control}
                  name="name"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof departmentSchema>,
                      "name"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Human Resources" {...field} />
                      </FormControl>
                      <FormDescription>Department name</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField<z.infer<typeof departmentSchema>, "description">
                control={form.control}
                name="description"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof departmentSchema>,
                    "description"
                  >;
                }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief description of the department"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Organization Structure */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Organization Structure</h4>

              <FormField<z.infer<typeof departmentSchema>, "parent_id">
                control={form.control}
                name="parent_id"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof departmentSchema>,
                    "parent_id"
                  >;
                }) => (
                  <FormItem>
                    <FormLabel>Parent Department</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(
                          value === "none" ? null : parseInt(value)
                        )
                      }
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No parent</SelectItem>
                        {availableParents.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Optional: Select parent department for hierarchy
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<z.infer<typeof departmentSchema>, "manager_id">
                control={form.control}
                name="manager_id"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof departmentSchema>,
                    "manager_id"
                  >;
                }) => (
                  <FormItem>
                    <FormLabel>Department Manager</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Manager User ID"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      User ID of the department manager
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Additional Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Additional Details</h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField<z.infer<typeof departmentSchema>, "budget_allocated">
                  control={form.control}
                  name="budget_allocated"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof departmentSchema>,
                      "budget_allocated"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Budget Allocated</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>Department budget</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField<z.infer<typeof departmentSchema>, "location">
                  control={form.control}
                  name="location"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof departmentSchema>,
                      "location"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Building A, Floor 3"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>Physical location</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Status */}
            <FormField<z.infer<typeof departmentSchema>, "is_active">
              control={form.control}
              name="is_active"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  z.infer<typeof departmentSchema>,
                  "is_active"
                >;
              }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Inactive departments won&apos;t be visible in selections
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
