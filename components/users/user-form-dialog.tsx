"use client";

import { useEffect } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  createUserSchema,
  updateUserSchema,
} from "@/lib/validations/user.schema";
import type { User } from "@/types/user";
import type {
  CreateUserFormData,
  UpdateUserFormData,
} from "@/lib/validations/user.schema";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
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
import { format } from "date-fns";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserFormData | UpdateUserFormData) => Promise<void>;
  user?: User | null;
  isLoading?: boolean;
}

const availableRoles = [
  { id: "1", name: "Super Admin", value: "Super Admin" },
  { id: "2", name: "Admin", value: "Admin" },
  { id: "3", name: "Manager", value: "Manager" },
  { id: "4", name: "User", value: "User" },
];

// Generic form data type
type UserFormData = {
  username: string;
  name: string;
  email: string;
  roles: string[];
  is_active: boolean;
  phone?: string;
  password?: string;
  password_confirmation?: string;
  avatar?: File | string | null;
  avatar_removed?: boolean;
  department_id?: string | number | null;
  position_id?: string | number | null;
  employee_number?: string | null;
  join_date?: string | Date | null;
  probation_end_date?: string | Date | null;
  direct_manager_id?: string | number | null;
};

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  user,
  isLoading = false,
}: UserFormDialogProps) {
  const isEditMode = !!user;

  // Use a unified form type
  const form = useForm<UserFormData>({
    resolver: zodResolver(
      isEditMode ? updateUserSchema : createUserSchema
    ) as unknown as Resolver<UserFormData>,
    defaultValues: {
      username: user?.username || "",
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      password: "",
      password_confirmation: "",
      roles: user?.roles?.map((r: { name: string }) => r.name) || [],
      is_active: user?.is_active ?? true,
      avatar: null,
      avatar_removed: false,
      // HRM Defaults
      department_id: user?.department_id || null,
      position_id: user?.position_id || null,
      employee_number: user?.employee_number || "",
      join_date: user?.join_date ? new Date(user.join_date) : null,
      probation_end_date: user?.probation_end_date
        ? new Date(user.probation_end_date)
        : null,
      direct_manager_id: user?.direct_manager_id || null,
    },
  });

  // HRM Data Fetching
  const { data: departmentsData } = useDepartments(
    {
      per_page: 100,
      is_active: true,
    },
    {
      enabled: open, // Only fetch when dialog is open
    }
  );

  // Watch department_id to filter positions
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
    {
      // Only fetch when dialog is open AND (a department is selected OR we want to allow all positions if logic changes)
      // Based on UI logic `disabled={!watchedDeptId}`, we only need positions when dept is selected.
      enabled: open && !!watchedDeptId,
    }
  );

  const { reset, setValue } = form;

  // Reset form when dialog opens or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        console.log("=== EDIT MODE: Pre-populating form ===");
        const formData = {
          username: user.username || "",
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          password: "",
          password_confirmation: "",
          roles: user.roles?.map((r: { name: string }) => r.name) || [],
          is_active: user.is_active ?? true,
          avatar: user.avatar_url || null, // Use URL directly
          avatar_removed: false,
          department_id: user.department_id || null, // Convert to string for Select? Zod handles number/string union now.
          position_id: user.position_id || null,
          employee_number: user.employee_number || "",
          join_date: user.join_date ? new Date(user.join_date) : null,
          probation_end_date: user.probation_end_date
            ? new Date(user.probation_end_date)
            : null,
          direct_manager_id: user.direct_manager_id || null,
        };

        console.log("Form reset with data:", formData);
        reset(formData);
      } else {
        console.log("=== CREATE MODE: Resetting form ===");
        reset({
          username: "",
          name: "",
          email: "",
          phone: "",
          password: "",
          password_confirmation: "",
          roles: [],
          is_active: true,
          avatar: null,
          avatar_removed: false,
          department_id: null,
          position_id: null,
          employee_number: "",
          join_date: null,
          probation_end_date: null,
          direct_manager_id: null,
        });
      }
    }
  }, [open, user, reset]);

  const handleSubmit = async (data: UserFormData) => {
    // Map avatar_removed to avatarRemoved for the parent component
    const submitData = {
      ...data,
      avatarRemoved: data.avatar_removed,
    };

    console.log("UserFormDialog handleSubmit:", {
      originalData: data,
      submitData,
    });

    await onSubmit(submitData as CreateUserFormData | UpdateUserFormData);
    form.reset();
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl">
            {isEditMode ? "Edit User" : "Create New User"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update user information, roles, and settings"
              : "Add a new user to the system with their profile details"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col h-full"
          >
            <Tabs defaultValue="basic" className="flex-1 px-6">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="organization">Organization</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="roles">Roles & Avatar</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent
                value="basic"
                className="space-y-6 overflow-y-auto max-h-[50vh] pr-2"
              >
                {/* ... existing fields ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Username *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="johndoe"
                            {...field}
                            disabled={isLoading}
                            className="h-11"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Letters, numbers, underscore, and hyphen only
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Full Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            {...field}
                            disabled={isLoading}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm font-medium">
                          Email Address *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john.doe@example.com"
                            {...field}
                            disabled={isLoading}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm font-medium">
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 (234) 567-8900"
                            {...field}
                            disabled={isLoading}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Active Status */}
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">
                              Active Status
                            </FormLabel>
                            <FormDescription className="text-xs">
                              When enabled, user can login and access the system
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isLoading}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Organization Tab */}
              <TabsContent
                value="organization"
                className="space-y-6 overflow-y-auto max-h-[50vh] pr-2"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Department */}
                  <FormField
                    control={form.control}
                    name="department_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value)}
                          value={field.value?.toString() || ""}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Position */}
                  <FormField
                    control={form.control}
                    name="position_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value)}
                          value={field.value?.toString() || ""}
                          disabled={isLoading || !watchedDeptId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  watchedDeptId
                                    ? "Select position"
                                    : "Select department first"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {positionsData?.data.map((pos) => (
                              <SelectItem
                                key={pos.id}
                                value={pos.id.toString()}
                              >
                                {pos.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Employee Number - Only show in Edit Mode */}
                  {isEditMode && (
                    <FormField
                      control={form.control}
                      name="employee_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="EMP-001"
                              {...field}
                              value={field.value || ""}
                              disabled={isLoading}
                              readOnly
                              className="bg-muted"
                            />
                          </FormControl>
                          <FormDescription>
                            Auto-generated system ID
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Spacer removed to fix layout alignment */}

                  {/* Join Date */}
                  <FormField
                    control={form.control}
                    name="join_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Join Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(
                                    field.value instanceof Date
                                      ? field.value
                                      : new Date(field.value),
                                    "PPP"
                                  )
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
                                field.value instanceof Date
                                  ? field.value
                                  : field.value
                                  ? new Date(field.value)
                                  : undefined
                              }
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Probation End Date */}
                  <FormField
                    control={form.control}
                    name="probation_end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Probation End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(
                                    field.value instanceof Date
                                      ? field.value
                                      : new Date(field.value),
                                    "PPP"
                                  )
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent
                value="security"
                className="space-y-6 overflow-y-auto max-h-[50vh] pr-2"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Password{" "}
                          {isEditMode && (
                            <span className="text-muted-foreground font-normal">
                              (optional)
                            </span>
                          )}
                          {!isEditMode && " *"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            disabled={isLoading}
                            className="h-11"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Min 8 characters with uppercase, lowercase, number &
                          special character
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password Confirmation */}
                  <FormField
                    control={form.control}
                    name="password_confirmation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Confirm Password {!isEditMode && " *"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            disabled={isLoading}
                            className="h-11"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Re-enter the password to confirm
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {isEditMode && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/10 dark:border-amber-900 p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> Leave password fields blank to keep
                      the current password unchanged.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Roles & Avatar Tab */}
              <TabsContent
                value="roles"
                className="space-y-6 overflow-y-auto max-h-[50vh] pr-2"
              >
                {/* Avatar Upload */}
                <div className="space-y-3">
                  <div>
                    <FormLabel className="text-base font-medium">
                      Profile Picture
                    </FormLabel>
                    <FormDescription className="text-xs mt-1">
                      Upload a profile picture (max 2MB, JPEG/PNG/GIF)
                    </FormDescription>
                  </div>
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <AvatarUpload
                            value={field.value}
                            onChange={(file) => {
                              console.log("AvatarUpload onChange file:", file);
                              field.onChange(file);
                              setValue("avatar_removed", false);
                            }}
                            onRemove={() => {
                              console.log("AvatarUpload onRemove");
                              field.onChange(null);
                              setValue("avatar_removed", true);
                            }}
                            maxSize={2 * 1024 * 1024}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Roles */}
                <FormField
                  control={form.control}
                  name="roles"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base font-medium">
                          User Roles *
                        </FormLabel>
                        <FormDescription className="text-xs mt-1">
                          Select one or more roles to assign permissions
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2">
                        {availableRoles.map((role) => (
                          <FormField
                            key={role.id}
                            control={form.control}
                            name="roles"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={role.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(
                                        role.value
                                      )}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        return checked
                                          ? field.onChange([
                                              ...currentValue,
                                              role.value,
                                            ])
                                          : field.onChange(
                                              currentValue.filter(
                                                (value) => value !== role.value
                                              )
                                            );
                                      }}
                                      disabled={isLoading}
                                      className="mt-0.5"
                                    />
                                  </FormControl>
                                  <FormLabel className="font-medium cursor-pointer flex-1">
                                    {role.name}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <Separator className="mt-6" />

            <DialogFooter className="px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="h-11 px-8"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="h-11 px-8">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Update User" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
