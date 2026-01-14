"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ArrowLeft,
  Filter,
  Mail,
  MailOpen,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkAsRead,
  useMarkAsUnread,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/lib/hooks/use-notifications";
import type { Notification } from "@/lib/api/services/notification.service";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data: notifications, isLoading } = useNotifications({
    page,
    per_page: perPage,
    filter,
  });
  const { data: unreadCount } = useUnreadNotificationCount();
  const markAsRead = useMarkAsRead();
  const markAsUnread = useMarkAsUnread();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const handleMarkAsRead = async (id: string) => {
    await markAsRead.mutateAsync(id);
  };

  const handleMarkAsUnread = async (id: string) => {
    await markAsUnread.mutateAsync(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification.mutateAsync(id);
  };

  const getNotificationIcon = (notification: Notification) => {
    const iconType = notification.data?.icon || "info";
    const iconClasses = "h-4 w-4";

    switch (iconType) {
      case "success":
        return <Check className={cn(iconClasses, "text-green-500")} />;
      case "warning":
        return <Bell className={cn(iconClasses, "text-yellow-500")} />;
      case "error":
        return <Bell className={cn(iconClasses, "text-red-500")} />;
      default:
        return <Bell className={cn(iconClasses, "text-blue-500")} />;
    }
  };

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Notifications
              </h1>
              {!!unreadCount && unreadCount > 0 && (
                <Badge variant="default">{unreadCount} unread</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Stay updated with your activities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
          >
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          {!!unreadCount && unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications?.data && notifications.data.length > 0 ? (
            <div className="divide-y">
              {notifications.data.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 flex items-start gap-4 transition-colors hover:bg-muted/50",
                    !notification.read_at && "bg-primary/5"
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      !notification.read_at ? "bg-primary/10" : "bg-muted"
                    )}
                  >
                    {getNotificationIcon(notification)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p
                          className={cn(
                            "font-medium",
                            !notification.read_at && "text-primary"
                          )}
                        >
                          {notification.data?.title || "Notification"}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.data?.message || ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {notification.read_at ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleMarkAsUnread(notification.id)}
                            title="Mark as unread"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <MailOpen className="h-4 w-4" />
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Notification?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(notification.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                {filter === "unread"
                  ? "You're all caught up!"
                  : "You don't have any notifications yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {notifications?.meta && notifications.meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {notifications.meta.from} to {notifications.meta.to} of{" "}
            {notifications.meta.total} notifications
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {notifications.meta.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= notifications.meta.last_page}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
