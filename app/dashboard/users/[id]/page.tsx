"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  MoreHorizontal,
  Key,
  Mail,
  Printer,
  Shield,
  User,
  Users,
  Info,
  Settings,
  Plug,
  Loader2,
} from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { UserDetailsTab } from "@/components/users/tabs/user-details-tab";
import { RolesPermissionsTab } from "@/components/users/tabs/roles-permissions-tab";
import { MoreInformationTab } from "@/components/users/tabs/more-information-tab";
import { SettingsTab } from "@/components/users/tabs/settings-tab";
import { ConnectionsTab } from "@/components/users/tabs/connections-tab";
import { useUser } from "@/lib/hooks/use-users";
import { Skeleton } from "@/components/ui/skeleton";
import { UserDetailLayout } from "@/components/layouts/users/user-detail-layout";
import {
  UserPageProvider,
  useUserPage,
} from "@/components/users/user-page-context";

export default function UserDetailPage() {
  return (
    <UserPageProvider>
      <UserDetailPageContent />
    </UserPageProvider>
  );
}

const LoadingSkeleton = () => (
  <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
    <div className="px-4 lg:px-6">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-96 w-full mt-4" />
    </div>
  </div>
);

function UserDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [activeTab, setActiveTab] = useState("details");
  const { isDirty, triggerSave, isSaving } = useUserPage();

  const { data: user, isLoading } = useUser(userId);

  if (isLoading) {
    return (
      <ProtectedRoute requireAuth>
        <LoadingSkeleton />
      </ProtectedRoute>
    );
  }

  if (!user) {
    return (
      <ProtectedRoute requireAuth>
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">User not found</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            {/* Left: Back button + User name + Status */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard/users")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {user.name || user.username}
                </h1>
                <Badge variant={user.is_active ? "default" : "secondary"}>
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
                {isDirty && (
                  <Badge variant="destructive" className="animate-pulse">
                    Unsaved Changes
                  </Badge>
                )}
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Permissions
              </Button>
              <Button variant="outline" size="sm">
                <Key className="h-4 w-4 mr-2" />
                Password
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Create User Email
              </Button>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <User className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={triggerSave}
                disabled={isSaving || !isDirty}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>

          {/* User Detail Global Layout */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <UserDetailLayout
              user={user}
              activeTab={activeTab}
              header={
                <TabsList className="h-auto p-0 bg-transparent gap-6 w-full justify-start rounded-none px-4 pt-2">
                  <TabsTrigger
                    value="details"
                    className="data-[state=active]:bg-transparent flex-0 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0 data-[state=active]:border-zinc-900 data-[state=active]:rounded-b-none px-0 py-1 text-muted-foreground data-[state=active]:text-foreground rounded-none"
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span>User Details</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="roles"
                    className="data-[state=active]:bg-transparent flex-0 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0 data-[state=active]:border-zinc-900 data-[state=active]:rounded-b-none px-0 py-1 text-muted-foreground data-[state=active]:text-foreground rounded-none"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    <span>Roles & Permissions</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="info"
                    className="data-[state=active]:bg-transparent flex-0 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0 data-[state=active]:border-zinc-900 data-[state=active]:rounded-b-none px-0 py-1 text-muted-foreground data-[state=active]:text-foreground rounded-none"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    <span>More Information</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="data-[state=active]:bg-transparent flex-0 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0 data-[state=active]:border-zinc-900 data-[state=active]:rounded-b-none px-0 py-1 text-muted-foreground data-[state=active]:text-foreground rounded-none"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Settings</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="connections"
                    className="data-[state=active]:bg-transparent flex-0 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0 data-[state=active]:border-zinc-900 data-[state=active]:rounded-b-none px-0 py-1 text-muted-foreground data-[state=active]:text-foreground rounded-none"
                  >
                    <Plug className="h-4 w-4 mr-2" />
                    <span>Connections</span>
                  </TabsTrigger>
                </TabsList>
              }
            >
              <div className="mt-0">
                <TabsContent value="details" className="m-0 pt-0">
                  <UserDetailsTab user={user} userId={userId} />
                </TabsContent>

                <TabsContent value="roles" className="m-0 pt-0">
                  <RolesPermissionsTab userId={userId} />
                </TabsContent>

                <TabsContent value="info" className="m-0 pt-0">
                  <MoreInformationTab user={user} userId={userId} />
                </TabsContent>

                <TabsContent value="settings" className="m-0 pt-0">
                  <SettingsTab userId={userId} />
                </TabsContent>

                <TabsContent value="connections" className="m-0 pt-0">
                  <ConnectionsTab userId={userId} />
                </TabsContent>
              </div>
            </UserDetailLayout>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
