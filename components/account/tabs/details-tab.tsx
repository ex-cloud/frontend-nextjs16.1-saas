"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Pencil, Check, X } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useUpdateProfile } from "@/lib/hooks/use-profile";
import type { User } from "@/types/user";

interface DetailsTabProps {
  profile: User | undefined;
}

// Form Schema
const detailsSchema = z.object({
  // Personal Information
  name: z.string().min(1, "Full name is required"),
  first_name: z.string().optional(),
  middle_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  // Professional Bio
  bio: z.string().optional(),
  // Localization
  time_zone: z.string().optional(),
  language: z.string().optional(),
});

type DetailsFormData = z.infer<typeof detailsSchema>;

// Timezone options
const timezones = [
  { value: "Asia/Jakarta", label: "(GMT+07:00) Jakarta" },
  { value: "Asia/Singapore", label: "(GMT+08:00) Singapore" },
  { value: "America/Los_Angeles", label: "(GMT-08:00) Pacific Time" },
  { value: "America/New_York", label: "(GMT-05:00) Eastern Time" },
  { value: "Europe/London", label: "(GMT+00:00) London" },
  { value: "Europe/Paris", label: "(GMT+01:00) Paris" },
];

// Language options
const languages = [
  { value: "en", label: "English (US)" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "zh", label: "中文 (Chinese)" },
  { value: "ja", label: "日本語 (Japanese)" },
];

