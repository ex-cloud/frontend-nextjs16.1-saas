"use client";

import { useEffect, useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LazyCalendar } from "@/lib/lazy-components";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { teamSchema } from "@/lib/validations/hrm";
import { useDepartments } from "@/hooks/use-departments";
import { departmentApi } from "@/lib/api/departments";
import { getAllUsersForAssignment } from "@/lib/api/hrm-assignments";
import type { Team, TeamInput, User } from "@/types/hrm";
import { TEAM_TYPE_OPTIONS, TEAM_STATUS_OPTIONS } from "@/types/hrm";
import { z } from "zod";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface TeamFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TeamInput) => Promise<void>;
  team?: Team | null;
  isLoading?: boolean;
}

export function TeamForm({
  open,
  onOpenChange,
  onSubmit,
  team,
  isLoading = false,
}: TeamFormProps) {
  const isEditMode = !!team;

  // State for available users (for Team Lead selection)
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Fetch departments for selection
  const { data: departmentsData } = useDepartments({
    per_page: 100,
    is_active: true,
  });

  // Watch department_id and team_type to fetch appropriate users
  const watchedDeptId = team?.department_id;
  const watchedTeamType = team?.team_type;

  // Fetch available users when dialog opens or department changes
  useEffect(() => {
    const fetchUsers = async () => {
      if (!open) return;

      setLoadingUsers(true);
      try {
        let users: User[];
        // For department-specific teams, fetch from department
        if (watchedDeptId && watchedTeamType !== "cross_functional") {
          const deptUsersRes = await departmentApi.getUsers(
            watchedDeptId,
            1,
            100
          );
          users = deptUsersRes.data || [];
        } else {
          // For cross-functional or no department, fetch all users
          users = await getAllUsersForAssignment();
        }
        setAvailableUsers(users);
      } catch (error) {
        console.error("Failed to fetch users for Team Lead:", error);
        setAvailableUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [open, watchedDeptId, watchedTeamType]);

  const form = useForm<z.infer<typeof teamSchema>>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      code: "",
      name: "",
      description: undefined,
      department_id: undefined,
      team_type: "project",
      team_lead_id: undefined,
      max_members: undefined,
      status: "active",
      start_date: undefined,
      end_date: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      if (team) {
        form.reset({
          code: team.code,
          name: team.name,
          description: team.description || undefined,
          department_id: team.department_id || undefined,
          team_type:
            (team.team_type as string) === "temporary"
              ? "cross_functional"
              : (team.team_type as z.infer<typeof teamSchema>["team_type"]),
          team_lead_id: team.team_lead_id || undefined,
          max_members: team.max_members || undefined,
          status:
            (team.status as string) === "archived" ||
            (team.status as string) === "disbanded"
              ? "completed"
              : (team.status as z.infer<typeof teamSchema>["status"]),
          start_date: team.start_date || undefined,
          end_date: team.end_date || undefined,
        });

        // Sync Date Range state
        if (team.start_date || team.end_date) {
          setDateRange({
            from: team.start_date ? new Date(team.start_date) : undefined,
            to: team.end_date ? new Date(team.end_date) : undefined,
          });
        } else {
          setDateRange(undefined);
        }
      } else {
        form.reset({
          code: "",
          name: "",
          description: undefined,
          department_id: undefined,
          team_type: "project",
          team_lead_id: undefined,
          max_members: undefined,
          status: "active",
          start_date: undefined,
          end_date: undefined,
        });
        setDateRange(undefined);
      }
    }
  }, [team, open, form]);

  const handleSubmit = async (data: z.infer<typeof teamSchema>) => {
    try {
      // Filter out null values and ensure proper types for TeamInput
      const submitData: TeamInput = {
        ...data,
        start_date:
          data.start_date instanceof Date
            ? data.start_date.toISOString()
            : data.start_date || undefined,
        end_date:
          data.end_date instanceof Date
            ? data.end_date.toISOString()
            : data.end_date || undefined,
        description: data.description || undefined,
        status: data.status || "active",
        team_type: data.team_type,
        department_id:
          data.department_id && String(data.department_id) === "none"
            ? null
            : data.department_id,
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
            {isEditMode ? "Edit Team" : "Create New Team"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update team information and settings."
              : "Add a new team to your organization."}
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
                <FormField<z.infer<typeof teamSchema>, "code">
                  control={form.control}
                  name="code"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof teamSchema>,
                      "code"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Code *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="TEAM-001"
                          {...field}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>Unique team code</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField<z.infer<typeof teamSchema>, "name">
                  control={form.control}
                  name="name"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof teamSchema>,
                      "name"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Product Team" {...field} />
                      </FormControl>
                      <FormDescription>Team name</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField<z.infer<typeof teamSchema>, "description">
                control={form.control}
                name="description"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof teamSchema>,
                    "description"
                  >;
                }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief description of the team"
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

            {/* Department & Type */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Organization</h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField<z.infer<typeof teamSchema>, "department_id">
                  control={form.control}
                  name="department_id"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof teamSchema>,
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

                <FormField<z.infer<typeof teamSchema>, "team_type">
                  control={form.control}
                  name="team_type"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof teamSchema>,
                      "team_type"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Team Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TEAM_TYPE_OPTIONS.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Type of team</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField<z.infer<typeof teamSchema>, "team_lead_id">
                  control={form.control}
                  name="team_lead_id"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof teamSchema>,
                      "team_lead_id"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Team Lead</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(
                            value === "none" ? null : parseInt(value)
                          )
                        }
                        value={field.value?.toString() || ""}
                        disabled={loadingUsers}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingUsers
                                  ? "Loading users..."
                                  : "Select team lead"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No team lead</SelectItem>
                          {availableUsers.map((user) => (
                            <SelectItem
                              key={user.id}
                              value={user.id.toString()}
                              disabled={!user.is_active}
                            >
                              {user.name} {!user.is_active && "(Inactive)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select who leads this team
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField<z.infer<typeof teamSchema>, "max_members">
                  control={form.control}
                  name="max_members"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<
                      z.infer<typeof teamSchema>,
                      "max_members"
                    >;
                  }) => (
                    <FormItem>
                      <FormLabel>Max Members</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 10"
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
                        Maximum team size (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Status & Timeline */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Status & Timeline</h4>

              <FormField<z.infer<typeof teamSchema>, "status">
                control={form.control}
                name="status"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof teamSchema>,
                    "status"
                  >;
                }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEAM_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Current team status</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Duration</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "PPP")} -{" "}
                            {format(dateRange.to, "PPP")}
                          </>
                        ) : (
                          format(dateRange.from, "PPP")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <LazyCalendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={(range) => {
                        setDateRange(range);
                        // Update form values directly
                        if (range?.from) {
                          form.setValue(
                            "start_date",
                            format(range.from, "yyyy-MM-dd"),
                            { shouldDirty: true, shouldValidate: true }
                          );
                        } else {
                          form.setValue("start_date", null, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }

                        if (range?.to) {
                          form.setValue(
                            "end_date",
                            format(range.to, "yyyy-MM-dd"),
                            { shouldDirty: true, shouldValidate: true }
                          );
                        } else {
                          form.setValue("end_date", null, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Select team formation date and expected end date (optional)
                </FormDescription>
                {form.formState.errors.start_date && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    {form.formState.errors.start_date.message}
                  </p>
                )}
                {form.formState.errors.end_date && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    {form.formState.errors.end_date.message}
                  </p>
                )}
              </div>
            </div>

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
