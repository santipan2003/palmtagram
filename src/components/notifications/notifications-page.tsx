"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import NotificationList from "@/components/notifications/notification-list";
import { useSidebar } from "@/components/ui/sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { notificationService } from "@/services/notification.service";
import { Notification } from "@/interfaces/notification.interface";
import { useSocketContext } from "@/contexts/SocketContext";
import { Bell, Loader2 } from "lucide-react";
import { isToday, isThisWeek, parseISO } from "date-fns";
import { toast } from "sonner";

export default function NotificationsPage() {
  const { setOpen } = useSidebar();
  const isMobile = useMobile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    markAllNotificationsAsRead,
    unreadNotificationCount,
    notifications: socketNotifications, // เพิ่มการดึงข้อมูลแจ้งเตือนจาก context
  } = useSocketContext();

  // ใช้ ref เพื่อเก็บ notification IDs ที่มีอยู่แล้วเพื่อป้องกันการแสดงซ้ำ
  const notificationIdsRef = useRef<Set<string>>(new Set());

  // โหลดการแจ้งเตือนเมื่อหน้าถูกโหลด
  useEffect(() => {
    fetchNotifications();
  }, []);

  // ฟังก์ชันดึงข้อมูลการแจ้งเตือน
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.fetchNotifications(50, 0, false);

      // เก็บ IDs ของ notifications ทั้งหมดที่โหลดมา
      const newNotificationIds = new Set(data.map((item) => item._id));
      notificationIdsRef.current = newNotificationIds;

      setNotifications(data);
      console.log("การแจ้งเตือนที่โหลด:", JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("ไม่สามารถดึงข้อมูลการแจ้งเตือนได้:", error);
      toast.error("ไม่สามารถโหลดการแจ้งเตือน", {
        description: "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // จัดการการกด "Mark all as read"
  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllNotificationsAsRead();
      if (success) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, isRead: true }))
        );
        toast.success("ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว");
      }
    } catch (error) {
      console.error("ไม่สามารถทำเครื่องหมายว่าอ่านทั้งหมดได้:", error);
      toast.error("เกิดข้อผิดพลาดในการทำเครื่องหมายอ่านทั้งหมด");
    }
  };

  // ติดตามการเปลี่ยนแปลงของแจ้งเตือนจาก WebSocket
  useEffect(() => {
    if (!socketNotifications?.length) return;

    // ฟิลเตอร์เฉพาะการแจ้งเตือนใหม่ที่ยังไม่มีในรายการ
    const newNotifications = socketNotifications.filter(
      (notification) => !notificationIdsRef.current.has(notification._id)
    );

    if (newNotifications.length > 0) {
      // อัพเดท notificationIdsRef ด้วย IDs ใหม่
      newNotifications.forEach((notification) => {
        notificationIdsRef.current.add(notification._id);
      });

      // อัพเดตรายการแจ้งเตือน โดยใส่การแจ้งเตือนใหม่ไว้ด้านบนสุด
      setNotifications((prev) => [...newNotifications, ...prev]);

      // ส่ง event เพื่อให้ NotificationCard เรียกใช้ checkFollowStatus
      newNotifications.forEach((notification) => {
        window.dispatchEvent(
          new CustomEvent("user:notification-received", {
            detail: notification,
          })
        );
      });
    }
  }, [socketNotifications]);

  // จัดกลุ่มการแจ้งเตือนตามช่วงเวลา
  const groupNotifications = useCallback(() => {
    const today: Notification[] = [];
    const thisWeek: Notification[] = [];
    const earlier: Notification[] = [];

    notifications.forEach((notification) => {
      try {
        const date = parseISO(notification.createdAt);

        if (isToday(date)) {
          today.push(notification);
        } else if (isThisWeek(date)) {
          thisWeek.push(notification);
        } else {
          earlier.push(notification);
        }
      } catch (error) {
        console.error("ไม่สามารถแปลงวันที่ได้:", error);
        // ในกรณีที่มีปัญหากับรูปแบบวันที่ ให้ใส่ในกลุ่ม earlier
        earlier.push(notification);
      }
    });

    return { today, thisWeek, earlier };
  }, [notifications]);

  const { today, thisWeek, earlier } = groupNotifications();

  // เพิ่มการรับฟังการแจ้งเตือนแบบ real-time
  useEffect(() => {
    // จัดการเมื่อมีการแจ้งเตือนแบบ real-time ผ่าน CustomEvent
    const handleNotification = (event: CustomEvent) => {
      const notification = event.detail;
      console.log(
        "ได้รับการแจ้งเตือนใหม่แบบ real-time:",
        JSON.stringify(notification, null, 2)
      );

      // ตรวจสอบว่า notification นี้มีอยู่ในรายการแล้วหรือไม่
      if (!notificationIdsRef.current.has(notification._id)) {
        notificationIdsRef.current.add(notification._id);

        // เพิ่มการแจ้งเตือนใหม่เข้าไปในรายการด้านบนสุด
        setNotifications((prev) => [notification, ...prev]);

        // ส่ง event เพื่อให้ NotificationCard เรียกใช้ checkFollowStatus
        window.dispatchEvent(
          new CustomEvent("user:notification-received", {
            detail: notification,
          })
        );
      }
    };

    // ลงทะเบียนรับฟัง CustomEvent
    window.addEventListener(
      "user:notification-received",
      handleNotification as EventListener
    );

    // ทำความสะอาดเมื่อ component unmount
    return () => {
      window.removeEventListener(
        "user:notification-received",
        handleNotification as EventListener
      );
    };
  }, []);

  // เพิ่ม event listener สำหรับการลบการแจ้งเตือนแบบ real-time
  useEffect(() => {
    // สร้าง handler สำหรับ event เมื่อมีการลบการแจ้งเตือน
    const handleNotificationsDeleted = (event: CustomEvent) => {
      const { notificationIds, timestamp } = event.detail;
      console.log(
        "ได้รับการแจ้งเตือนถูกลบใน NotificationsPage:",
        notificationIds,
        timestamp
      );

      // อัพเดท state เพื่อลบการแจ้งเตือนออก
      setNotifications((prev) =>
        prev.filter(
          (notification) => !notificationIds.includes(notification._id)
        )
      );

      // อัพเดท notificationIdsRef เพื่อไม่ให้แสดงแจ้งเตือนเหล่านี้อีก
      notificationIds.forEach((id: string) => {
        notificationIdsRef.current.delete(id);
      });
    };

    // ลงทะเบียนรับฟัง CustomEvent
    window.addEventListener(
      "user:notifications-deleted",
      handleNotificationsDeleted as EventListener
    );

    // ทำความสะอาดเมื่อ component unmount
    return () => {
      window.removeEventListener(
        "user:notifications-deleted",
        handleNotificationsDeleted as EventListener
      );
    };
  }, []);

  // Expand sidebar on notifications page for desktop
  useEffect(() => {
    if (!isMobile) {
      setOpen(true);
    }
  }, [isMobile, setOpen]);

  // เพิ่มการแสดงเมื่อมีข้อมูลใหม่
  const hasNewNotifications = unreadNotificationCount > 0;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">การแจ้งเตือน</h1>
          {hasNewNotifications && (
            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-medium rounded-full">
              {unreadNotificationCount}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllAsRead}
          disabled={isLoading || unreadNotificationCount === 0}
          className="text-blue-500 hover:text-blue-700 font-medium"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "ทำเครื่องหมายว่าอ่านทั้งหมด"
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-card/50 rounded-md border">
          <div className="flex justify-center">
            <Bell className="h-10 w-10 text-muted-foreground/60 mb-3" />
          </div>
          <h3 className="font-semibold text-lg mb-1">ไม่มีการแจ้งเตือน</h3>
          <p className="text-muted-foreground">
            คุณจะเห็นการแจ้งเตือนเมื่อมีคนกดไลค์ แสดงความคิดเห็น หรือติดตามคุณ
          </p>
        </div>
      ) : (
        <>
          {today.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium mb-1 px-2">วันนี้</h2>
              <NotificationList notifications={today} />
            </div>
          )}

          {thisWeek.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium mb-1 px-2">สัปดาห์นี้</h2>
              <NotificationList notifications={thisWeek} />
            </div>
          )}

          {earlier.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium mb-1 px-2">ก่อนหน้านี้</h2>
              <NotificationList notifications={earlier} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