export function DetailsTab({ profile }: DetailsTabProps) {
  const [editMode, setEditMode] = useState<{
    personal: boolean;
    bio: boolean;
    localization: boolean;
  }>({
    personal: false,
    bio: false,
    localization: false,
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const updateProfile = useUpdateProfile();

  // Initialize skills from profile
  useEffect(() => {
    if (profile?.tags) {
      const userSkills = profile.tags
        .filter((tag) => tag.type === "skill")
        .map((tag) => tag.name);

      // Prevent unnecessary updates
      if (JSON.stringify(userSkills) !== JSON.stringify(skills)) {
        setSkills(userSkills);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.tags]); // Only re-run if tags change

  const form = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: profile?.name || "",
      first_name: profile?.first_name || "",
      middle_name: profile?.middle_name || "",
      last_name: profile?.last_name || "",
      username: profile?.username || "",
      email: profile?.email || "",
      phone: profile?.phone || profile?.profile?.mobile || "",
      bio: profile?.profile?.bio || "",
      time_zone: profile?.time_zone || "Asia/Jakarta",
      language: profile?.language || "en",
    },
  });

  const { register, control, handleSubmit, reset, setValue } = form;

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || "",
        first_name: profile.first_name || "",
        middle_name: profile.middle_name || "",
        last_name: profile.last_name || "",
        username: profile.username || "",
        email: profile.email || "",
        phone: profile.phone || profile.profile?.mobile || "",
        bio: profile.profile?.bio || "",
        time_zone: profile.time_zone || "Asia/Jakarta",
        language: profile.language || "en",
      });
    }
  }, [profile, reset]);

  const onSubmit = useCallback(
    async (data: DetailsFormData) => {
      // Merge skills into the payload
      const payload = { ...data, skills };
      await updateProfile.mutateAsync(payload);
      setEditMode({ personal: false, bio: false, localization: false });
      reset(data); // Reset form to clear isDirty state
    },
    [updateProfile, reset, skills]
  );

  const toggleEditMode = (
    e: React.MouseEvent,
    section: keyof typeof editMode
  ) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation();
    setEditMode((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCancel = (
    e: React.MouseEvent,
    section: keyof typeof editMode
  ) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation();
    // Reset form values for the section
    if (profile) {
      if (section === "personal") {
        setValue("name", profile.name || "");
        setValue("username", profile.username || "");
        setValue("email", profile.email || "");
        setValue("phone", profile.phone || profile.profile?.mobile || "");
      } else if (section === "bio") {
        setValue("bio", profile.profile?.bio || "");
      } else if (section === "localization") {
        setValue("time_zone", profile.time_zone || "Asia/Jakarta");
        setValue("language", profile.language || "en");
      }
    }
    setEditMode((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddSkill = async () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updatedSkills = [...skills, newSkill.trim()];
      setSkills(updatedSkills);
      setNewSkill("");

      // Auto-save skills
      const currentValues = form.getValues();
      await updateProfile.mutateAsync({
        ...currentValues,
        skills: updatedSkills,
      });
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const updatedSkills = skills.filter((s) => s !== skillToRemove);
    setSkills(updatedSkills);

    // Auto-save skills
    const currentValues = form.getValues();
    await updateProfile.mutateAsync({
      ...currentValues,
      skills: updatedSkills,
    });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-1 pb-4">
          {/* Basic Info */}
          <Card className="shadow-none rounded-md">
            <CardHeader className="border-b px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Basic Info
              </CardTitle>
              <div className="flex items-center gap-2">
                {editMode.personal ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      type="submit"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleCancel(e, "personal")}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <button
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    onClick={(e) => toggleEditMode(e, "personal")}
                    type="button"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        EMAIL <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-muted/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        USERNAME <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!editMode.personal} // Allow editing username? Usually restricted. User said "Email, username..." in list. Assuming editable for now or read-only? Let's keep editable but maybe user wants it read-only? I'll allow edit for now as per schema.
                          className={
                            !editMode.personal
                              ? "border-transparent px-0 shadow-none"
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        FULL NAME <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!editMode.personal}
                          className={
                            !editMode.personal
                              ? "border-transparent px-0 shadow-none"
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FIRST NAME</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!editMode.personal}
                          className={
                            !editMode.personal
                              ? "border-transparent px-0 shadow-none"
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="middle_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MIDDLE NAME</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!editMode.personal}
                          className={
                            !editMode.personal
                              ? "border-transparent px-0 shadow-none"
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LAST NAME</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!editMode.personal}
                          className={
                            !editMode.personal
                              ? "border-transparent px-0 shadow-none"
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Employment Details (Read-only) */}
          <Card className="shadow-none rounded-md">
            <CardHeader className="border-b px-6">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Employee ID
                  </Label>
                  <Input
                    value={profile?.employee_number || "N/A"}
                    disabled
                    className="bg-muted border-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Department
                  </Label>
                  <Input
                    value={profile?.department?.name || "No Department"}
                    disabled
                    className="bg-muted border-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Designation
                  </Label>
                  <Input
                    value={
                      profile?.position?.name ||
                      profile?.roles?.[0]?.name ||
                      "N/A"
                    }
                    disabled
                    className="bg-muted border-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Date of Joining
                  </Label>
                  <div className="relative">
                    <Input
                      value={
                        profile?.join_date
                          ? format(new Date(profile.join_date), "dd/MM/yyyy")
                          : "Not set"
                      }
                      disabled
                      className="bg-muted border-0 pl-10"
                    />
                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Bio */}
          <Card className="shadow-none rounded-md">
            <CardHeader className="border-b px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Professional Bio
              </CardTitle>
              <div className="flex items-center gap-2">
                {editMode.bio ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      type="submit"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleCancel(e, "bio")}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <button
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    onClick={(e) => toggleEditMode(e, "bio")}
                    type="button"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-6 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Short Summary
                </Label>
                <Textarea
                  {...register("bio")}
                  disabled={!editMode.bio}
                  placeholder="Write a brief professional summary..."
                  className={cn(
                    "min-h-[100px] resize-none",
                    !editMode.bio && "bg-muted border-0"
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills & Expertise */}
          <Card className="shadow-none rounded-md">
            <CardHeader className="border-b px-6">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Skills & Expertise
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-4">
              <div className="space-y-4">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Technical & Soft Skills
                </Label>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="px-3 py-1 flex items-center gap-1"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Type and press enter..."
                      className="h-8 w-40 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Separate skills with commas or press enter after each skill.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Localization */}
          <Card className="shadow-none rounded-md">
            <CardHeader className="border-b px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Localization
              </CardTitle>
              <div className="flex items-center gap-2">
                {editMode.localization ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      type="submit"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleCancel(e, "localization")}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <button
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    onClick={(e) => toggleEditMode(e, "localization")}
                    type="button"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={control}
                  name="time_zone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TIME ZONE</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!editMode.localization}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={
                              !editMode.localization
                                ? "border-transparent px-0 shadow-none"
                                : ""
                            }
                          >
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timezones.map((timezone) => (
                            <SelectItem
                              key={timezone.value}
                              value={timezone.value}
                            >
                              {timezone.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PREFERRED LANGUAGE</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!editMode.localization}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={
                              !editMode.localization
                                ? "border-transparent px-0 shadow-none"
                                : ""
                            }
                          >
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {languages.map((language) => (
                            <SelectItem
                              key={language.value}
                              value={language.value}
                            >
                              {language.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </>
  );
}
