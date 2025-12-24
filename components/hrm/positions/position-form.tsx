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
import { positionSchema } from "@/lib/validations/hrm";
import { useDepartments } from "@/hooks/use-departments";
import type { Position, PositionInput } from "@/types/hrm";
import { POSITION_LEVEL_OPTIONS } from "@/types/hrm";
import { z } from "zod";

interface PositionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PositionInput) => Promise<void>;
  position?: Position | null;
  isLoading?: boolean;
}

export function PositionForm({
  open,
  onOpenChange,
  onSubmit,
  position,
  isLoading = false,
}: PositionFormProps) {
  const isEditMode = !!position;

  // Fetch departments for selection
  const { data: departmentsData } = useDepartments({
    per_page: 100,
    is_active: true,
  });

  const form = useForm<z.infer<typeof positionSchema>>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      code: "",
      name: "",
      description: undefined,
      department_id: undefined,
      level: "junior",
      salary_min: undefined,
      salary_max: undefined,
      salary_currency: "IDR",
      required_skills: undefined,
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (position) {
        form.reset({
          code: position.code,
          name: position.name,
          description: position.description || undefined,
          department_id: position.department_id || undefined,
          level:
            (position.level as string) === "middle"
              ? "mid-level"
              : (position.level as string) === "executive"
              ? "c-level"
              : (position.level as z.infer<typeof positionSchema>["level"]),
          salary_min:
            position.salary_min !== null && position.salary_min !== undefined
              ? Number(position.salary_min)
              : undefined,
          salary_max:
            position.salary_max !== null && position.salary_max !== undefined
              ? Number(position.salary_max)
              : undefined,
          salary_currency: position.salary_currency || "IDR",
          required_skills: position.required_skills || undefined,
          is_active: position.is_active,
        });
      } else {
        form.reset({
          code: "",
          name: "",
          description: undefined,
          department_id: undefined,
          level: "junior",
          salary_min: undefined,
          salary_max: undefined,
          salary_currency: "IDR",
          required_skills: undefined,
          is_active: true,
        });
      }
    }
  }, [position, open, form]);

  const handleSubmit = async (values: z.infer<typeof positionSchema>) => {
    try {
      // Ensure mandatory fields for PositionInput
      const submitData: PositionInput = {
        ...values,
        salary_currency: values.salary_currency || "IDR",
        is_active: values.is_active ?? true,
        description: values.description || undefined,
        required_skills: values.required_skills || undefined,
        department_id:
          values.department_id && String(values.department_id) === "none"
            ? null
            : values.department_id,
      };
      await onSubmit(submitData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Position" : "Create New Position"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update position information and requirements."
              : "Add a new position to your organization."}
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
                <FormField<z.infer<typeof positionSchema>, "code">
                  control={form.control}
                  name="code"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof positionSchema>,
                      "code"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Code *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="POS-001"
                          {...field}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>Unique position code</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField<z.infer<typeof positionSchema>, "name">
                  control={form.control}
                  name="name"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof positionSchema>,
                      "name"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} />
                      </FormControl>
                      <FormDescription>Position title</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField<z.infer<typeof positionSchema>, "description">
                control={form.control}
                name="description"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof positionSchema>,
                    "description"
                  >;
                }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief description of the position"
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

            {/* Department & Level */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Department & Level</h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField<z.infer<typeof positionSchema>, "department_id">
                  control={form.control}
                  name="department_id"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof positionSchema>,
                      "department_id"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
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
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No department</SelectItem>
                          {departmentsData?.data.map((dept) => (
                            <SelectItem
                              key={dept.id}
                              value={dept.id.toString()}
                            >
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Optional: Assign to department
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField<z.infer<typeof positionSchema>, "level">
                  control={form.control}
                  name="level"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof positionSchema>,
                      "level"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Level *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {POSITION_LEVEL_OPTIONS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Position level</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Salary Range */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Salary Range</h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField<z.infer<typeof positionSchema>, "salary_min">
                  control={form.control}
                  name="salary_min"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof positionSchema>,
                      "salary_min"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Minimum Salary</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>Minimum salary range</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField<z.infer<typeof positionSchema>, "salary_max">
                  control={form.control}
                  name="salary_max"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof positionSchema>,
                      "salary_max"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Maximum Salary</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>Maximum salary range</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Required Skills */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Required Skills</h4>

              <FormField<z.infer<typeof positionSchema>, "required_skills">
                control={form.control}
                name="required_skills"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof positionSchema>,
                    "required_skills"
                  >;
                }) => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Skills (comma separated)"
                        {...field}
                        value={(field.value || []).join(", ")}
                        onChange={(e) => {
                          const skills = e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter((s) => s.length > 0);
                          field.onChange(skills.length > 0 ? skills : null);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter skills separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Status */}
            <FormField<z.infer<typeof positionSchema>, "is_active">
              control={form.control}
              name="is_active"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  z.infer<typeof positionSchema>,
                  "is_active"
                >;
              }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Inactive positions won&apos;t be available for assignment
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
