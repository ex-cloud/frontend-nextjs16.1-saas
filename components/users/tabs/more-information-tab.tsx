"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { LazyCalendar } from "@/lib/lazy-components";
import { User } from "@/types/user";
import { useUpdateUser } from "@/lib/hooks/use-users";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useUserPage } from "@/components/users/user-page-context";

interface MoreInformationTabProps {
  user: User;
  userId: string;
}

const moreInfoSchema = z.object({
  gender: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  birth_date: z.string().optional(),
  location: z.string().optional(),
  interests: z.string().optional(),
  bio: z.string().optional(),
  secondary_email: z.string().email().optional().or(z.literal("")),
  preferred_workspace: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

type MoreInfoFormData = z.infer<typeof moreInfoSchema>;

export function MoreInformationTab({ user, userId }: MoreInformationTabProps) {
  const queryClient = useQueryClient();
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    user.profile?.birth_date ? new Date(user.profile.birth_date) : undefined
  );

  const { mutateAsync: updateUser } = useUpdateUser({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Information updated successfully");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update information";
      toast.error(message);
    },
  });

  const form = useForm<MoreInfoFormData>({
    resolver: zodResolver(moreInfoSchema),
    defaultValues: {
      gender: user.profile?.gender || "",
      phone: user.phone || "",
      mobile: user.profile?.mobile || "",
      birth_date: user.profile?.birth_date || "",
      location: user.profile?.location || "",
      interests: user.profile?.interests || "",
      bio: user.profile?.bio || "",
      secondary_email: user.profile?.secondary_email || "",
      preferred_workspace: user.profile?.preferred_workspace || "",
      emergency_contact_name: user.profile?.emergency_contact_name || "",
      emergency_contact_phone: user.profile?.emergency_contact_phone || "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isDirty },
  } = form;

  const { setIsDirty, registerSaveHandler } = useUserPage();

  // Sync isDirty with context
  useEffect(() => {
    setIsDirty(isDirty);
  }, [isDirty, setIsDirty]);

  const onSubmit = useCallback(
    async (data: MoreInfoFormData) => {
      try {
        await updateUser({
          id: userId,
          data: {
            phone: data.phone,
            gender: data.gender,
            mobile: data.mobile,
            birth_date: data.birth_date,
            location: data.location,
            interests: data.interests,
            bio: data.bio,
            secondary_email: data.secondary_email,
            preferred_workspace: data.preferred_workspace,
            emergency_contact_name: data.emergency_contact_name,
            emergency_contact_phone: data.emergency_contact_phone,
          },
        });
        reset(data); // Reset form with new data to clear isDirty state
      } catch (error: unknown) {
        console.error("Update failed:", error);
      }
    },
    [updateUser, userId, reset]
  );

  // Register save handler
  useEffect(() => {
    registerSaveHandler(handleSubmit(onSubmit));
  }, [registerSaveHandler, handleSubmit, onSubmit]);

  const genderValue = useWatch({
    control: form.control,
    name: "gender",
  });

  useEffect(() => {
    if (birthDate) {
      setValue("birth_date", format(birthDate, "yyyy-MM-dd"), {
        shouldDirty: true,
      });
    }
  }, [birthDate, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="card shadow-none rounded-md glass-card fade-in-up">
        <CardHeader>
          <CardTitle className="text-base">Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Secondary Email */}
            <div className="space-y-2">
              <Label htmlFor="secondary_email">Secondary Email</Label>
              <Input
                id="secondary_email"
                {...register("secondary_email")}
                placeholder="backup@example.com"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+62"
                {...register("phone")}
              />
            </div>

            {/* Mobile No */}
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile No</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="+62"
                {...register("mobile")}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={genderValue}
                onValueChange={(value) =>
                  setValue("gender", value, { shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !birthDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {birthDate ? (
                      format(birthDate, "PPP")
                    ) : (
                      <span>Select date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <LazyCalendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    captionLayout="dropdown"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                    defaultMonth={birthDate || new Date()}
                    disabled={(date: Date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, Country"
                {...register("location")}
              />
            </div>

            {/* Preferred Workspace */}
            <div className="space-y-2">
              <Label htmlFor="preferred_workspace">Preferred Workspace</Label>
              <Input
                id="preferred_workspace"
                placeholder="e.g. Remote, Office Building A"
                {...register("preferred_workspace")}
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-4 text-muted-foreground">
              Emergency Contact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  {...register("emergency_contact_name")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  {...register("emergency_contact_phone")}
                />
              </div>
            </div>
          </div>

          {/* Interests & Bio */}
          <div className="grid grid-cols-1 gap-6 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="interests">Interests</Label>
              <Textarea
                id="interests"
                placeholder="Interests..."
                rows={2}
                {...register("interests")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                rows={4}
                {...register("bio")}
              />
            </div>
          </div>

          {/* Save Button */}
        </CardContent>
      </Card>
    </form>
  );
}
