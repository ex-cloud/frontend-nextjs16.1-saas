"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  Shield,
  Activity,
  FileText,
  Settings,
  HelpCircle,
  Key,
  Building,
  Briefcase,
  Users as UsersGroup,
} from "lucide-react";
import { useSession } from "next-auth/react";
import NextImage from "next/image";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const userRoles = session?.user?.roles || [];

  const hasRole = (roles: string[]) => {
    if (roles.includes("*")) return true;
    return userRoles.some((role) => roles.includes(role));
  };

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      roles: ["*"],
    },
  ].filter((item) => hasRole(item.roles));

  // User Management Section
  const userManagement = [
    {
      title: "User Management",
      url: "#",
      icon: Users,
      roles: ["Super Admin", "Admin"],
      items: [
        {
          title: "Users",
          url: "/dashboard/users",
          icon: Users,
        },
        {
          title: "Roles",
          url: "/dashboard/roles",
          icon: Shield,
        },
        {
          title: "Permissions",
          url: "/dashboard/permissions",
          icon: Key,
        },
      ],
    },
  ].filter((item) => hasRole(item.roles));

  // HRM Section
  const hrmSection = [
    {
      title: "HRM",
      url: "#",
      icon: UsersGroup,
      roles: ["Super Admin", "Admin", "HR Manager"],
      items: [
        {
          title: "Departments",
          url: "/dashboard/hrm/departments",
          icon: Building,
        },
        {
          title: "Positions",
          url: "/dashboard/hrm/positions",
          icon: Briefcase,
        },
        {
          title: "Teams",
          url: "/dashboard/hrm/teams",
          icon: UsersGroup,
        },
      ],
    },
  ].filter((item) => hasRole(item.roles));

  // Content & Other
  const contentSection = [
    {
      title: "Content",
      url: "/dashboard/content",
      icon: FileText,
      roles: ["*"],
    },
    {
      title: "Activity Logs",
      url: "/dashboard/activity",
      icon: Activity,
      roles: ["Super Admin", "Admin"],
    },
  ].filter((item) => hasRole(item.roles));

  const navSecondary = [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
    {
      title: "Help Center",
      url: "/help",
      icon: HelpCircle,
    },
  ];

  // Combine all navigation sections
  const allNavItems = [
    ...navMain,
    ...userManagement,
    ...hrmSection,
    ...contentSection,
  ];

  const userData = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "user@example.com",
    avatar: session?.user?.image || "/assets/213213.png",
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5!"
              >
                <a href="/dashboard">
                  <NextImage
                    src="/assets/213213.png"
                    alt="Logo"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  <span className="text-base font-semibold">Admin Panel</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={userData} />
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard">
                <NextImage
                  src="/assets/213213.png"
                  alt="Logo"
                  width={20}
                  height={20}
                  className="object-contain"
                />
                <span className="text-base font-semibold">Admin Panel</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={allNavItems} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
