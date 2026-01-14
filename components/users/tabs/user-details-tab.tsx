"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user";
import { useUpdateUser } from "@/lib/hooks/use-users";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Pencil, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { usePermissions } from "@/hooks/use-permissions";
import { useDepartments } from "@/hooks/use-departments";
import { usePositions } from "@/hooks/use-positions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useUserPage } from "@/components/users/user-page-context";

interface UserDetailsTabProps {
  user: User;
  userId: string;
}

const userDetailsSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Full name is required"),
  first_name: z.string().optional(),
  middle_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  language: z.string().optional(),
  time_zone: z.string().optional(),
  is_active: z.boolean(),
  // Employment
  employee_number: z.string().optional(),
  department_id: z.union([z.string(), z.number()]).nullable().optional(),
  position_id: z.union([z.string(), z.number()]).nullable().optional(),
  join_date: z.union([z.string(), z.date()]).nullable().optional(),
  probation_end_date: z.union([z.string(), z.date()]).nullable().optional(),
  // Contact
  phone: z.string().optional(),
  work_phone: z.string().optional(),
  address: z.string().optional(),
});

type UserDetailsFormData = z.infer<typeof userDetailsSchema>;

export function UserDetailsTab({ user, userId }: UserDetailsTabProps) {
  const [editMode, setEditMode] = useState<{
    employment: boolean;
    contact: boolean;
  }>({
    employment: false,
    contact: false,
  });

  /* Avatar logic moved to Sidebar */
  const queryClient = useQueryClient();

  const { mutateAsync: updateUser } = useUpdateUser();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const { setIsDirty, registerSaveHandler } = useUserPage();

  const { data: departmentsData } = useDepartments(
    { per_page: 100, is_active: true },
    { enabled: editMode.employment }
  );

  const form = useForm<UserDetailsFormData>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: {
      email: user.email || "",
      name: user.name || "",
      first_name: user.first_name || "",
      middle_name: user.middle_name || "",
      last_name: user.last_name || "",
      username: user.username || "",
      language: user.language || "English",
      time_zone: user.time_zone || "Asia/Jakarta",
      is_active: user.is_active,
      // Employment
      employee_number: user.employee_number || "",
      department_id: user.department_id,
      position_id: user.position_id,
      join_date: user.join_date ? new Date(user.join_date) : null,
      probation_end_date: user.probation_end_date
        ? new Date(user.probation_end_date)
        : null,
      // Contact
      phone: user.phone || "",
      work_phone: user.profile?.mobile || "",
      address: user.profile?.location || "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = form;

  const isFormDirty = form.formState.isDirty;

  const onSubmit = useCallback(
    async (data: UserDetailsFormData) => {
      try {
        const payload: Record<string, unknown> = {
          email: data.email,
          name: data.name,
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          username: data.username,
          language: data.language,
          time_zone: data.time_zone,
          is_active: data.is_active,
          // Employment
          employee_number: data.employee_number,
          department_id: data.department_id,
          position_id: data.position_id,
          join_date: data.join_date,
          probation_end_date: data.probation_end_date,
          // Contact
          phone: data.phone,
          mobile: data.work_phone, // Map work_phone to mobile (profile field)
          location: data.address, // Map address to location (profile field)
        };

        await updateUser({
          id: userId,
          data: payload,
        });

        queryClient.invalidateQueries({ queryKey: ["user", userId] });
        queryClient.invalidateQueries({ queryKey: ["users"] });

        toast.success("User details updated successfully");
        reset(data); // Reset form with new data to clear isDirty state
        setEditMode({ employment: false, contact: false });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to update user";
        toast.error(message);
      }
    },
    [updateUser, userId, queryClient, reset]
  );

  // Sync isDirty with context
  useEffect(() => {
    setIsDirty(isFormDirty);
  }, [isFormDirty, setIsDirty]);

  // Register save handler
  useEffect(() => {
    registerSaveHandler(handleSubmit(onSubmit));
  }, [registerSaveHandler, handleSubmit, onSubmit]);

  const watchedDeptId = useWatch({
    control: form.control,
    name: "department_id",
  });

  const { data: positionsData } = usePositions(
    {
      per_page: 100,
      is_active: true,
      department_id: watchedDeptId ? Number(watchedDeptId) : undefined,
    },
    { enabled: editMode.employment && !!watchedDeptId }
  );

  const isActive = useWatch({
    control: form.control,
    name: "is_active",
  });

  const toggleEditMode = (section: "employment" | "contact") => {
    setEditMode((prev) => {
      const newState = { ...prev, [section]: !prev[section] };
      return newState;
    });
  };

  const handleCancel = (section: "employment" | "contact") => {
    if (section === "employment") {
      setValue("employee_number", user.employee_number || "");
      setValue("department_id", user.department_id);
      setValue("position_id", user.position_id);
      setValue("join_date", user.join_date ? new Date(user.join_date) : null);
      setValue(
        "probation_end_date",
        user.probation_end_date ? new Date(user.probation_end_date) : null
      );
    } else if (section === "contact") {
      setValue("phone", user.phone || "");
      setValue("work_phone", user.profile?.mobile || "");
      setValue("address", user.profile?.location || "");
    }
    toggleEditMode(section);
  };

  const canEditEmployment = isSuperAdmin() || hasPermission("users.edit");
  const canEditContact = isSuperAdmin() || hasPermission("users.edit");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-1 pb-4">
      <div className="space-y-6">
        {/* Basic Info */}
        <Card
          className="shadow-none rounded-md glass-card fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <CardHeader className="border-b px-6">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                Basic Info
              </CardTitle>
              {/* Enabled Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enabled"
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    setValue("is_active", checked as boolean, {
                      shouldDirty: true,
                    })
                  }
                />
                <Label htmlFor="enabled" className="font-medium cursor-pointer">
                  Enabled
                </Label>
                <span className="text-sm text-muted-foreground ml-2">
                  (Allow user to login and access the system)
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex justify-between gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" {...register("first_name")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <Input id="username" {...register("username")} />
                  {errors.username && (
                    <p className="text-sm text-destructive">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middle_name">Middle Name</Label>
                  <Input id="middle_name" {...register("middle_name")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" {...register("last_name")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    {...register("language")}
                    placeholder="English"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time_zone">Time Zone</Label>
                  <Input
                    id="time_zone"
                    {...register("time_zone")}
                    placeholder="Asia/Jakarta"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card
          className="shadow-none rounded-md glass-card fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <CardHeader className="border-b px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">
              Employment Details
            </CardTitle>
            {canEditEmployment && (
              <div className="flex items-center gap-2">
                {editMode.employment ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => {
                        // For inline edits like this, we might want to trigger specific logic
                        // But if we want global save to work, we should rely on form state.
                        // However, this seems to be a "toggle edit mode" section.
                        // If the user clicks check, it just persists the local state to form?
                        // Actually, looking at the code, it calls handleSubmit(onSubmit).
                        // This means it SAVES IMMEDIATELY.
                        // If we want "Global Save", we should change this to just close edit mode but keep form dirty?
                        // OR if the user intends for these sections to be instant-save.
                        // Given the request "Global Save button triggers form submission",
                        // we should probably keep this behavior BUT maybe valid to just "Accept changes" into the form state without saving?
                        // For now, let's leave this behavior as "Instant Save" for specific sections if triggered via these buttons,
                        // BUT ideally we want everything to be "Deferred Save".
                        // Let's modify this to just toggle mode if valid?
                        // Actually, 'handleSubmit' will trigger the submit.
                        // If we want to support global save, we should probably NOT save here.
                        // Depending on user intent. The user asked for "Global Save".
                        // So likely they want to make changes, then click ONE save button.
                        // So these check buttons should probably just 'soft confirm' (exit edit mode, keep values in form).
                        // But React Hook Form values persist even if we just hide the input.
                        // So we can just toggle edit mode.
                        // BUT, we need to validate.
                        // Let's stick to the prompt: header Save button triggers submission.
                        // So maybe we remove these individual save buttons or make them just validation triggers?
                        // For now, I will leave them as is (Instant Save) as a shortcut,
                        // BUT I will remove the bottom "Save Basic Info" button which was the main form submit trigger.
                        handleSubmit(onSubmit)();
                      }}
                      type="button"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleCancel("employment")}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    onClick={() => toggleEditMode("employment")}
                    type="button"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground uppercase text-xs font-semibold">
                  Employee ID
                </Label>
                <Input
                  {...register("employee_number")}
                  disabled={!editMode.employment}
                  className={!editMode.employment ? "bg-muted" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground uppercase text-xs font-semibold">
                  Department
                </Label>
                {editMode.employment ? (
                  <Controller
                    control={control}
                    name="department_id"
                    render={({ field }) => (
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          setValue("position_id", null);
                        }}
                        value={field.value?.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
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
                    )}
                  />
                ) : (
                  <Input
                    value={user.department?.name || "No Department"}
                    disabled
                    className="bg-muted"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground uppercase text-xs font-semibold">
                  Designation
                </Label>
                {editMode.employment ? (
                  <Controller
                    control={control}
                    name="position_id"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString()}
                        disabled={!watchedDeptId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Position" />
                        </SelectTrigger>
                        <SelectContent>
                          {positionsData?.data.map((pos) => (
                            <SelectItem key={pos.id} value={pos.id.toString()}>
                              {pos.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <Input
                    value={user.position?.name || "No Position"}
                    disabled
                    className="bg-muted"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground uppercase text-xs font-semibold">
                  Date of Joining
                </Label>
                {editMode.employment ? (
                  <Controller
                    control={control}
                    name="join_date"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value instanceof Date ? (
                              format(field.value, "PPP")
                            ) : field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value instanceof Date
                                ? field.value
                                : field.value
                                ? new Date(field.value)
                                : undefined
                            }
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                ) : (
                  <div className="relative">
                    <Input
                      value={
                        user.join_date
                          ? format(new Date(user.join_date), "dd/MM/yyyy")
                          : "Not set"
                      }
                      disabled
                      className="bg-muted pl-10"
                    />
                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Probation End Date */}
              <div className="space-y-2">
                <Label className="text-muted-foreground uppercase text-xs font-semibold">
                  Probation End Date
                </Label>
                {editMode.employment ? (
                  <Controller
                    control={control}
                    name="probation_end_date"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value instanceof Date ? (
                              format(field.value, "PPP")
                            ) : field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value instanceof Date
                                ? field.value
                                : field.value
                                ? new Date(field.value)
                                : undefined
                            }
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                ) : (
                  <div className="relative">
                    <Input
                      value={
                        user.probation_end_date
                          ? format(
                              new Date(user.probation_end_date),
                              "dd/MM/yyyy"
                            )
                          : "Not set"
                      }
                      disabled
                      className="bg-muted pl-10"
                    />
                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card
          className="shadow-none rounded-md glass-card fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          <CardHeader className="border-b px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">
              Contact Information
            </CardTitle>
            {canEditContact && (
              <div className="flex items-center gap-2">
                {editMode.contact ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={handleSubmit(onSubmit)}
                      type="button"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleCancel("contact")}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    onClick={() => toggleEditMode("contact")}
                    type="button"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="uppercase text-xs font-semibold">
                  Cell Phone
                </Label>
                <Input
                  {...register("phone")}
                  disabled={!editMode.contact}
                  placeholder="+1 (555) 123-4567"
                  className={!editMode.contact ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-xs font-semibold">
                  Work Phone
                </Label>
                <Input
                  {...register("work_phone")}
                  disabled={!editMode.contact}
                  placeholder="Add work phone"
                  className={!editMode.contact ? "bg-muted" : ""}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="uppercase text-xs font-semibold">
                  Current Address
                </Label>
                <Input
                  {...register("address")}
                  disabled={!editMode.contact}
                  placeholder="123 Tech Street, Silicon Valley"
                  className={!editMode.contact ? "bg-muted" : ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
