"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import React from "react";
import Echo from "laravel-echo";

import { createEcho } from "@/lib/echo";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkAsRead,
  notificationKeys,
} from "@/lib/hooks/use-notifications";
import { useQueryClient } from "@tanstack/react-query";

export function NotificationBell() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: unreadCount } = useUnreadNotificationCount();
  const { data: notifications } = useNotifications({ per_page: 5 });
  const markAsRead = useMarkAsRead();

  // Real-time synchronization
  React.useEffect(() => {
    if (!session?.user?.id) return;

    let echoInstance: Echo<"pusher"> | null = null;
    const channelName = `App.Models.User.${session.user.id}`;

    const setupRealtime = async () => {
      let active = true;
      const echo = await createEcho();
      if (!echo || !active) return;
      echoInstance = echo;

      const channel = echo.private(channelName);

      interface NotificationPayload {
        title?: string;
        message?: string;
        action_url?: string;
        icon?: string;
      }

      const handleNotification = (notification: NotificationPayload) => {
        if (!active) return;
        console.log(
          "[NotificationBell] New notification received:",
          notification,
        );

        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: notificationKeys.all });

        // Trigger custom event for other components to refresh
        window.dispatchEvent(new CustomEvent("app:refresh-kanban"));

        // Show toast
        const actionUrl = notification.action_url;
        toast.info(notification.title || "New Notification", {
          description: notification.message || "",
          action: actionUrl
            ? {
                label: "View",
                onClick: () => {
                  if (actionUrl) router.push(actionUrl);
                },
              }
            : undefined,
        });
      };

      // Laravel broadcasts specific internal events for notifications
      channel.notification(handleNotification);

      return () => {
        active = false;
      };
    };

    const cleanup = setupRealtime();

    return () => {
      if (echoInstance) {
        echoInstance.leave(channelName);
      }
      cleanup.then((fn) => fn && fn());
    };
  }, [session?.user?.id, queryClient, router]);

  const handleNotificationClick = async (id: string, actionUrl?: string) => {
    await markAsRead.mutateAsync(id);
    if (actionUrl) {
      router.push(actionUrl);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {!!unreadCount && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {!!unreadCount && unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} new</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-72">
          {notifications?.data && notifications.data.length > 0 ? (
            <div className="space-y-1 p-1">
              {notifications.data.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 cursor-pointer",
                    !notification.read_at && "bg-primary/5",
                  )}
                  onClick={() =>
                    handleNotificationClick(
                      notification.id,
                      notification.data?.action_url,
                    )
                  }
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <span
                      className={cn(
                        "font-medium text-sm",
                        !notification.read_at && "text-primary",
                      )}
                    >
                      {notification.data?.title || "Notification"}
                    </span>
                    {!notification.read_at && (
                      <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {notification.data?.message || ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center">
          <Link
            href="/dashboard/notifications"
            className="w-full text-center text-sm"
          >
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
