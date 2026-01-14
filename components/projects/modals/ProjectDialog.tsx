"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { projectService } from "@/lib/api/services/project.service";
import departmentApi from "@/lib/api/departments";
import type { Department, User } from "@/types/hrm";
import type { AxiosError } from "axios";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const projectSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  key: z.string().min(2, "Key must be at least 2 characters").max(10),
  description: z.string().optional(),
  department_id: z.string().min(1, "Please select a department"),
  owner_id: z.string().min(1, "Please select an owner"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  due_date: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ProjectDialog({
  open,
  onOpenChange,
  onSuccess,
}: ProjectDialogProps) {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [availableOwners, setAvailableOwners] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      department_id: "",
      owner_id: "",
      priority: "medium",
    },
  });

  // Fetch departments on mount
  React.useEffect(() => {
    if (open) {
      departmentApi.list({ per_page: 50 }).then((res) => {
        // Handle potential nested data from Resource + Paginator combo
        if ("data" in res && Array.isArray(res.data)) {
          setDepartments(res.data);
        } else if (Array.isArray(res)) {
          setDepartments(res);
        }
      });
    }
  }, [open]);

  // Sync: Update owners when department changes
  const selectedDeptId = form.watch("department_id");
  React.useEffect(() => {
    if (selectedDeptId) {
      departmentApi.getUsers(Number(selectedDeptId)).then((res) => {
        // Handle potential nested data from Resource + Paginator combo
        if ("data" in res && Array.isArray(res.data)) {
          setAvailableOwners(res.data);
        } else if (Array.isArray(res)) {
          setAvailableOwners(res);
        }
      });
      form.setValue("owner_id", ""); // Reset owner selection
    }
  }, [selectedDeptId, form]);

  async function onSubmit(values: ProjectFormValues) {
    setLoading(true);
    try {
      await projectService.createProject(values);
      toast.success("Project created successfully");
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{
        message?: string;
        errors?: Record<string, string[]>;
      }>;
      const apiError = axiosError.response?.data;

      if (axiosError.response?.status === 422 && apiError?.errors) {
        // Map backend validation errors to form fields
        Object.entries(apiError.errors).forEach(([key, messages]) => {
          form.setError(key as keyof ProjectFormValues, {
            type: "manual",
            message: Array.isArray(messages) ? messages[0] : messages,
          });
        });
        toast.error(apiError.message || "Validation failed");
      } else {
        toast.error(apiError?.message || "Failed to create project");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter the details of your new project. Owner options will update
            based on the department.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Website Redesign" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Key</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. WR" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="owner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Owner</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!selectedDeptId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              selectedDeptId
                                ? "Select Owner"
                                : "Select Department First"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableOwners.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) => field.onChange(date?.toISOString())}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief project overview..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
