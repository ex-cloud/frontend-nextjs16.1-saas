"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  User,
  Shield,
  Bell,
  Plug,
  Loader2,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AccountLayout } from "@/components/account/account-layout";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { DetailsTab } from "@/components/account/tabs/details-tab";
import { useProfile } from "@/lib/hooks/use-profile";

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");
  const { data: profile, isLoading } = useProfile();
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // This will be connected to the form's submit handler
    toast.success("Changes saved successfully");
    setIsDirty(false);
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full mt-4" />
        </div>
      </div>
    );
  }

  // Tab trigger styling matching User Management
  const tabTriggerClass =
    "data-[state=active]:bg-transparent flex-0 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-t-0 data-[state=active]:border-l-0 data-[state=active]:border-r-0 data-[state=active]:border-zinc-900 data-[state=active]:rounded-b-none px-0 py-1 text-muted-foreground data-[state=active]:text-foreground rounded-none";

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        {/* Header - Matching User Management style */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          {/* Left: Back button + Title + Status */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {profile?.name || "Account Settings"}
              </h1>
              <Badge variant={profile?.is_active ? "default" : "secondary"}>
                {profile?.is_active ? "Active" : "Inactive"}
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
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !isDirty}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Tabs with matching User Management styling */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <AccountLayout
            userId={profile?.id}
            sidebar={<AccountSidebar profile={profile} />}
            header={
              <TabsList className="h-auto p-0 bg-transparent gap-6 w-full justify-start rounded-none px-4 pt-2">
                <TabsTrigger value="details" className={tabTriggerClass}>
                  <User className="h-4 w-4 mr-2" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger value="security" className={tabTriggerClass}>
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Account Security</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className={tabTriggerClass}>
                  <Bell className="h-4 w-4 mr-2" />
                  <span>Notification Preferences</span>
                </TabsTrigger>
                <TabsTrigger value="apps" className={tabTriggerClass}>
                  <Plug className="h-4 w-4 mr-2" />
                  <span>Connected Apps</span>
                </TabsTrigger>
              </TabsList>
            }
          >
            <div className="mt-0">
              <TabsContent value="details" className="m-0 pt-0">
                <DetailsTab profile={profile} />
              </TabsContent>

              <TabsContent value="security" className="m-0 pt-0">
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>Account Security settings coming soon...</p>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="m-0 pt-0">
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>Notification Preferences coming soon...</p>
                </div>
              </TabsContent>

              <TabsContent value="apps" className="m-0 pt-0">
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>Connected Apps settings coming soon...</p>
                </div>
              </TabsContent>
            </div>
          </AccountLayout>
        </Tabs>
      </div>
    </div>
  );
}
