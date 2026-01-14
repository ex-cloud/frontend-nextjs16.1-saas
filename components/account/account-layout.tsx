"use client";

import { DetailLayout } from "@/components/layouts/detail-layout";
import { GlobalFooter } from "@/components/global/global-footer";
import { NotesSection } from "@/components/users/tabs/more/notes-section";
import { AttachmentsSection } from "@/components/users/tabs/more/attachments-section";
import { ActivityHistory } from "@/components/users/tabs/more/activity-history";
import { MessageSquare, Paperclip, History } from "lucide-react";
import { ReactNode } from "react";

interface AccountLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  userId?: string;
}

export function AccountLayout({
  children,
  sidebar,
  header,
  userId,
}: AccountLayoutProps) {
  // Footer sections matching User Management
  const footerSections = [
    {
      id: "notes",
      title: "Notes & Comments",
      icon: MessageSquare,
      content: userId ? (
        <NotesSection userId={userId} />
      ) : (
        <div className="p-4 text-center text-muted-foreground">Loading...</div>
      ),
    },
    {
      id: "attachments",
      title: "Attachments",
      icon: Paperclip,
      content: userId ? (
        <AttachmentsSection userId={userId} />
      ) : (
        <div className="p-4 text-center text-muted-foreground">Loading...</div>
      ),
    },
    {
      id: "activity",
      title: "Activity History",
      icon: History,
      content: userId ? (
        <ActivityHistory userId={userId} />
      ) : (
        <div className="p-4 text-center text-muted-foreground">Loading...</div>
      ),
    },
  ];

  return (
    <DetailLayout
      header={header}
      sidebar={sidebar}
      footer={<GlobalFooter sections={footerSections} />}
    >
      {children}
    </DetailLayout>
  );
}
