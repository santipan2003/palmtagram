import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, UserPlus, Star } from "lucide-react";

interface NotificationUser {
  name: string;
  avatar: string;
}

interface NotificationProps {
  id: number;
  type: "like" | "comment" | "follow" | "mention";
  user: NotificationUser;
  content: string;
  time: string;
  read: boolean;
}

export default function NotificationCard({
  notification,
}: {
  notification: NotificationProps;
}) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-3 w-3 text-red-500" />;
      case "comment":
        return <MessageCircle className="h-3 w-3 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-3 w-3 text-green-500" />;
      case "mention":
        return <Star className="h-3 w-3 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getActionButton = (type: string) => {
    switch (type) {
      case "follow":
        return (
          <Button size="sm" variant="outline" className="h-8 px-3">
            Follow
          </Button>
        );
      case "comment":
      case "mention":
        return (
          <Button size="sm" variant="outline" className="h-8 px-3">
            Reply
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex items-center p-3 gap-3 hover:bg-accent transition-colors ${
        !notification.read ? "bg-accent/30" : ""
      }`}
    >
      <div className="relative">
        <Avatar className="h-11 w-11 border">
          <AvatarImage
            src={notification.user.avatar}
            alt={notification.user.name}
          />
          <AvatarFallback>{notification.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted">
            {getNotificationIcon(notification.type)}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1">
          <p className="text-sm">
            <span className="font-semibold">{notification.user.name}</span>{" "}
            <span className="text-muted-foreground">
              {notification.content}
            </span>
          </p>
          {!notification.read && (
            <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {notification.time}
        </p>
      </div>

      {getActionButton(notification.type)}
    </div>
  );
}
