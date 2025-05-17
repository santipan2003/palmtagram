import { Notification } from "@/interfaces/notification.interface";
import NotificationCard from "@/components/notifications/notification-card";

interface NotificationListProps {
  notifications: Notification[];
  onDelete?: (notificationId: string) => Promise<boolean>;
}

export default function NotificationList({
  notifications,
  onDelete,
}: NotificationListProps) {
  return (
    <div className="rounded-md overflow-hidden border border-border/40 bg-card/50">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification._id}
          notification={notification}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
