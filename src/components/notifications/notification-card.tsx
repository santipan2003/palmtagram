import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Bell,
  Repeat,
  Trash2,
  UserCheck,
  Loader2,
} from "lucide-react";
import { Notification } from "@/interfaces/notification.interface";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useSocketContext } from "@/contexts/SocketContext";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { profileService } from "@/services/profile.service";

interface NotificationCardProps {
  notification: Notification;
  onDelete?: (notificationId: string) => Promise<boolean>;
}

export default function NotificationCard({
  notification,
  onDelete,
}: NotificationCardProps) {
  const router = useRouter();
  const { markNotificationAsRead, deleteNotification } = useSocketContext();
  const [isDeleting, setIsDeleting] = useState(false);
  const { user: currentUser } = useAuth(); // ดึงข้อมูลผู้ใช้ปัจจุบัน
  const [isFollowing, setIsFollowing] = useState(
    (notification.type === "follow" && notification.data?.isFollowBack) || false
  );
  const [isLoadingFollow, setIsLoadingFollow] = useState(false); // เพิ่ม state สำหรับแสดง loading ขณะกำลังติดตาม

  // ย้าย checkFollowStatus ออกมาจาก useEffect เพื่อให้เรียกใช้ได้จากภายนอก
  const checkFollowStatus = useCallback(async () => {
    if (
      notification.type === "follow" &&
      currentUser &&
      notification.triggeredBy?._id
    ) {
      // ถ้ามีข้อมูล isFollowBack ให้ใช้ค่านั้นเลย
      if (notification.data?.isFollowBack !== undefined) {
        setIsFollowing(notification.data.isFollowBack);
      } else {
        // ถ้าไม่มีค่า isFollowBack ให้เรียก API เหมือนเดิม
        try {
          const status = await profileService.checkFollowStatus(
            notification.triggeredBy._id
          );
          setIsFollowing(status);
        } catch (error) {
          console.error("Error checking follow status:", error);
        }
      }
    }
  }, [
    notification.type,
    notification.triggeredBy?._id,
    notification.data?.isFollowBack,
    currentUser,
  ]);

  // เพิ่มฟังก์ชันสำหรับลบการแจ้งเตือน
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // ป้องกันไม่ให้ทำงานซ้อนกับ onClick ของ div หลัก

    if (isDeleting) return;

    setIsDeleting(true);
    try {
      // ใช้ onDelete prop ถ้ามี หรือใช้ deleteNotification จาก context
      const success = onDelete
        ? await onDelete(notification._id)
        : await deleteNotification(notification._id);

      if (!success) {
        toast.error("ไม่สามารถลบการแจ้งเตือนได้");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการลบการแจ้งเตือน:", error);
      toast.error("เกิดข้อผิดพลาดในการลบการแจ้งเตือน");
    } finally {
      setIsDeleting(false);
    }
  };

  // จัดการการติดตาม/เลิกติดตาม
  const handleFollowToggle = async (e: React.MouseEvent) => {
    console.log("Clicked follow/unfollow button");
    e.stopPropagation(); // ป้องกันการนำทางไปยังโปรไฟล์

    if (!currentUser || !notification.triggeredBy?._id || isLoadingFollow)
      return;

    setIsLoadingFollow(true);

    try {
      if (isFollowing) {
        // ยกเลิกการติดตาม
        await profileService.unfollowUser(notification.triggeredBy._id);
        toast.success(`ยกเลิกการติดตาม @${user.username} แล้ว`);
      } else {
        // เริ่มติดตาม
        await profileService.followUser(notification.triggeredBy._id);
        toast.success(`เริ่มติดตาม @${user.username} แล้ว`);
      }

      // อัพเดทสถานะการติดตาม
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("เกิดข้อผิดพลาดในการติดตาม", {
        description: "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsLoadingFollow(false);
    }
  };

  // ดึงข้อมูลผู้ใช้จากโครงสร้างการแจ้งเตือนที่ซับซ้อน
  const getUserInfo = () => {
    // ตรวจสอบจากเนื้อหาข้อความก่อน (รูปแบบ @username)
    if (notification.content) {
      const usernameMatch = notification.content.match(/@([\w.-]+)/);
      const username = usernameMatch ? usernameMatch[1] : null;

      if (username) {
        // ถ้ามี triggeredBy และ username ตรงกัน ให้ใช้ข้อมูลเพิ่มเติมจาก triggeredBy
        if (
          notification.triggeredBy &&
          notification.triggeredBy.username === username
        ) {
          return {
            username,
            name: notification.triggeredBy.profile?.name,
            avatarUrl: notification.triggeredBy.profile?.avatarUrl,
          };
        }

        // ถ้ามี data และมี username ของผู้กระทำ ให้ใช้ข้อมูลเพิ่มเติมจาก data
        if (
          notification.type === "like" &&
          notification.data?.likerUsername === username
        ) {
          return {
            username,
            name: notification.data.likerProfile?.name,
            avatarUrl: notification.data.likerProfile?.avatarUrl,
          };
        }

        // กรณีมีแค่ username จากเนื้อหา
        return {
          username,
          name: "",
          avatarUrl: null,
        };
      }
    }

    // แหล่งข้อมูลหลักตามลำดับความสำคัญ
    if (notification.triggeredBy) {
      return {
        username: notification.triggeredBy.username,
        name: notification.triggeredBy.profile?.name,
        avatarUrl: notification.triggeredBy.profile?.avatarUrl,
      };
    }

    if (notification.data) {
      if (notification.type === "like") {
        return {
          username: notification.data.likerUsername,
          name: notification.data.likerProfile?.name,
          avatarUrl: notification.data.likerProfile?.avatarUrl,
        };
      }

      if (
        notification.type === "comment" ||
        notification.type === "comment_reply" ||
        notification.type === "reply"
      ) {
        return {
          username:
            notification.data.commenterUsername ||
            notification.data.commentOwnerUsername,
          name:
            notification.data.commenterProfile?.name ||
            notification.data.commentOwnerProfile?.name,
          avatarUrl:
            notification.data.commenterProfile?.avatarUrl ||
            notification.data.commentOwnerProfile?.avatarUrl,
        };
      }
    }

    if (notification.sourceUser) {
      return {
        username: notification.sourceUser.username,
        name: notification.sourceUser.profile?.name,
        avatarUrl: notification.sourceUser.profile?.avatarUrl,
      };
    }

    // Fallback
    return {
      username: "user",
      name: "",
      avatarUrl: "/placeholder-user.png",
    };
  };

  const user = getUserInfo();

  // สร้างข้อความการแจ้งเตือนโดยอิงตามประเภทและเนื้อหา
  const getNotificationMessage = () => {
    // ถ้ามีข้อความที่ฟอร์แมตไว้แล้ว ให้สร้างใหม่โดยใช้ username ที่ถูกต้อง
    if (notification.content) {
      // ไม่ลบชื่อผู้ใช้ออกทั้งหมด แต่ใช้วิธีแยกระหว่างชื่อผู้ใช้และข้อความ
      const contentWithoutUsername = notification.content.replace(
        /@[\w.-]+ /,
        ""
      );
      return contentWithoutUsername;
    }

    switch (notification.type) {
      case "like":
        if (notification.data?.commentId) {
          return `ถูกใจความคิดเห็นของคุณ${
            notification.data.comment
              ? `: "${notification.data.comment.substring(0, 25)}${
                  notification.data.comment.length > 25 ? "..." : ""
                }"`
              : ""
          }`;
        } else {
          return "ถูกใจโพสต์ของคุณ";
        }
      case "comment":
        if (notification.data?.comment) {
          return `แสดงความคิดเห็นในโพสต์ของคุณ: "${notification.data.comment.substring(
            0,
            25
          )}${notification.data.comment.length > 25 ? "..." : ""}"`;
        } else if (
          notification.payload &&
          typeof notification.payload.commentId === "string"
        ) {
          return "แสดงความคิดเห็นในโพสต์ของคุณ";
        } else {
          return "แสดงความคิดเห็นในโพสต์ของคุณ";
        }
      case "comment_reply":
      case "reply": // เพิ่ม case reply โดยตรง
        if (notification.data?.comment) {
          return `ตอบกลับความคิดเห็นของคุณ: "${notification.data.comment.substring(
            0,
            25
          )}${notification.data.comment.length > 25 ? "..." : ""}"`;
        } else {
          return "ตอบกลับความคิดเห็นของคุณ";
        }
      case "follow":
        return "เริ่มติดตามคุณ";
      default:
        return "มีการแจ้งเตือนใหม่";
    }
  };

  // ตรวจสอบสถานะการติดตามเมื่อ component ถูกโหลด
  useEffect(() => {
    checkFollowStatus();
  }, [
    checkFollowStatus,
    notification.type,
    notification.triggeredBy?._id,
    currentUser,
    user.username,
  ]);

  // ฟังก์ชันรับฟังการแจ้งเตือนใหม่แบบ real-time
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const newNotification = event.detail;

      // ตรวจสอบว่าเป็นการแจ้งเตือนของ component นี้หรือไม่
      if (newNotification._id === notification._id) {
        // เรียกใช้ checkFollowStatus เมื่อได้รับการแจ้งเตือนใหม่
        checkFollowStatus();
      }
    };

    // ลงทะเบียนรับฟัง CustomEvent
    window.addEventListener(
      "user:notification-received",
      handleNewNotification as EventListener
    );

    // ทำความสะอาดเมื่อ component unmount
    return () => {
      window.removeEventListener(
        "user:notification-received",
        handleNewNotification as EventListener
      );
    };
  }, [notification._id, checkFollowStatus]);

  // เลือกไอคอนตามประเภทการแจ้งเตือน
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-3 w-3 fill-red-500 text-red-500" />;
      case "comment":
        return (
          <MessageCircle className="h-3 w-3 fill-blue-500 text-blue-500" />
        );
      case "comment_reply":
      case "reply": // เพิ่ม case reply
        return <Repeat className="h-3 w-3 fill-green-500 text-green-500" />;
      case "follow":
        return <UserPlus className="h-3 w-3 text-green-500" />;
      default:
        return <Bell className="h-3 w-3 text-yellow-500" />;
    }
  };

  // นำทางไปยังโพสต์ที่เกี่ยวข้อง
  const navigateToContent = () => {
    // ทำเครื่องหมายว่าอ่านแล้ว
    markNotificationAsRead(notification._id);

    if (
      notification.type === "like" ||
      notification.type === "comment" ||
      notification.type === "comment_reply" ||
      notification.type === "reply"
    ) {
      // ดึงข้อมูลจาก data หรือ payload
      const postId =
        notification.data?.postId ||
        notification.payload?.postId ||
        notification.targetId;

      // ดึงชื่อผู้ใช้ของเจ้าของโพสต์
      const username = notification.data?.postOwnerUsername;

      if (postId) {
        if (username) {
          router.push(`/post/${postId}`);
        } else {
          // หากไม่มี username ให้พยายามนำทางไปยังโพสต์โดยตรง
          router.push(`/posts/${postId}`);
        }
      }
    } else if (notification.type === "follow") {
      // นำทางไปยังโปรไฟล์ผู้ที่กดติดตามเรา
      const username = user.username;
      if (username) {
        router.push(`/${username}`);
      }
    }
  };

  // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: th,
      }).replace("ประมาณ ", "");
    } catch (error) {
      console.error("ไม่สามารถแปลงวันที่ได้:", error);
      return "เมื่อไม่นานมานี้";
    }
  };

  // ดึงภาพตัวอย่างของโพสต์ (ถ้ามี)
  const getPostThumbnail = () => {
    // ตรวจสอบว่ามี postPreview หรือไม่
    if (notification.data?.postPreview?.url) {
      return notification.data.postPreview.url;
    }
    // ถ้าไม่มี postPreview แต่มี type เป็น like หรือ comment ให้ใช้ placeholder
    if (notification.type === "like" || notification.type === "comment") {
      return "/placeholder-post.jpg";
    }
    return null;
  };

  // ตรวจสอบว่าควรแสดงภาพตัวอย่างหรือไม่
  const shouldShowThumbnail = () => {
    // แสดงเฉพาะกรณีมี postPreview
    if (notification.data?.postPreview) {
      return true;
    }

    // หรือกรณีเป็นการไลค์/คอมเมนต์โพสต์ (ไม่ใช่คอมเมนต์)
    return (
      (notification.type === "like" && !notification.data?.commentId) ||
      (notification.type === "comment" && !notification.payload?.replyId)
    );
  };

  return (
    <div
      className={`flex items-center p-4 gap-3 hover:bg-accent/50 transition-colors ${
        !notification.isRead ? "bg-accent/30" : ""
      } cursor-pointer border-b border-border/30`}
      onClick={navigateToContent}
    >
      <div className="relative">
        <Avatar className="h-12 w-12 border">
          <AvatarImage
            src={
              // Try direct notification data first
              (notification.type === "follow" &&
                notification.data?.followerProfile?.avatarUrl) ||
              notification.triggeredBy?.profile?.avatarUrl ||
              notification.data?.likerProfile?.avatarUrl ||
              notification.data?.commenterProfile?.avatarUrl ||
              // Fall back to user object from getUserInfo()
              user.avatarUrl ||
              "/placeholder-user.png"
            }
            alt={user.username || "User"}
          />
          <AvatarFallback>
            {(user.username || "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted">
            {getNotificationIcon(notification.type)}
          </div>
        </div>
      </div>

      {/* เพิ่มปุ่มลบ */}
      <div
        className="absolute right-2 top-2"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 focus:text-red-500"
            >
              {isDeleting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>กำลังลบ...</span>
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>ลบการแจ้งเตือน</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <p className="text-sm leading-snug">
              <span className="font-medium">@{user.username}</span>{" "}
              <span className="text-muted-foreground">
                {getNotificationMessage()}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatTime(notification.createdAt)}
            </p>
          </div>

          {/* ย้ายปุ่มติดตามมาอยู่ทางขวาสุด */}
          <div className="flex items-center gap-1">
            {!notification.isRead && (
              <div className="h-2 w-2 rounded-full bg-blue-500 mr-2 flex-shrink-0" />
            )}

            {notification.type === "follow" &&
              notification.triggeredBy &&
              currentUser && (
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  className="h-7 px-2 text-xs flex items-center gap-1"
                  onClick={handleFollowToggle}
                  disabled={isLoadingFollow}
                >
                  {isLoadingFollow ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="h-3 w-3 mr-1" />
                      กำลังติดตาม
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3 mr-1" />
                      ติดตามกลับ
                    </>
                  )}
                </Button>
              )}
          </div>
        </div>
      </div>

      {/* ภาพตัวอย่างโพสต์ (สำหรับการไลค์หรือคอมเมนต์บนโพสต์) */}
      {shouldShowThumbnail() && (
        <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0 border">
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Image
              src={getPostThumbnail() || "/placeholder-post.jpg"}
              alt="Post thumbnail"
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
