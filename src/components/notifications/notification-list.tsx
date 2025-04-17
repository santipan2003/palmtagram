import type { Notification } from "@/lib/data/mock-data";
import NotificationCard from "@/components/notifications/notification-card";

interface NotificationListProps {
  notifications: Notification[];
}

export default function NotificationList({
  notifications,
}: NotificationListProps) {
  return (
    <div className="space-y-1 rounded-md overflow-hidden">
      {notifications.map((notification) => (
        <NotificationCard key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
