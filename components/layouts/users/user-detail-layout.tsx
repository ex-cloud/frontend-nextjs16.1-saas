"use client";

import { DetailLayout } from "@/components/layouts/detail-layout";
import { UserDetailsSidebar } from "@/components/users/tabs/details/sidebar";
import { UserSidebar as MoreInfoSidebar } from "@/components/users/tabs/more/sidebar";
import { GlobalFooter } from "@/components/global/global-footer";
import { NotesSection } from "@/components/users/tabs/more/notes-section";
import { AttachmentsSection } from "@/components/users/tabs/more/attachments-section";
import { ActivityHistory } from "@/components/users/tabs/more/activity-history";
import { User } from "@/types/user";
import { MessageSquare, Paperclip, History } from "lucide-react";

interface UserDetailLayoutProps {
  user: User;
  activeTab: string;
  header?: React.ReactNode;
  children: React.ReactNode;
}

export function UserDetailLayout({
  user,
  activeTab,
  header,
  children,
}: UserDetailLayoutProps) {
  // Determine Sidebar based on active tab
  const getSidebar = () => {
    switch (activeTab) {
      case "details":
        return <UserDetailsSidebar user={user} userId={user.id} />;
      case "info":
        return <MoreInfoSidebar user={user} />;
      // Add other cases as needed, or default sidebar
      default:
        // Or return null if no sidebar for roles/permissions yet?
        // User requested "shortcut quick actions" for other tabs specifically.
        // We can reuse MoreInfoSidebar (which has Quick Actions) or a simplified one.
        // For now, let's use MoreInfoSidebar as fallback/common sidebar as it has quick actions.
        return <MoreInfoSidebar user={user} />;
    }
  };

  // Global Footer Sections
  const footerSections = [
    {
      id: "notes",
      title: "Notes & Comments",
      icon: MessageSquare,
      content: <NotesSection userId={user.id} allowClear={true} />,
    },
    {
      id: "attachments",
      title: "Attachments",
      icon: Paperclip,
      content: <AttachmentsSection userId={user.id} />,
    },
    {
      id: "activity",
      title: "Activity History",
      icon: History,
      content: <ActivityHistory userId={user.id} />,
    },
  ];

  return (
    <DetailLayout
      header={header}
      sidebar={getSidebar()}
      footer={<GlobalFooter sections={footerSections} />}
    >
      {children}
    </DetailLayout>
  );
}
