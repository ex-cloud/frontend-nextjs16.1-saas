"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  User,
  Shield,
  Clock,
  Calendar,
  Check,
  X,
  Activity,
} from "lucide-react";
import {
  useUser,
  useUserPermissions,
  useUserActivities,
} from "@/lib/hooks/use-users";
import { formatDistanceToNow, format, isValid } from "date-fns";
import type { ActivityLog } from "@/types/user";

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

export function UserDetailDialog({
  open,
  onOpenChange,
  userId,
}: UserDetailDialogProps) {
  const [activeTab, setActiveTab] = useState("info");
  const { data: user, isLoading } = useUser(userId!, {
    enabled: !!userId && open,
  });
  const { data: permissions, isLoading: permissionsLoading } =
    useUserPermissions(userId!, {
      enabled: !!userId && open && activeTab === "permissions",
    });
  const { data: activitiesData, isLoading: activitiesLoading } =
    useUserActivities(userId!, 1, 20, {
      enabled: !!userId && open && activeTab === "activities",
    });

  if (!userId) return null;

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isValid(date) ? format(date, "PPP p") : "Invalid Date";
  };

  const formatRelative = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Complete information about this user
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : user ? (
              <>
                {/* User Header */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                    <AvatarFallback className="text-xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-2xl font-semibold">{user.name}</h3>
                      <p className="text-muted-foreground">@{user.username}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={user.is_active ? "default" : "destructive"}
                      >
                        {user.is_active ? (
                          <>
                            <Check className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <X className="mr-1 h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </Badge>
                      {user.email_verified_at && (
                        <Badge variant="secondary">
                          <Mail className="mr-1 h-3 w-3" />
                          Email Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tabs for different sections */}
                <Tabs
                  defaultValue="info"
                  value={activeTab}
                  onValueChange={setActiveTab}
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="info" className="flex-1">
                      <User className="mr-2 h-4 w-4" />
                      Information
                    </TabsTrigger>
                    <TabsTrigger value="permissions" className="flex-1">
                      <Shield className="mr-2 h-4 w-4" />
                      Permissions
                    </TabsTrigger>
                    <TabsTrigger value="activities" className="flex-1">
                      <Activity className="mr-2 h-4 w-4" />
                      Activities
                    </TabsTrigger>
                  </TabsList>

                  {/* Info Tab */}
                  <div className="border rounded-lg bg-card shadow-sm">
                    <TabsContent value="info" className="space-y-4">
                      {/* Basic Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Basic Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Email
                              </p>
                              <p className="text-sm">{user.email}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Username
                              </p>
                              <p className="text-sm">@{user.username}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Full Name
                              </p>
                              <p className="text-sm">{user.name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Status
                              </p>
                              <p className="text-sm">
                                {user.is_active ? "Active" : "Inactive"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Roles */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Roles
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <Badge key={role.id} variant="outline">
                                  {role.name}
                                </Badge>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No roles assigned
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Activity Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Activity Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Created At
                              </p>
                              <p className="text-sm mt-1">
                                {formatDate(user.created_at)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatRelative(user.created_at)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Updated At
                              </p>
                              <p className="text-sm mt-1">
                                {formatDate(user.updated_at)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatRelative(user.updated_at)}
                              </p>
                            </div>
                            {user.last_login_at && (
                              <div className="col-span-2">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Last Login
                                </p>
                                <p className="text-sm mt-1">
                                  {formatDate(user.last_login_at)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatRelative(user.last_login_at)}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Permissions Tab */}
                    <TabsContent value="permissions">
                      <Card>
                        <CardHeader>
                          <CardTitle>All Permissions</CardTitle>
                          <CardDescription>
                            Permissions inherited from assigned roles
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {permissionsLoading ? (
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                            </div>
                          ) : permissions && permissions.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {permissions.map((permission, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 text-sm rounded-md border px-3 py-2"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                  <span>{permission.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No permissions assigned
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Activities Tab */}
                    <TabsContent value="activities">
                      <Card>
                        <CardHeader>
                          <CardTitle>Activity History</CardTitle>
                          <CardDescription>
                            Recent actions performed by or on this user
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {activitiesLoading ? (
                            <div className="space-y-2">
                              <Skeleton className="h-16 w-full" />
                              <Skeleton className="h-16 w-full" />
                              <Skeleton className="h-16 w-full" />
                            </div>
                          ) : activitiesData?.data &&
                            activitiesData.data.length > 0 ? (
                            <div className="space-y-3">
                              {activitiesData.data.map(
                                (activity: ActivityLog) => (
                                  <div
                                    key={activity.id}
                                    className="flex items-start gap-3 rounded-md border p-3"
                                  >
                                    <div className="rounded-full bg-primary/10 p-2">
                                      <Activity className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <p className="text-sm font-medium">
                                        {activity.description}
                                      </p>
                                      {activity.causer && (
                                        <p className="text-xs text-muted-foreground">
                                          by {activity.causer.name}
                                        </p>
                                      )}
                                      <p className="text-xs text-muted-foreground">
                                        {formatRelative(activity.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              No activities found
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </div>
                </Tabs>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                User not found
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
