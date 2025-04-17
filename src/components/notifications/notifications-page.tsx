"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import NotificationList from "@/components/notifications/notification-list";
import { mockNotifications } from "@/lib/data/mock-data";
import { useSidebar } from "@/components/ui/sidebar";
import { useMobile } from "@/hooks/use-mobile";

export default function NotificationsPage() {
  const { setOpen } = useSidebar();
  const isMobile = useMobile();

  // Group notifications by time period
  const todayNotifications = mockNotifications.filter(
    (notification) =>
      notification.time.includes("m ago") || notification.time.includes("h ago")
  );

  const thisWeekNotifications = mockNotifications.filter(
    (notification) =>
      notification.time.includes("d ago") &&
      Number.parseInt(notification.time) <= 7
  );

  const earlierNotifications = mockNotifications.filter(
    (notification) =>
      notification.time.includes("d ago") &&
      Number.parseInt(notification.time) > 7
  );

  // Expand sidebar on notifications page for desktop
  useEffect(() => {
    if (!isMobile) {
      setOpen(true);
    }
  }, [isMobile, setOpen]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button variant="ghost" size="sm">
          Mark all as read
        </Button>
      </div>

      {todayNotifications.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Today
          </h2>
          <NotificationList notifications={todayNotifications} />
        </>
      )}

      {thisWeekNotifications.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground mt-6 mb-2">
            This Week
          </h2>
          <NotificationList notifications={thisWeekNotifications} />
        </>
      )}

      {earlierNotifications.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground mt-6 mb-2">
            Earlier
          </h2>
          <NotificationList notifications={earlierNotifications} />
        </>
      )}
    </div>
  );
}
